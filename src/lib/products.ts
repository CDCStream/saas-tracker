import { lirefinQueries } from "./queries/lirefin";
import { DEFAULT_THRESHOLDS, type ProductConfig } from "./types";

/**
 * Hard cap on the portfolio. Concentration rule: never split attention
 * across more than 2 products at once. When a product fails its gates,
 * run the kill protocol (KILL-PROTOCOL.md) before adding a new one.
 *
 * The runtime assertion below catches accidental 3rd entries on import.
 */
export const MAX_PORTFOLIO_SIZE = 2;

const lirefinDodoEnv = (process.env.LIREFIN_DODO_ENV ?? "live_mode") as
  | "live_mode"
  | "test_mode";

/**
 * Test window starts the day distribution is *actually live* —
 * Ads campaign live + PH launched + Outrank publishing — not the day
 * the dashboard ships. Set this in Vercel the day all three channels
 * are open. Default falls back to today so a fresh deploy still
 * renders something sensible.
 */
const lirefinTestStart =
  process.env.LIREFIN_TEST_START_DATE ?? new Date().toISOString().slice(0, 10);

export const PRODUCTS: ProductConfig[] = [
  {
    slug: "lirefin",
    name: "Lirefin",
    landingUrl: "https://www.lirefin.com",
    webStoreUrl:
      "https://chromewebstore.google.com/detail/lirefin-%E2%80%94-ai-financial-ne/elpiafniahnjnmoodadceifmapnclpjj",
    productHuntUrl: undefined,
    testStartDate: lirefinTestStart,
    testDurationDays: 60,
    thresholds: DEFAULT_THRESHOLDS,
    supabase: {
      url: process.env.LIREFIN_SUPABASE_URL ?? "",
      serviceRoleKey: process.env.LIREFIN_SUPABASE_SERVICE_KEY ?? "",
      queries: lirefinQueries,
    },
    billing: {
      provider: "dodo",
      apiKey: process.env.LIREFIN_DODO_API_KEY ?? "",
      environment: lirefinDodoEnv,
    },
    ga4PropertyId: process.env.LIREFIN_GA4_PROPERTY_ID,
    // GSC siteUrl format depends on the property type:
    //   Domain property      → "sc-domain:lirefin.com"
    //   URL prefix property  → "https://www.lirefin.com/" (trailing slash!)
    // Default below covers Lirefin's URL-prefix verification; override
    // via env if you swap to a Domain property later.
    gscDomain:
      process.env.LIREFIN_GSC_SITE_URL ?? "https://www.lirefin.com/",
  },
];

if (PRODUCTS.length > MAX_PORTFOLIO_SIZE) {
  throw new Error(
    `Portfolio cap exceeded: ${PRODUCTS.length} products in PRODUCTS, ` +
      `max is ${MAX_PORTFOLIO_SIZE}. Run KILL-PROTOCOL.md on a failing ` +
      `product first, then add the new one.`
  );
}

export function getProduct(slug: string): ProductConfig | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function openSlots(): number {
  return Math.max(0, MAX_PORTFOLIO_SIZE - PRODUCTS.length);
}
