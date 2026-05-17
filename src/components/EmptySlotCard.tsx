/**
 * Placeholder for an empty portfolio slot. Renders when fewer than
 * `MAX_PORTFOLIO_SIZE` products are active. Acts as a discipline
 * reminder: max 2 products at a time, kill before adding.
 */
export function EmptySlotCard({ slotIndex }: { slotIndex: number }) {
  return (
    <div className="block rounded-xl border border-dashed border-[var(--color-border)] bg-transparent p-5 min-h-[176px] flex flex-col items-center justify-center text-center">
      <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        Slot {slotIndex}
      </div>
      <div className="mt-2 text-base font-medium text-[var(--color-text-muted)]">
        Open
      </div>
      <div className="mt-2 text-xs text-[var(--color-text-muted)] max-w-[14rem]">
        Add new product via{" "}
        <code className="text-[var(--color-text)]">
          src/lib/products.ts
        </code>{" "}
        + Vercel envs.
      </div>
    </div>
  );
}
