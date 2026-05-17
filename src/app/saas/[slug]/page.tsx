import Link from "next/link";
import { notFound } from "next/navigation";
import { GoogleApiPanel } from "@/components/GoogleApiPanel";
import { KpiTable } from "@/components/KpiTable";
import { MetricCard } from "@/components/MetricCard";
import { DecisionPill } from "@/components/GateBadge";
import { PhPanel } from "@/components/PhPanel";
import { MrrChart } from "@/components/charts/MrrChart";
import { SignupChart } from "@/components/charts/SignupChart";
import { billingFor } from "@/lib/billing";
import { fetchGa4Snapshot, type Ga4Snapshot } from "@/lib/ga4";
import {
  decideOverall,
  scoreGate1,
  scoreGate2,
  type GateInput,
} from "@/lib/gates";
import { fetchGscSnapshot, type GscSnapshot } from "@/lib/gsc";
import { fetchPhSnapshot } from "@/lib/productHunt";
import { PRODUCTS, getProduct } from "@/lib/products";
import { supabaseFor } from "@/lib/supabaseRead";
import {
  daysSince,
  formatCents,
  formatDate,
  formatInt,
  formatPct,
} from "@/lib/formatters";

export const revalidate = 600;
// Skip build-time prerender when secrets aren't present (e.g. local
// `next build` without an .env). On Vercel the env vars exist so all
// product pages get pre-rendered as expected.
export const dynamicParams = true;

export function generateStaticParams() {
  if (!process.env.LIREFIN_SUPABASE_URL) return [];
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

async function safeGa4(
  propertyId: string | undefined
): Promise<Ga4Snapshot | { error: string } | null> {
  if (!propertyId) return null;
  try {
    return await fetchGa4Snapshot(propertyId, 7);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "GA4 error" };
  }
}

async function safeGsc(
  domain: string | undefined
): Promise<GscSnapshot | { error: string } | null> {
  if (!domain) return null;
  try {
    return await fetchGscSnapshot(domain, 28);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "GSC error" };
  }
}

export default async function SaasDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const hasSupabase = Boolean(
    product.supabase.url && product.supabase.serviceRoleKey
  );
  const supabase = hasSupabase ? supabaseFor(product) : null;
  const billing =
    hasSupabase || product.billing.provider === "dodo"
      ? (() => {
          try {
            return billingFor(product);
          } catch {
            return null;
          }
        })()
      : null;

  const [
    metrics,
    mrrSeries,
    totalSignups,
    daily,
    retention7d,
    ga4,
    gsc,
    phData,
  ] = await Promise.all([
    billing ? billing.getMetrics().catch(() => null) : Promise.resolve(null),
    billing
      ? billing.getMrrTimeseries(60).catch(() => [])
      : Promise.resolve([]),
    supabase
      ? product.supabase.queries.totalSignups(supabase).catch(() => 0)
      : Promise.resolve(0),
    supabase
      ? product.supabase.queries.dailySignups(supabase, 30).catch(() => [])
      : Promise.resolve([]),
    supabase
      ? product.supabase.queries.retention7d(supabase).catch(() => 0)
      : Promise.resolve(0),
    safeGa4(product.ga4PropertyId),
    safeGsc(product.gscDomain),
    product.productHuntUrl
      ? fetchPhSnapshot(product.productHuntUrl).catch(() => null)
      : Promise.resolve(null),
  ]);

  const ga4Sessions =
    ga4 && !("error" in ga4) ? ga4.sessions : 0;
  const gscClicks = gsc && !("error" in gsc) ? gsc.clicks : 0;
  const visitors = ga4Sessions || gscClicks; // best signal we've got pre-Ads

  const phUpvotes =
    phData && typeof phData.votesCount === "number" ? phData.votesCount : 0;
  const reviewAvg =
    phData && phData.reviewsRating > 0 ? phData.reviewsRating : 0;

  const paidConv =
    totalSignups > 0 && metrics
      ? metrics.payingUsers / Math.max(totalSignups, 1)
      : 0;

  const gateInput: GateInput = {
    thresholds: product.thresholds,
    signups: totalSignups,
    visitors,
    cpcUsd: 0, // filled in Phase 6 (Ads)
    phUpvotes,
    retention7d,
    paidConv,
    mrrCents: metrics?.mrrCents ?? 0,
    reviewAvg,
    monthlyChurnRate: metrics?.monthlyChurnRate ?? 0,
  };

  const gate1 = scoreGate1(gateInput);
  const gate2 = scoreGate2(gateInput);
  const elapsed = daysSince(product.testStartDate);
  const decision = decideOverall(
    elapsed,
    product.testDurationDays,
    gate1,
    gate2,
    metrics?.monthlyChurnRate ?? 0,
    product.thresholds.gate2.monthlyChurnScale
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-xs text-[var(--color-text-muted)] hover:underline"
          >
            ← Portfolio
          </Link>
          <h1 className="text-3xl font-semibold mt-2">{product.name}</h1>
          <div className="text-sm text-[var(--color-text-muted)] mt-1">
            Test started {formatDate(product.testStartDate)} • Day{" "}
            {Math.max(elapsed, 0)} of {product.testDurationDays}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <a
              href={product.landingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-text-muted)] underline"
            >
              Landing
            </a>
            {product.webStoreUrl ? (
              <a
                href={product.webStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-text-muted)] underline"
              >
                Web Store
              </a>
            ) : null}
            {product.productHuntUrl ? (
              <a
                href={product.productHuntUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-text-muted)] underline"
              >
                Product Hunt
              </a>
            ) : null}
          </div>
        </div>
        <DecisionPill decision={decision} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="MRR"
          value={metrics ? formatCents(metrics.mrrCents) : "—"}
          hint={
            metrics
              ? `${formatInt(metrics.payingUsers)} paying`
              : "billing error"
          }
        />
        <MetricCard
          label="Signups (total)"
          value={formatInt(totalSignups)}
          hint={`${formatPct(paidConv)} paid conversion`}
        />
        <MetricCard
          label="7-day retention"
          value={formatPct(retention7d)}
          hint="Cohort: signed up 7–30d ago"
        />
        <MetricCard
          label="Monthly churn"
          value={
            metrics ? formatPct(metrics.monthlyChurnRate) : "—"
          }
          hint={
            metrics ? `${metrics.churned30d} cancelled / 30d` : undefined
          }
        />
      </div>

      <KpiTable title="Gate 1 — Day 0–30" rows={gate1} />
      <KpiTable title="Gate 2 — Day 31–60" rows={gate2} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            MRR — last 60 d
          </div>
          {mrrSeries.length > 0 ? (
            <MrrChart data={mrrSeries} />
          ) : (
            <div className="text-sm text-[var(--color-text-muted)]">
              No data yet.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            Daily signups — last 30 d
          </div>
          {daily.length > 0 ? (
            <SignupChart data={daily} />
          ) : (
            <div className="text-sm text-[var(--color-text-muted)]">
              No data yet.
            </div>
          )}
        </div>
      </div>

      <GoogleApiPanel ga4={ga4} gsc={gsc} />

      {product.productHuntUrl ? (
        <PhPanel url={product.productHuntUrl} data={phData} />
      ) : null}
    </div>
  );
}
