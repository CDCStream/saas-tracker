import type { GateStatus } from "@/lib/gates";

const STYLES: Record<GateStatus, { bg: string; label: string }> = {
  PASS: { bg: "bg-[var(--color-pass)]/15 text-[var(--color-pass)]", label: "PASS" },
  FAIL: { bg: "bg-[var(--color-fail)]/15 text-[var(--color-fail)]", label: "FAIL" },
  PENDING: {
    bg: "bg-[var(--color-pending)]/15 text-[var(--color-pending)]",
    label: "PENDING",
  },
  GREY: { bg: "bg-[var(--color-grey)]/20 text-[var(--color-grey)]", label: "GREY" },
};

export function GateBadge({ status }: { status: GateStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider ${s.bg}`}
    >
      {s.label}
    </span>
  );
}

export function DecisionPill({
  decision,
}: {
  decision: import("@/lib/gates").Decision;
}) {
  const map: Record<
    import("@/lib/gates").Decision,
    { label: string; cls: string }
  > = {
    PENDING: {
      label: "Day 0–30 — running",
      cls: "bg-white/5 text-[var(--color-text-muted)]",
    },
    CONTINUE_GATE2: {
      label: "Continue → Gate 2",
      cls: "bg-[var(--color-pending)]/15 text-[var(--color-pending)]",
    },
    KILL: {
      label: "KILL",
      cls: "bg-[var(--color-fail)]/15 text-[var(--color-fail)]",
    },
    SCALE: {
      label: "SCALE",
      cls: "bg-[var(--color-pass)]/15 text-[var(--color-pass)]",
    },
    GREY: {
      label: "Grey zone — extend 30d",
      cls: "bg-[var(--color-grey)]/20 text-[var(--color-grey)]",
    },
  };
  const cfg = map[decision];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}
