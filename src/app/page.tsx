import { EmptySlotCard } from "@/components/EmptySlotCard";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { billingFor } from "@/lib/billing";
import { type Decision } from "@/lib/gates";
import { MAX_PORTFOLIO_SIZE, PRODUCTS, openSlots } from "@/lib/products";
import { supabaseFor } from "@/lib/supabaseRead";
import { daysSince } from "@/lib/formatters";

export const revalidate = 600; // 10 min ISR (refreshed hourly via cron + on-demand)

async function loadCardData(
  product: (typeof PRODUCTS)[number]
): Promise<ProductCardData> {
  try {
    if (!product.supabase.url || !product.supabase.serviceRoleKey) {
      throw new Error(`${product.slug} env vars not set`);
    }
    const supabase = supabaseFor(product);
    const billing = billingFor(product);

    const [signups, metrics] = await Promise.all([
      product.supabase.queries.totalSignups(supabase),
      billing.getMetrics(),
    ]);

    const elapsed = daysSince(product.testStartDate);
    // Overview card stays at PENDING — Gate scoring needs GA4/GSC and
    // lives on the detail page so we don't burn API quota on every
    // landing-page load. Detail page tells the real story.
    const decision: Decision = elapsed >= 30 ? "PENDING" : "PENDING";

    return {
      product,
      signups,
      mrrCents: metrics.mrrCents,
      payingUsers: metrics.payingUsers,
      decision,
    };
  } catch (err) {
    return {
      product,
      signups: 0,
      mrrCents: 0,
      payingUsers: 0,
      decision: "PENDING",
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export default async function PortfolioPage() {
  const cards = await Promise.all(PRODUCTS.map(loadCardData));
  const slots = openSlots();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {PRODUCTS.length} of {MAX_PORTFOLIO_SIZE} slots filled
          {slots > 0
            ? ` — ${slots} open`
            : " — concentration cap reached"}
          . Tap a card for the gate breakdown.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <ProductCard key={c.product.slug} data={c} />
        ))}
        {Array.from({ length: slots }).map((_, i) => (
          <EmptySlotCard key={`slot-${i}`} slotIndex={cards.length + i + 1} />
        ))}
      </div>

      <div className="text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-4">
        Discipline: never run more than {MAX_PORTFOLIO_SIZE} products at
        once. If a product hits <span className="text-[var(--color-fail)]">KILL</span>,
        run <code className="text-[var(--color-text)]">KILL-PROTOCOL.md</code>{" "}
        before adding a replacement.
      </div>
    </div>
  );
}
