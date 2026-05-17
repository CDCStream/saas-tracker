import type { BillingProvider, ProductConfig } from "../types";
import { dodoProvider } from "./dodo";
import { supabaseFallbackProvider } from "./supabaseFallback";

/**
 * Returns the right BillingProvider for a product. Adding a new
 * processor (Stripe, Paddle, …) is a new file under `billing/` plus a
 * new branch in this switch.
 */
export function billingFor(product: ProductConfig): BillingProvider {
  switch (product.billing.provider) {
    case "dodo":
      return dodoProvider({
        apiKey: product.billing.apiKey,
        environment: product.billing.environment,
      });
    case "supabase-fallback":
      return supabaseFallbackProvider(product);
  }
}

export type { BillingProvider } from "../types";
