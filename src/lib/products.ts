import { lirefinQueries } from "./queries/lirefin";
import { DEFAULT_THRESHOLDS, type ProductConfig } from "./types";

const lirefinDodoEnv = (process.env.LIREFIN_DODO_ENV ?? "live_mode") as
  | "live_mode"
  | "test_mode";

export const PRODUCTS: ProductConfig[] = [
  {
    slug: "lirefin",
    name: "Lirefin",
    landingUrl: "https://www.lirefin.com",
    webStoreUrl:
      "https://chromewebstore.google.com/detail/lirefin-%E2%80%94-ai-financial-ne/elpiafniahnjnmoodadceifmapnclpjj",
    productHuntUrl: undefined,
    testStartDate: "2026-05-17",
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
    gscDomain: "sc-domain:lirefin.com",
  },
];

export function getProduct(slug: string): ProductConfig | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
