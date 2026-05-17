import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";

export const dynamic = "force-dynamic";

/**
 * Hourly cron (configured in vercel.json). Vercel Cron sends an
 * `Authorization: Bearer <CRON_SECRET>` header — we re-check it here
 * because Cron jobs are public functions otherwise.
 *
 * The job revalidates the portfolio page and every detail page so the
 * next visitor sees fresh numbers without paying the API round-trip.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  if (expected && auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  revalidatePath("/");
  for (const p of PRODUCTS) revalidatePath(`/saas/${p.slug}`);

  return NextResponse.json({
    ok: true,
    refreshedAt: new Date().toISOString(),
    products: PRODUCTS.map((p) => p.slug),
  });
}
