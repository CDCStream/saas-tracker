import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { billingFor } from "@/lib/billing";
import { type Decision } from "@/lib/gates";
import { PRODUCTS } from "@/lib/products";
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          {PRODUCTS.length} product{PRODUCTS.length === 1 ? "" : "s"} in test
          window. Tap a card for the full gate breakdown.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <ProductCard key={c.product.slug} data={c} />
        ))}
      </div>
    </div>
  );
}
