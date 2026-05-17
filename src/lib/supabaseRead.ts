import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ProductConfig } from "./types";

const cache = new Map<string, SupabaseClient>();

/**
 * Lazy per-product Supabase client. Service-role keys never leak to the
 * browser because all callers are Server Components / Route Handlers.
 */
export function supabaseFor(product: ProductConfig): SupabaseClient {
  const key = product.slug;
  const existing = cache.get(key);
  if (existing) return existing;

  const client = createClient(
    product.supabase.url,
    product.supabase.serviceRoleKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "saas-tracker" } },
    }
  );
  cache.set(key, client);
  return client;
}
