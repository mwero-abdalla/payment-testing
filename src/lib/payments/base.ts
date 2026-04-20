import axios, { type AxiosInstance, AxiosError } from "axios";
import { 
  type PaymentInitializationRequest, 
  type PaymentInitializationResult, 
  type PaymentVerificationResult 
} from "./types";

export abstract class AbstractPaymentProvider {
  protected client: AxiosInstance;

  constructor(baseURL: string, timeout = 15000) {
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  abstract initialize(request: PaymentInitializationRequest): Promise<PaymentInitializationResult>;
  abstract verify(trackingId: string): Promise<PaymentVerificationResult>;

  protected handleError(error: unknown, providerName: string): never {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`[${providerName}] ${message}`);
    }
    
    if (error instanceof Error) {
      throw new Error(`[${providerName}] ${error.message}`);
    }

    throw new Error(`[${providerName}] An unknown error occurred`);
  }

  /**
   * Standardizes amount handle (some providers use minor units like cents/kobo)
   */
  protected toMinorUnits(amount: number): number {
    return Math.round(amount * 100);
  }

  protected fromMinorUnits(amount: number): number {
    return amount / 100;
  }
}
