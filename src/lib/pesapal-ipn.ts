import { AppConfig } from "@/models/AppConfig";
import { connectToDatabase } from "@/lib/mongoose";
import { type PesapalIpnEntry, resolveOrRegisterIpn } from "@/lib/pesapal";

const PESAPAL_IPN_CONFIG_KEY = "pesapal.ipn.current";

type StoredPesapalIpnConfig = {
  ipnId: string;
  webhookUrl: string;
  providerStatus?: string;
  syncedAt: string;
};

async function getStoredIpnConfig(): Promise<StoredPesapalIpnConfig | null> {
  const doc = await AppConfig.findOne({ key: PESAPAL_IPN_CONFIG_KEY });

  if (!doc || typeof doc.value !== "object" || doc.value === null) {
    return null;
  }

  const value = doc.value as Partial<StoredPesapalIpnConfig>;

  if (typeof value.ipnId !== "string" || typeof value.webhookUrl !== "string") {
    return null;
  }

  return {
    ipnId: value.ipnId,
    webhookUrl: value.webhookUrl,
    providerStatus:
      typeof value.providerStatus === "string"
        ? value.providerStatus
        : undefined,
    syncedAt:
      typeof value.syncedAt === "string"
        ? value.syncedAt
        : new Date().toISOString(),
  };
}

export async function saveIpnConfig(
  entry: PesapalIpnEntry,
  webhookUrl: string,
) {
  await connectToDatabase();

  const payload: StoredPesapalIpnConfig = {
    ipnId: entry.ipnId,
    webhookUrl,
    providerStatus: entry.status,
    syncedAt: new Date().toISOString(),
  };

  await AppConfig.findOneAndUpdate(
    { key: PESAPAL_IPN_CONFIG_KEY },
    { key: PESAPAL_IPN_CONFIG_KEY, value: payload },
    { upsert: true, new: true },
  );

  return payload;
}

export async function syncPesapalIpn(webhookUrl: string) {
  if (!webhookUrl) {
    throw new Error("PESAPAL_WEBHOOK_URL must be set to sync Pesapal IPN.");
  }

  const resolved = await resolveOrRegisterIpn(webhookUrl);
  const stored = await saveIpnConfig(resolved, webhookUrl);

  return {
    provider: resolved,
    stored,
  };
}

export async function resolvePesapalNotificationId(): Promise<{
  notificationId: string;
  source: "database" | "env";
}> {
  await connectToDatabase();

  const stored = await getStoredIpnConfig();

  if (stored?.ipnId) {
    return {
      notificationId: stored.ipnId,
      source: "database",
    };
  }

  const envIpnId = process.env.PESAPAL_IPN_ID;

  if (envIpnId) {
    return {
      notificationId: envIpnId,
      source: "env",
    };
  }

  throw new Error(
    "Missing Pesapal IPN ID. Sync via /api/v1/pesapal/ipn/sync or set PESAPAL_IPN_ID.",
  );
}
