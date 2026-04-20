import { PaystackProvider } from "./providers/paystack";
import { PesapalProvider } from "./providers/pesapal";
import { type PaymentProviderName } from "./types";
import { type AbstractPaymentProvider } from "./base";

export class PaymentGateway {
  private static providers: Map<PaymentProviderName, AbstractPaymentProvider> = new Map();

  static getProvider(name: PaymentProviderName): AbstractPaymentProvider {
    if (this.providers.has(name)) {
      return this.providers.get(name)!;
    }

    let provider: AbstractPaymentProvider;

    switch (name) {
      case "paystack":
        provider = new PaystackProvider();
        break;
      case "pesapal":
        provider = new PesapalProvider();
        break;
      default:
        throw new Error(`Unsupported payment provider: ${name}`);
    }

    this.providers.set(name, provider);
    return provider;
  }

  // Simplified accessors
  static paystack() {
    return this.getProvider("paystack") as PaystackProvider;
  }

  static pesapal() {
    return this.getProvider("pesapal") as PesapalProvider;
  }
}
