/**
 * Application environment configuration.
 * Determines if we are in 'sandbox' or 'production' mode.
 */
export const APP_ENV =
  process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || "sandbox";

/**
 * Checks if the application is currently running in sandbox mode.
 */
export const isSandbox = APP_ENV === "sandbox";

/**
 * Adjusts the payment amount based on the current environment.
 * In 'sandbox' mode, any amount is forced to KES 1 to facilitate real-world testing.
 * In 'production' mode, the original amount is returned.
 *
 * @param amount The original amount to be processed.
 * @returns The adjusted amount (1 for sandbox, original for production).
 */
export function adjustAmount(amount: number): number {
  if (isSandbox) {
    return 1;
  }
  return amount;
}
