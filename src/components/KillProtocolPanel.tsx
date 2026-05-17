/**
 * Shown when a SaaS hits decision === 'KILL'. Walks through the
 * destructive teardown that frees the slot for the next product.
 *
 * Steps mirror KILL-PROTOCOL.md so the dashboard and the docs stay in
 * lockstep — only render here, never auto-execute.
 */
export function KillProtocolPanel({
  slug,
  name,
  archivePath,
}: {
  slug: string;
  name: string;
  archivePath: string;
}) {
  const steps = [
    {
      title: "1. Snapshot final state",
      body: (
        <>
          Copy the page to{" "}
          <code className="text-[var(--color-text)]">{archivePath}</code> so
          you keep a lessons-learned record after Supabase is gone.
        </>
      ),
    },
    {
      title: "2. Cancel paying users (if any)",
      body: (
        <>
          Dodo dashboard → product → cancel each active subscription with a
          refund (under $25 ARPU we just refund &mdash; don&rsquo;t fight churn).
        </>
      ),
    },
    {
      title: "3. Take the landing offline",
      body: (
        <>
          Vercel project for {name} → Settings → Pause Project. Don&rsquo;t
          delete yet &mdash; keeps the domain reservation safe for 30 days.
        </>
      ),
    },
    {
      title: "4. Remove from this dashboard",
      body: (
        <>
          Delete the entry for <code>{slug}</code> in{" "}
          <code className="text-[var(--color-text)]">
            src/lib/products.ts
          </code>
          , delete{" "}
          <code className="text-[var(--color-text)]">
            src/lib/queries/{slug}.ts
          </code>
          , push.
        </>
      ),
    },
    {
      title: "5. Strip secrets",
      body: (
        <>
          Vercel saas-tracker → Settings → Environment Variables — delete
          every <code>{slug.toUpperCase()}_*</code> key. Then redeploy.
        </>
      ),
    },
    {
      title: "6. Pause Supabase",
      body: (
        <>
          Pause (don&rsquo;t delete yet) the {name} Supabase project. After
          30 days with no questions, delete it.
        </>
      ),
    },
    {
      title: "7. Free the slot",
      body: (
        <>
          Confirm the overview shows an Open slot. The next idea can now
          start its 60-day window.
        </>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-fail)]/40 bg-[var(--color-fail)]/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-fail)] font-semibold">
            Decision: KILL
          </div>
          <h2 className="text-lg font-semibold mt-1">
            Run the kill protocol on {name}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            The 60-day test failed. Free the slot fully before queuing the
            next product — partial cleanups silently bleed cost.
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((step, i) => (
          <li
            key={i}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3"
          >
            <div className="text-sm font-semibold">{step.title}</div>
            <div className="text-sm text-[var(--color-text-muted)] mt-1">
              {step.body}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 text-xs text-[var(--color-text-muted)]">
        Full checklist:{" "}
        <code className="text-[var(--color-text)]">KILL-PROTOCOL.md</code>
      </div>
    </div>
  );
}
