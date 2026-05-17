import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { googleAuthClient } from "./google/auth";

let cached: BetaAnalyticsDataClient | null = null;

function client(): BetaAnalyticsDataClient {
  if (cached) return cached;
  // Reuse the same OAuth2 client that GSC uses — googleapis hands the
  // access token off to gax, which the GA4 Data API client also
  // consumes via the `authClient` option.
  cached = new BetaAnalyticsDataClient({
    authClient: googleAuthClient() as never,
  });
  return cached;
}

export interface Ga4Snapshot {
  sessions: number;
  users: number;
  topPages: { path: string; views: number }[];
}

export async function fetchGa4Snapshot(
  propertyId: string,
  days = 7
): Promise<Ga4Snapshot> {
  const property = `properties/${propertyId}`;
  const dateRange = { startDate: `${days}daysAgo`, endDate: "today" };

  const [overview] = await client().runReport({
    property,
    dateRanges: [dateRange],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }],
  });
  const ovRow = overview.rows?.[0]?.metricValues ?? [];
  const sessions = Number(ovRow[0]?.value ?? 0);
  const users = Number(ovRow[1]?.value ?? 0);

  const [pages] = await client().runReport({
    property,
    dateRanges: [dateRange],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [
      { metric: { metricName: "screenPageViews" }, desc: true },
    ],
    limit: 5,
  });
  const topPages = (pages.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? "",
    views: Number(r.metricValues?.[0]?.value ?? 0),
  }));

  return { sessions, users, topPages };
}
