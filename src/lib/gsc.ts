import { google } from "googleapis";
import { format, subDays } from "date-fns";
import { googleAuthClient } from "./google/auth";

export interface GscSnapshot {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  topQueries: {
    query: string;
    clicks: number;
    impressions: number;
    position: number;
  }[];
}

export async function fetchGscSnapshot(
  domain: string,
  days = 28
): Promise<GscSnapshot> {
  const auth = googleAuthClient();
  const sc = google.searchconsole({ version: "v1", auth });

  const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
  const endDate = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const totals = await sc.searchanalytics.query({
    siteUrl: domain,
    requestBody: {
      startDate,
      endDate,
      dimensions: [],
    },
  });
  const t = totals.data.rows?.[0];

  const queries = await sc.searchanalytics.query({
    siteUrl: domain,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 10,
    },
  });
  const topQueries = (queries.data.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    position: r.position ?? 0,
  }));

  return {
    clicks: t?.clicks ?? 0,
    impressions: t?.impressions ?? 0,
    ctr: t?.ctr ?? 0,
    position: t?.position ?? 0,
    topQueries,
  };
}
