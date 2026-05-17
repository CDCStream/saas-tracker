import type { BillingMetrics, GateThresholds } from "./types";

export type GateStatus = "PASS" | "FAIL" | "PENDING" | "GREY";

export interface GateRow {
  metric: string;
  current: number;
  passThreshold: number;
  failThreshold: number;
  status: GateStatus;
  format: "int" | "currency" | "percent" | "rating";
  goalDirection: "higher" | "lower";
}

function score(
  current: number,
  pass: number,
  fail: number,
  goal: "higher" | "lower"
): GateStatus {
  if (goal === "higher") {
    if (current >= pass) return "PASS";
    if (current <= fail) return "FAIL";
    return "PENDING";
  }
  if (current <= pass) return "PASS";
  if (current >= fail) return "FAIL";
  return "PENDING";
}

export interface GateInput {
  thresholds: GateThresholds;
  signups: number;
  visitors: number;
  cpcUsd: number;
  phUpvotes: number;
  retention7d: number;
  paidConv: number;
  mrrCents: number;
  reviewAvg: number;
  monthlyChurnRate: number;
}

export function scoreGate1(input: GateInput): GateRow[] {
  const t = input.thresholds.gate1;
  return [
    {
      metric: "Signups",
      current: input.signups,
      passThreshold: t.signupsPass,
      failThreshold: t.signupsFail,
      status: score(input.signups, t.signupsPass, t.signupsFail, "higher"),
      format: "int",
      goalDirection: "higher",
    },
    {
      metric: "Landing visitors",
      current: input.visitors,
      passThreshold: t.visitorsPass,
      failThreshold: t.visitorsFail,
      status: score(input.visitors, t.visitorsPass, t.visitorsFail, "higher"),
      format: "int",
      goalDirection: "higher",
    },
    {
      metric: "CPC (Ads)",
      current: input.cpcUsd,
      passThreshold: t.cpcPass,
      failThreshold: t.cpcFail,
      status: score(input.cpcUsd, t.cpcPass, t.cpcFail, "lower"),
      format: "currency",
      goalDirection: "lower",
    },
    {
      metric: "PH upvotes",
      current: input.phUpvotes,
      passThreshold: t.phUpvotesPass,
      failThreshold: t.phUpvotesFail,
      status: score(
        input.phUpvotes,
        t.phUpvotesPass,
        t.phUpvotesFail,
        "higher"
      ),
      format: "int",
      goalDirection: "higher",
    },
  ];
}

export function scoreGate2(input: GateInput): GateRow[] {
  const t = input.thresholds.gate2;
  return [
    {
      metric: "7-day retention",
      current: input.retention7d,
      passThreshold: t.retentionPass,
      failThreshold: t.retentionFail,
      status: score(
        input.retention7d,
        t.retentionPass,
        t.retentionFail,
        "higher"
      ),
      format: "percent",
      goalDirection: "higher",
    },
    {
      metric: "Paid conversion",
      current: input.paidConv,
      passThreshold: t.paidConvPass,
      failThreshold: t.paidConvFail,
      status: score(
        input.paidConv,
        t.paidConvPass,
        t.paidConvFail,
        "higher"
      ),
      format: "percent",
      goalDirection: "higher",
    },
    {
      metric: "MRR",
      current: input.mrrCents,
      passThreshold: t.mrrCentsPass,
      failThreshold: t.mrrCentsFail,
      status: score(
        input.mrrCents,
        t.mrrCentsPass,
        t.mrrCentsFail,
        "higher"
      ),
      format: "currency",
      goalDirection: "higher",
    },
    {
      metric: "Review avg",
      current: input.reviewAvg,
      passThreshold: t.reviewPass,
      failThreshold: t.reviewFail,
      status: score(
        input.reviewAvg,
        t.reviewPass,
        t.reviewFail,
        "higher"
      ),
      format: "rating",
      goalDirection: "higher",
    },
  ];
}

export type Decision =
  | "PENDING"
  | "CONTINUE_GATE2"
  | "KILL"
  | "SCALE"
  | "GREY";

export function decideOverall(
  daysIn: number,
  testDuration: number,
  gate1: GateRow[],
  gate2: GateRow[],
  monthlyChurnRate: number,
  monthlyChurnScale: number
): Decision {
  const g1Pass = gate1.filter((r) => r.status === "PASS").length;
  const g1Fail = gate1.filter((r) => r.status === "FAIL").length;
  const g2Pass = gate2.filter((r) => r.status === "PASS").length;
  const g2Fail = gate2.filter((r) => r.status === "FAIL").length;

  // Day 30 — Gate 1 hard kill if 4/4 fail
  if (daysIn >= 30 && g1Fail === 4) return "KILL";
  if (daysIn < 30) return "PENDING";

  // Day 31-59 — continue Gate 2
  if (daysIn < testDuration) {
    return g1Pass >= 2 ? "CONTINUE_GATE2" : "KILL";
  }

  // Day testDuration (60) — final
  if (g2Pass >= 3 && monthlyChurnRate <= monthlyChurnScale) return "SCALE";
  if (g2Fail >= 2) return "KILL";
  return "GREY";
}
