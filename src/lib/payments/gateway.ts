import type { AbstractPaymentProvider } from "./base";
import { PaystackProvider } from "./providers/paystack";
import { PesapalProvider } from "./providers/pesapal";
import type { PaymentProviderName } from "./types";

export class PaymentGateway {
  private static providers: Map<PaymentProviderName, AbstractPaymentProvider> =
    new Map();

  static getProvider(name: PaymentProviderName): AbstractPaymentProvider {
    if (PaymentGateway.providers.has(name)) {
      return PaymentGateway.providers.get(name)!;
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

    PaymentGateway.providers.set(name, provider);
    return provider;
  }

  // Simplified accessors
  static paystack() {
    return PaymentGateway.getProvider("paystack") as PaystackProvider;
  }

  static pesapal() {
    return PaymentGateway.getProvider("pesapal") as PesapalProvider;
  }
}
