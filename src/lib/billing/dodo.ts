import DodoPayments from "dodopayments";
import { format, subDays } from "date-fns";
import { CREDIT_MONTHLY_PRICE_USD } from "./pricing";
import type {
  BillingMetrics,
  BillingProvider,
  MrrPoint,
} from "../types";

interface DodoArgs {
  apiKey: string;
  environment: "live_mode" | "test_mode";
}

/**
 * Dodo Payments adapter. Reads subscriptions + payments lists and turns
 * them into rolling MRR / churn / refund metrics.
 *
 * The list endpoints are paginated. We grab a single first page (the
 * SDK exposes `page_size` up to 100). Once a SaaS crosses 100 active
 * subs we'll add cursor pagination — keeping it simple for now.
 */
export function dodoProvider(args: DodoArgs): BillingProvider {
  const client = new DodoPayments({
    bearerToken: args.apiKey,
    environment: args.environment,
  });

  async function listActiveSubs() {
    const res = await client.subscriptions.list({
      // Dodo accepts a status filter. "active" + "on_trial" both produce
      // billable users; "cancelled" we exclude here because they're
      // counted separately in churn.
      status: "active",
      page_size: 100,
    });
    return res.items ?? [];
  }

  async function listSubsCancelledIn(days: number) {
    const since = subDays(new Date(), days).toISOString();
    const res = await client.subscriptions.list({
      status: "cancelled",
      page_size: 100,
      created_at_gte: since,
    });
    return res.items ?? [];
  }

  async function listPayments(days: number) {
    const since = subDays(new Date(), days).toISOString();
    const res = await client.payments.list({
      page_size: 100,
      created_at_gte: since,
    });
    return res.items ?? [];
  }

  function mrrFromSub(sub: {
    product_id?: string | null;
    recurring_pre_tax_amount?: number | null;
  }): number {
    if (typeof sub.recurring_pre_tax_amount === "number") {
      return sub.recurring_pre_tax_amount; // Dodo returns minor units already
    }
    // Fallback: look up in our local pricing constants.
    const pid = sub.product_id ?? "";
    return (CREDIT_MONTHLY_PRICE_USD[pid] ?? 0) * 100;
  }

  return {
    async getMetrics(): Promise<BillingMetrics> {
      const [active, cancelled, payments] = await Promise.all([
        listActiveSubs(),
        listSubsCancelledIn(30),
        listPayments(30),
      ]);

      const thirtyDaysAgo = subDays(new Date(), 30);

      const mrrCents = active.reduce((sum, s) => sum + mrrFromSub(s), 0);
      const payingUsers = active.length;

      const newPaying30d = active.filter((s) => {
        const createdAt = s.created_at ? new Date(s.created_at) : null;
        return createdAt ? createdAt >= thirtyDaysAgo : false;
      }).length;

      // Standard SaaS monthly churn — denominator is "subs paying at
      // start of period", numerator is "subs from that cohort that
      // churned within the period". Ignoring brand-new signups in
      // both keeps the rate comparable across months.
      const cohortNumerator = cancelled.filter((s) => {
        if (!s.created_at) return false;
        return new Date(s.created_at) < thirtyDaysAgo;
      }).length;

      const cohortAtStart =
        active.filter((s) => {
          if (!s.created_at) return false;
          return new Date(s.created_at) < thirtyDaysAgo;
        }).length + cohortNumerator;

      const monthlyChurnRate =
        cohortAtStart === 0 ? 0 : cohortNumerator / cohortAtStart;

      const churned30d = cancelled.length; // raw count, used elsewhere

      const refunds30dCents = payments
        .filter((p) => (p.status ?? "").toLowerCase().includes("refund"))
        .reduce((sum, p) => sum + (p.total_amount ?? 0), 0);

      const arpuCents = payingUsers === 0 ? 0 : mrrCents / payingUsers;

      return {
        mrrCents,
        payingUsers,
        newPaying30d,
        churned30d,
        monthlyChurnRate,
        refunds30dCents,
        arpuCents,
      };
    },

    async getMrrTimeseries(days: number): Promise<MrrPoint[]> {
      // Cheap approximation: walk current active subs, place each on its
      // creation day, build a step-up cumulative line. Cancelled subs
      // (last 90 d) subtract from the line at their cancel date.
      const [active, cancelled] = await Promise.all([
        listActiveSubs(),
        listSubsCancelledIn(Math.max(days, 90)),
      ]);

      const start = subDays(new Date(), days - 1);
      const timeline: MrrPoint[] = [];
      for (let i = 0; i < days; i++) {
        const day = subDays(new Date(), days - 1 - i);
        const isoDay = format(day, "yyyy-MM-dd");
        const mrrCents = active
          .filter((s) => s.created_at && new Date(s.created_at) <= day)
          .reduce((sum, s) => sum + mrrFromSub(s), 0);
        const cancelledCents = cancelled
          .filter(
            (s) =>
              s.cancelled_at &&
              new Date(s.cancelled_at) <= day &&
              new Date(s.cancelled_at) >= start
          )
          .reduce((sum, s) => sum + mrrFromSub(s), 0);
        timeline.push({ date: isoDay, mrrCents: mrrCents - cancelledCents });
      }
      return timeline;
    },
  };
}
