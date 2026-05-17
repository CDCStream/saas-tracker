import { differenceInCalendarDays, format, parseISO } from "date-fns";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCents(cents: number, withCents = false): string {
  const dollars = cents / 100;
  return withCents ? usdCents.format(dollars) : usd.format(dollars);
}

const intFormatter = new Intl.NumberFormat("en-US");

export function formatInt(n: number): string {
  return intFormatter.format(Math.round(n));
}

export function formatPct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy");
}

export function daysSince(iso: string): number {
  return differenceInCalendarDays(new Date(), parseISO(iso));
}

export function daysUntil(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date());
}
