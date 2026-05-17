import { format, subDays } from "date-fns";
import type {
  BillingMetrics,
  BillingProvider,
  MrrPoint,
  ProductConfig,
} from "../types";
import { supabaseFor } from "../supabaseRead";

/**
 * Used by SaaS that don't have a Dodo / Stripe API hooked into the
 * dashboard yet — falls back to whatever rows live in the SaaS' own
 * `subscriptions` table. Schema assumption: rows with `status='active'`
 * and a `monthly_price_cents` column.
 */
export function supabaseFallbackProvider(
  product: ProductConfig
): BillingProvider {
  return {
    async getMetrics(): Promise<BillingMetrics> {
      const supabase = supabaseFor(product);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, monthly_price_cents, created_at, cancelled_at");
      if (error) throw error;
      const rows = data ?? [];

      const thirtyDaysAgo = subDays(new Date(), 30);

      const active = rows.filter((r) => r.status === "active");
      const cancelled30d = rows.filter(
        (r) =>
          r.cancelled_at &&
          new Date(r.cancelled_at as string) >= thirtyDaysAgo
      );
      const newPaying30d = active.filter(
        (r) => new Date(r.created_at as string) >= thirtyDaysAgo
      ).length;

      const mrrCents = active.reduce(
        (sum, r) => sum + ((r.monthly_price_cents as number) ?? 0),
        0
      );
      const payingUsers = active.length;
      const churned30d = cancelled30d.length;

      // Same cohort-based churn as the Dodo provider — keeps the metric
      // comparable across products no matter which billing source we
      // read from.
      const cohortNumerator = cancelled30d.filter(
        (r) => new Date(r.created_at as string) < thirtyDaysAgo
      ).length;
      const cohortAtStart =
        active.filter(
          (r) => new Date(r.created_at as string) < thirtyDaysAgo
        ).length + cohortNumerator;
      const monthlyChurnRate =
        cohortAtStart === 0 ? 0 : cohortNumerator / cohortAtStart;

      const arpuCents = payingUsers === 0 ? 0 : mrrCents / payingUsers;

      return {
        mrrCents,
        payingUsers,
        newPaying30d,
        churned30d,
        monthlyChurnRate,
        refunds30dCents: 0, // unknown without payment provider feed
        arpuCents,
      };
    },

    async getMrrTimeseries(days: number): Promise<MrrPoint[]> {
      const supabase = supabaseFor(product);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, monthly_price_cents, created_at, cancelled_at");
      if (error) throw error;
      const rows = data ?? [];

      const points: MrrPoint[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const mrrCents = rows
          .filter((r) => {
            const created = r.created_at
              ? new Date(r.created_at as string)
              : null;
            const cancelled = r.cancelled_at
              ? new Date(r.cancelled_at as string)
              : null;
            if (!created || created > day) return false;
            if (cancelled && cancelled <= day) return false;
            return true;
          })
          .reduce(
            (sum, r) => sum + ((r.monthly_price_cents as number) ?? 0),
            0
          );
        points.push({ date: format(day, "yyyy-MM-dd"), mrrCents });
      }
      return points;
    },
  };
}
