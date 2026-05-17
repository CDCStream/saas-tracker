import { BetaAnalyticsDataClient } from "@google-analytics/data";

let cached: BetaAnalyticsDataClient | null = null;

function client(): BetaAnalyticsDataClient {
  if (cached) return cached;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64;
  if (!email || !keyB64) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_B64 missing");
  }
  const parsed = JSON.parse(Buffer.from(keyB64, "base64").toString("utf8"));
  cached = new BetaAnalyticsDataClient({
    credentials: {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    },
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
