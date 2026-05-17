import { format, subDays } from "date-fns";
import type { SaasQueries, SupabaseLike } from "../types";

/**
 * Lirefin-specific Supabase queries. The schema lives in the parent
 * project under `supabase/migrations/`:
 *   - auth.users           (Supabase Auth — used for total signups)
 *   - analyses             (one row per analysis run — used for retention)
 *   - credit_transactions  (kind='signup_bonus' marks new accounts too)
 */
export const lirefinQueries: SaasQueries = {
  async totalSignups(supabase) {
    // auth schema is exposed via service role. Count() instead of fetching rows.
    const { count, error } = await supabase
      .schema("auth")
      .from("users")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },

  async dailySignups(supabase: SupabaseLike, days: number) {
    const since = subDays(new Date(), days).toISOString();
    const { data, error } = await supabase
      .schema("auth")
      .from("users")
      .select("created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      buckets.set(format(subDays(new Date(), i), "yyyy-MM-dd"), 0);
    }
    for (const row of data ?? []) {
      const day = format(new Date(row.created_at as string), "yyyy-MM-dd");
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    }
    return Array.from(buckets, ([date, count]) => ({ date, count }));
  },

  async retention7d(supabase) {
    // Cohort: users who signed up 7-30 days ago.
    // "Returned" = at least one row in `analyses` between day 1 and day 7
    // after their signup (we proxy "came back" with "ran an analysis").
    const cohortStart = subDays(new Date(), 30).toISOString();
    const cohortEnd = subDays(new Date(), 7).toISOString();

    const { data: cohort, error: cohortError } = await supabase
      .schema("auth")
      .from("users")
      .select("id, created_at")
      .gte("created_at", cohortStart)
      .lte("created_at", cohortEnd);
    if (cohortError) throw cohortError;
    if (!cohort || cohort.length === 0) return 0;

    const ids = cohort.map((u) => u.id as string);
    const { data: analyses, error: analysesError } = await supabase
      .from("analyses")
      .select("user_id, created_at")
      .in("user_id", ids);
    if (analysesError) throw analysesError;

    const byUser = new Map<string, Date[]>();
    for (const row of analyses ?? []) {
      const uid = row.user_id as string;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)!.push(new Date(row.created_at as string));
    }

    let returned = 0;
    for (const u of cohort) {
      const created = new Date(u.created_at as string);
      const day1 = new Date(created.getTime() + 24 * 3600 * 1000);
      const day7 = new Date(created.getTime() + 7 * 24 * 3600 * 1000);
      const events = byUser.get(u.id as string) ?? [];
      if (events.some((e) => e >= day1 && e <= day7)) returned++;
    }
    return returned / cohort.length;
  },
};
