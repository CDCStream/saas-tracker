/**
 * Per-product fallback monthly price in USD (used when Dodo's
 * subscription payload doesn't expose `recurring_pre_tax_amount`).
 *
 * Lirefin Dodo product IDs from `docs/LAUNCH-ROADMAP.md`:
 *   Starter   $5  | pdt_0NesUqw9oKpb9nwAtjmAs
 *   Standard  $10 | pdt_0NesZKxoBcpdR5DnzNHnc
 *   Pro       $25 | pdt_0NesZSYT2TYWuHWifsKRB
 *   Power     $50 | pdt_0NesZZTuoBEV2xjWBPyMb
 *   Unlimited $99 | pdt_0NesZqekf12iwI3FkPcwx
 */
export const CREDIT_MONTHLY_PRICE_USD: Record<string, number> = {
  pdt_0NesUqw9oKpb9nwAtjmAs: 5,
  pdt_0NesZKxoBcpdR5DnzNHnc: 10,
  pdt_0NesZSYT2TYWuHWifsKRB: 25,
  pdt_0NesZZTuoBEV2xjWBPyMb: 50,
  pdt_0NesZqekf12iwI3FkPcwx: 99,
};
