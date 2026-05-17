import Link from "next/link";
import { daysSince, daysUntil, formatCents, formatInt } from "@/lib/formatters";
import type { Decision } from "@/lib/gates";
import type { ProductConfig } from "@/lib/types";
import { DecisionPill } from "./GateBadge";

export interface ProductCardData {
  product: ProductConfig;
  signups: number;
  mrrCents: number;
  payingUsers: number;
  decision: Decision;
  error?: string;
}

export function ProductCard({ data }: { data: ProductCardData }) {
  const { product } = data;
  const elapsed = daysSince(product.testStartDate);
  const remaining = daysUntil(
    new Date(
      new Date(product.testStartDate).getTime() +
        product.testDurationDays * 24 * 3600 * 1000
    )
      .toISOString()
      .slice(0, 10)
  );

  return (
    <Link
      href={`/saas/${product.slug}`}
      className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 hover:border-white/20 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{product.name}</div>
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {product.landingUrl.replace(/^https?:\/\//, "")}
          </div>
        </div>
        <DecisionPill decision={data.decision} />
      </div>

      {data.error ? (
        <div className="mt-4 text-xs text-[var(--color-fail)]">
          Data error: {data.error}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <Cell label="MRR" value={formatCents(data.mrrCents)} />
          <Cell label="Paying" value={formatInt(data.payingUsers)} />
          <Cell label="Signups" value={formatInt(data.signups)} />
        </div>
      )}

      <div className="mt-5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>
          Day {Math.max(elapsed, 0)} / {product.testDurationDays}
        </span>
        <span>
          {remaining > 0 ? `${remaining}d left` : "Test window closed"}
        </span>
      </div>
    </Link>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
