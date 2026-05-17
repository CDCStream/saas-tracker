import { google } from "googleapis";
import { googleAuthClient } from "./google/auth";

/**
 * GA4 Data API client. We use the googleapis HTTP REST adapter
 * instead of @google-analytics/data (gRPC) so that:
 *   - errors share the same shape as Search Console (debuggable)
 *   - we don't ship a second auth + transport stack
 *   - the OAuth2Client we built in google/auth.ts plugs in directly
 */
function client() {
  return google.analyticsdata({ version: "v1beta", auth: googleAuthClient() });
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
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];
  const sdk = client();

  const overview = await sdk.properties.runReport({
    property,
    requestBody: {
      dateRanges,
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
    },
  });
  const ovRow = overview.data.rows?.[0]?.metricValues ?? [];
  const sessions = Number(ovRow[0]?.value ?? 0);
  const users = Number(ovRow[1]?.value ?? 0);

  const pages = await sdk.properties.runReport({
    property,
    requestBody: {
      dateRanges,
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [
        { metric: { metricName: "screenPageViews" }, desc: true },
      ],
      limit: "5",
    },
  });
  const topPages = (pages.data.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? "",
    views: Number(r.metricValues?.[0]?.value ?? 0),
  }));

  return { sessions, users, topPages };
}
