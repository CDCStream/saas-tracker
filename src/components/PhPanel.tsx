import type { PhSnapshot } from "@/lib/productHunt";
import { formatInt } from "@/lib/formatters";

export function PhPanel({
  url,
  data,
}: {
  url: string;
  data: PhSnapshot | null;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
          Product Hunt
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[var(--color-text-muted)] underline"
        >
          Open
        </a>
      </div>
      {data == null ? (
        <div className="mt-3 text-sm text-[var(--color-text-muted)]">
          No data — set <code>PRODUCT_HUNT_TOKEN</code> or check the slug.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Upvotes" value={formatInt(data.votesCount)} />
          <Stat label="Comments" value={formatInt(data.commentsCount)} />
          <Stat label="Reviews" value={formatInt(data.reviewsCount)} />
          <Stat
            label="Rating"
            value={
              data.reviewsRating > 0 ? data.reviewsRating.toFixed(2) : "—"
            }
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
