import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
  throw new Error(
    "PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET must be set in your environment.",
  );
}

const pesapalClient: AxiosInstance = axios.create({
  baseURL:
    process.env.PESAPAL_BASE_URL ?? "https://cybqa.pesapal.com/pesapalv3",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

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

export type InitializePesapalPaymentInput = {
  reference: string;
  amount: number;
  currency?: string;
  description: string;
  callbackUrl?: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
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
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const response = await pesapalClient.post("/api/Auth/RequestToken", {
    consumer_key: PESAPAL_CONSUMER_KEY,
    consumer_secret: PESAPAL_CONSUMER_SECRET,
  });

  const parsed = authTokenResponseSchema.parse(response.data);

  const expiresAt = parsed.expiryDate
    ? new Date(parsed.expiryDate).getTime()
    : Date.now() + 4 * 60 * 1000;

  cachedToken = {
    value: parsed.token,
    expiresAt,
  };

  return parsed.token;
}

export async function initializePayment(
  payload: InitializePesapalPaymentInput,
) {
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
      notification_id: process.env.PESAPAL_IPN_ID,
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
