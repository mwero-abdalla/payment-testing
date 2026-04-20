export type PaymentProviderName = "paystack" | "pesapal";

export interface PaymentItem {
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentInitializationRequest {
  reference: string;
  amount: number;
  currency: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  description?: string;
  callbackUrl?: string;
  items: PaymentItem[];
  metadata?: Record<string, unknown>;
  notificationId?: string;
}

export interface PaymentInitializationResult {
  success: boolean;
  reference: string;
  trackingId: string;
  authorizationUrl?: string;
  redirectUrl?: string;
  message?: string;
  rawResponse: unknown;
}

export type PaymentStatus =
  | "pending"
  | "initialized"
  | "successful"
  | "failed"
  | "cancelled";

export interface PaymentVerificationResult {
  success: boolean;
  reference: string;
  trackingId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt?: string | null;
  message?: string;
  rawResponse: unknown;
}

export interface IPNRegistrationResult {
  success: boolean;
  ipnId: string;
  url: string;
  status?: string;
  rawResponse: unknown;
}
