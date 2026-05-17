import type { Ga4Snapshot } from "@/lib/ga4";
import type { GscSnapshot } from "@/lib/gsc";
import { formatInt, formatPct } from "@/lib/formatters";

export function GoogleApiPanel({
  ga4,
  gsc,
}: {
  ga4: Ga4Snapshot | { error: string } | null;
  gsc: GscSnapshot | { error: string } | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
        <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          GA4 (last 7 d)
        </div>
        {ga4 == null ? (
          <Empty label="No GA4 property configured" />
        ) : "error" in ga4 ? (
          <ErrorBox msg={ga4.error} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Sessions" value={formatInt(ga4.sessions)} />
              <Stat label="Users" value={formatInt(ga4.users)} />
            </div>
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Top pages
              </div>
              <ul className="text-sm space-y-1">
                {ga4.topPages.map((p) => (
                  <li
                    key={p.path}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-[var(--color-text-muted)]">
                      {p.path}
                    </span>
                    <span className="tabular-nums">{formatInt(p.views)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
        <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Search Console (28 d)
        </div>
        {gsc == null ? (
          <Empty label="No GSC domain configured" />
        ) : "error" in gsc ? (
          <ErrorBox msg={gsc.error} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Clicks" value={formatInt(gsc.clicks)} />
              <Stat label="Impressions" value={formatInt(gsc.impressions)} />
              <Stat label="CTR" value={formatPct(gsc.ctr)} />
              <Stat label="Avg. position" value={gsc.position.toFixed(1)} />
            </div>
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                Top queries
              </div>
              <ul className="text-sm space-y-1">
                {gsc.topQueries.slice(0, 5).map((q) => (
                  <li
                    key={q.query}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-[var(--color-text-muted)]">
                      {q.query}
                    </span>
                    <span className="tabular-nums">{formatInt(q.clicks)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-sm text-[var(--color-text-muted)]">{label}</div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="text-xs text-[var(--color-fail)] break-all">{msg}</div>
  );
}
