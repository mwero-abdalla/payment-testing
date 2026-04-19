import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

import { AppConfig } from "../models/AppConfig";
import { connectToDatabase } from "./mongoose";

const PESAPAL_TOKEN_CONFIG_KEY = "pesapal.auth.token";

type StoredPesapalToken = {
  value: string;
  expiresAt: number;
};

function createPesapalClient(): AxiosInstance {
  return axios.create({
    baseURL:
      process.env.PESAPAL_BASE_URL ?? "https://cybqa.pesapal.com/pesapalv3",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 15000,
  });
}

function getPesapalCredentials(): {
  consumerKey: string;
  consumerSecret: string;
} {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET must be set in your environment.",
    );
  }

  return { consumerKey, consumerSecret };
}

const authTokenResponseSchema = z.object({
  token: z.string(),
  expiryDate: z.string().optional(),
});

const initializePesapalResponseSchema = z.object({
  order_tracking_id: z.string(),
  merchant_reference: z.string(),
  redirect_url: z.string().url(),
  error: z
    .object({
      type: z.string().optional(),
      code: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});

const verifyPesapalResponseSchema = z.object({
  payment_status_description: z.string().optional(),
  payment_method: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  merchant_reference: z.string().optional(),
  tracking_id: z.string().optional(),
  confirmation_code: z.string().optional(),
  payment_status_code: z
    .string()
    .or(z.number())
    .optional()
    .transform((value) => (value === undefined ? undefined : String(value))),
});

const registerPesapalIpnResponseSchema = z.object({
  ipn_id: z.string().optional(),
  ipn_url: z.string().optional(),
  url: z.string().optional(),
  created_date: z.string().optional(),
  status: z.string().optional(),
  error: z
    .object({
      type: z.string().optional(),
      code: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
});

const ipnListEntrySchema = z.object({
  ipn_id: z.string().optional(),
  ipn_url: z.string().optional(),
  url: z.string().optional(),
  status: z.string().optional(),
  notification_type: z.string().optional(),
});

const getPesapalIpnListResponseSchema = z.array(ipnListEntrySchema).or(
  z.object({
    data: z.array(ipnListEntrySchema).optional(),
  }),
);

export type InitializePesapalPaymentInput = {
  reference: string;
  amount: number;
  currency?: string;
  description: string;
  callbackUrl?: string;
  notificationId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

export type PesapalIpnEntry = {
  ipnId: string;
  url: string;
  status?: string;
  notificationType?: string;
  raw: unknown;
};

export type VerifyPesapalPaymentResult = {
  trackingId: string;
  statusCode?: string;
  statusDescription?: string;
  amount?: number;
  currency?: string;
  merchantReference?: string;
  rawResponse: unknown;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const pesapalClient = createPesapalClient();
  const { consumerKey, consumerSecret } = getPesapalCredentials();

  // 1. Check memory cache
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) {
    return cachedToken.value;
  }

  // 2. Check Database cache
  await connectToDatabase();
  const doc = await AppConfig.findOne({ key: PESAPAL_TOKEN_CONFIG_KEY });

  if (doc?.value) {
    const value = doc.value as StoredPesapalToken;
    if (value.expiresAt > Date.now() + 30000) {
      cachedToken = value;
      return value.value;
    }
  }

  // 3. Request new token from Pesapal
  const response = await pesapalClient.post("/api/Auth/RequestToken", {
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
  });

  const parsed = authTokenResponseSchema.parse(response.data);

  // Expiry usually comes as a date string, convert to timestamp
  const expiresAt = parsed.expiryDate
    ? new Date(parsed.expiryDate).getTime()
    : Date.now() + 4 * 60 * 1000;

  const newToken: StoredPesapalToken = {
    value: parsed.token,
    expiresAt,
  };

  // 4. Update both memory and DB
  cachedToken = newToken;

  await AppConfig.findOneAndUpdate(
    { key: PESAPAL_TOKEN_CONFIG_KEY },
    { key: PESAPAL_TOKEN_CONFIG_KEY, value: newToken },
    { upsert: true, new: true },
  );

  return parsed.token;
}

export async function initializePayment(
  payload: InitializePesapalPaymentInput,
) {
  const pesapalClient = createPesapalClient();

  if (payload.amount <= 0) {
    throw new Error("Pesapal initialization requires amount greater than 0.");
  }

  const accessToken = await getAccessToken();

  const response = await pesapalClient.post(
    "/api/Transactions/SubmitOrderRequest",
    {
      id: payload.reference,
      currency: payload.currency ?? "KES",
      amount: payload.amount,
      description: payload.description,
      callback_url: payload.callbackUrl ?? process.env.PESAPAL_CALLBACK_URL,
      notification_id: payload.notificationId ?? process.env.PESAPAL_IPN_ID,
      billing_address: {
        email_address: payload.email,
        phone_number: payload.phoneNumber,
        country_code: "KE",
        first_name: payload.firstName,
        middle_name: "",
        last_name: payload.lastName,
        line_1: "N/A",
        line_2: "",
        city: "Nairobi",
        state: "Nairobi",
        postal_code: "00100",
        zip_code: "00100",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const parsed = initializePesapalResponseSchema.parse(response.data);

  if (parsed.error?.message) {
    throw new Error(`Pesapal initialization failed: ${parsed.error.message}`);
  }

  return {
    orderTrackingId: parsed.order_tracking_id,
    merchantReference: parsed.merchant_reference,
    redirectUrl: parsed.redirect_url,
    rawResponse: response.data,
  };
}

export async function verifyPayment(
  trackingId: string,
): Promise<VerifyPesapalPaymentResult> {
  const pesapalClient = createPesapalClient();

  if (!trackingId) {
    throw new Error("Pesapal verification requires a tracking ID.");
  }

  const accessToken = await getAccessToken();

  const response = await pesapalClient.get(
    `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const parsed = verifyPesapalResponseSchema.parse(response.data);

  return {
    trackingId,
    statusCode: parsed.payment_status_code,
    statusDescription: parsed.payment_status_description,
    amount: parsed.amount,
    currency: parsed.currency,
    merchantReference: parsed.merchant_reference,
    rawResponse: response.data,
  };
}

export async function listIpnRegistrations(): Promise<Array<PesapalIpnEntry>> {
  const pesapalClient = createPesapalClient();
  const accessToken = await getAccessToken();

  const response = await pesapalClient.get("/api/URLSetup/GetIpnList", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const parsed = getPesapalIpnListResponseSchema.parse(response.data);
  const entries = Array.isArray(parsed) ? parsed : (parsed.data ?? []);

  const normalizedEntries: Array<PesapalIpnEntry> = [];

  for (const entry of entries) {
    const ipnId = entry.ipn_id;
    const url = entry.ipn_url ?? entry.url;

    if (!ipnId || !url) {
      continue;
    }

    normalizedEntries.push({
      ipnId,
      url,
      status: entry.status,
      notificationType: entry.notification_type,
      raw: entry,
    });
  }

  return normalizedEntries;
}

export async function registerIpnUrl(
  webhookUrl: string,
): Promise<PesapalIpnEntry> {
  if (!webhookUrl) {
    throw new Error("Pesapal IPN registration requires a webhook URL.");
  }

  const pesapalClient = createPesapalClient();
  const accessToken = await getAccessToken();

  const response = await pesapalClient.post(
    "/api/URLSetup/RegisterIPN",
    {
      url: webhookUrl,
      ipn_notification_type: "POST",
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const parsed = registerPesapalIpnResponseSchema.parse(response.data);

  if (parsed.error?.message) {
    throw new Error(`Pesapal IPN registration failed: ${parsed.error.message}`);
  }

  const ipnId = parsed.ipn_id;
  const url = parsed.ipn_url ?? parsed.url ?? webhookUrl;

  if (!ipnId) {
    throw new Error("Pesapal IPN registration did not return an ipn_id.");
  }

  return {
    ipnId,
    url,
    status: parsed.status,
    notificationType: "POST",
    raw: response.data,
  };
}

export async function resolveOrRegisterIpn(
  webhookUrl: string,
): Promise<PesapalIpnEntry> {
  const existing = (await listIpnRegistrations()).find(
    (entry) => entry.url === webhookUrl,
  );

  if (existing) {
    return existing;
  }

  return registerIpnUrl(webhookUrl);
}
