/**
 * Shared types for the dashboard. Keep this surface small — the heavy
 * lifting lives in the per-source adapters under `src/lib/`.
 */

export interface SaasQueries {
  /**
   * Total signups since the start of the test window (cumulative).
   */
  totalSignups: (supabase: SupabaseLike) => Promise<number>;
  /**
   * Daily new signups for the last `days` days. Returned in ascending
   * date order so charts can render straight away.
   */
  dailySignups: (
    supabase: SupabaseLike,
    days: number
  ) => Promise<{ date: string; count: number }[]>;
  /**
   * Cohort-style 7-day retention: % of users who signed up at least 7
   * days ago AND came back at least once between day 1 and day 7.
   * Each SaaS defines what "came back" means (see queries/<slug>.ts).
   */
  retention7d: (supabase: SupabaseLike) => Promise<number>;
}

export interface BillingMetrics {
  mrrCents: number;
  payingUsers: number;
  newPaying30d: number;
  churned30d: number;
  monthlyChurnRate: number;
  refunds30dCents: number;
  arpuCents: number;
}

export interface MrrPoint {
  date: string;
  mrrCents: number;
}

export interface BillingProvider {
  getMetrics(): Promise<BillingMetrics>;
  getMrrTimeseries(days: number): Promise<MrrPoint[]>;
}

/**
 * Thresholds match `docs/GROWTH-PIPELINE.md` in the parent project.
 * Tweak per product if a SaaS has different ARPU expectations.
 */
export interface GateThresholds {
  gate1: {
    signupsPass: number;
    signupsFail: number;
    visitorsPass: number;
    visitorsFail: number;
    cpcPass: number;
    cpcFail: number;
    phUpvotesPass: number;
    phUpvotesFail: number;
  };
  gate2: {
    retentionPass: number;
    retentionFail: number;
    paidConvPass: number;
    paidConvFail: number;
    mrrCentsPass: number;
    mrrCentsFail: number;
    reviewPass: number;
    reviewFail: number;
    monthlyChurnScale: number;
  };
}

export const DEFAULT_THRESHOLDS: GateThresholds = {
  gate1: {
    signupsPass: 150,
    signupsFail: 50,
    visitorsPass: 2000,
    visitorsFail: 500,
    cpcPass: 2,
    cpcFail: 5,
    phUpvotesPass: 100,
    phUpvotesFail: 30,
  },
  gate2: {
    retentionPass: 0.2,
    retentionFail: 0.08,
    paidConvPass: 0.02,
    paidConvFail: 0.005,
    mrrCentsPass: 20000, // $200
    mrrCentsFail: 5000, // $50
    reviewPass: 4.0,
    reviewFail: 3.0,
    monthlyChurnScale: 0.1,
  },
};

export interface ProductConfig {
  slug: string;
  name: string;
  landingUrl: string;
  webStoreUrl?: string;
  productHuntUrl?: string;
  testStartDate: string; // ISO yyyy-mm-dd
  testDurationDays: number;
  thresholds: GateThresholds;
  supabase: {
    url: string;
    serviceRoleKey: string;
    queries: SaasQueries;
  };
  billing:
    | {
        provider: "dodo";
        apiKey: string;
        environment: "live_mode" | "test_mode";
      }
    | { provider: "supabase-fallback" };
  ga4PropertyId?: string;
  gscDomain?: string; // e.g. "sc-domain:lirefin.com"
  googleAdsCustomerId?: string; // Phase 6
}

/**
 * Minimal Supabase client surface our queries need. Lets us keep the
 * dependency on `@supabase/supabase-js` shallow + easy to mock in tests.
 */
export type SupabaseLike = import("@supabase/supabase-js").SupabaseClient;
