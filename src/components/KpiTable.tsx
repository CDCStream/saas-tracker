import type { GateRow } from "@/lib/gates";
import { GateBadge } from "./GateBadge";
import { formatCents, formatInt, formatPct } from "@/lib/formatters";

function formatValue(row: GateRow): string {
  switch (row.format) {
    case "currency":
      return row.metric === "MRR"
        ? formatCents(row.current)
        : `$${row.current.toFixed(2)}`;
    case "percent":
      return formatPct(row.current);
    case "rating":
      return row.current.toFixed(2);
    default:
      return formatInt(row.current);
  }
}

function formatThreshold(value: number, format: GateRow["format"]): string {
  switch (format) {
    case "currency":
      return value >= 100 ? formatCents(value) : `$${value.toFixed(2)}`;
    case "percent":
      return formatPct(value);
    case "rating":
      return value.toFixed(2);
    default:
      return formatInt(value);
  }
}

export function KpiTable({
  title,
  rows,
}: {
  title: string;
  rows: GateRow[];
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-muted)]">
          {title}
        </h2>
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-[var(--color-text-muted)]">
          <tr>
            <th className="px-5 py-2 text-left font-normal">Metric</th>
            <th className="px-5 py-2 text-right font-normal">Current</th>
            <th className="px-5 py-2 text-right font-normal">Pass</th>
            <th className="px-5 py-2 text-right font-normal">Fail</th>
            <th className="px-5 py-2 text-right font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.metric}
              className="border-t border-[var(--color-border)]"
            >
              <td className="px-5 py-3">{row.metric}</td>
              <td className="px-5 py-3 text-right tabular-nums font-semibold">
                {formatValue(row)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                {row.goalDirection === "higher" ? "≥ " : "≤ "}
                {formatThreshold(row.passThreshold, row.format)}
              </td>
              <td className="px-5 py-3 text-right tabular-nums text-[var(--color-text-muted)]">
                {row.goalDirection === "higher" ? "≤ " : "≥ "}
                {formatThreshold(row.failThreshold, row.format)}
              </td>
              <td className="px-5 py-3 text-right">
                <GateBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
