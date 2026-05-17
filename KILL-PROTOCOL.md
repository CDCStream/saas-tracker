# Kill Protocol

Run this **the same week** a product hits `decision === "KILL"`. The
2-slot portfolio cap (`MAX_PORTFOLIO_SIZE = 2` in
[`src/lib/products.ts`](src/lib/products.ts)) means a half-killed
product blocks the next idea — partial cleanups bleed cost silently
(Supabase compute, Dodo monthly fees, Vercel functions, GA4 quota).

The dashboard surfaces this same checklist on `/saas/<slug>` whenever
the gate decision is KILL.

---

## When to run

| Day  | Trigger                                           |
| ---- | ------------------------------------------------- |
| 30   | Gate 1 = 4 / 4 FAIL                               |
| 31-59| Gate 1 < 2 PASS                                   |
| 60   | Gate 2 ≥ 2 FAIL **or** monthly churn > 10%        |

Anything else (1–2 grey-zone fails) → extend 30 days, do **not** kill.

---

## The protocol (in order)

### 1. Snapshot final state (15 min)

Goal: keep a lessons-learned record before Supabase / Vercel / Dodo go away.

- Copy [`archive/_TEMPLATE.md`](archive/_TEMPLATE.md) to
  `archive/<slug>-killed-YYYY-MM-DD.md`.
- Fill in the metrics from `/saas/<slug>` (screenshot the page if you
  prefer a visual record).
- Note **why it failed**: distribution? pricing? wrong audience? bad
  product? — this is the only artifact that survives.
- Commit.

### 2. Cancel paying users (if any)

- Dodo dashboard → product → for every active subscription:
  - Cancel.
  - Refund last month if ARPU < $25 (cheaper than fighting churn).
  - Send a one-line email: *"We're sunsetting <product>. Full refund
    issued. Thanks for trying it."*

### 3. Take the landing offline

- Vercel project for the **product** (not saas-tracker) → Settings →
  **Pause Project**. Don't delete yet — keeps the domain reservation
  safe for 30 days in case a customer emails.
- After 30 days with zero inbound: delete project + release domain.

### 4. Remove from this dashboard

- Delete the entry for `<slug>` in
  [`src/lib/products.ts`](src/lib/products.ts).
- Delete `src/lib/queries/<slug>.ts`.
- Delete any `<slug>`-specific files under `src/lib/billing/` (none for
  Lirefin — Dodo provider is shared).
- Push.

The build will fail if the registry still has more than 2 entries —
that runtime assertion is your safety net.

### 5. Strip secrets

- Vercel saas-tracker project → Settings → Environment Variables.
- Delete every key that starts with `<SLUG>_*`:
  - `<SLUG>_SUPABASE_URL`
  - `<SLUG>_SUPABASE_SERVICE_KEY`
  - `<SLUG>_DODO_API_KEY`
  - `<SLUG>_DODO_ENV`
  - `<SLUG>_GA4_PROPERTY_ID`
- Redeploy (a touch of git push --allow-empty is fine).

### 6. Pause Supabase (cost block)

- supabase.com/dashboard → product project → Settings → General →
  **Pause Project**.
- After 30 days: **Delete Project** (irreversible).

### 7. Tear down adjacent surfaces

- **Google Cloud Console**: revoke the GA4/GSC IAM grant for the
  service account on this property/domain (saves no money but removes
  the dashboard's permission to query stale data).
- **Google Search Console**: remove the property if you're done with
  the domain. Keep it if you might re-purpose the domain.
- **Product Hunt**: post a "We tried, it didn't work, here's what we
  learned" comment on the original launch — costs nothing, builds
  reputation.
- **Chrome Web Store** (if it was an extension): unpublish — *don't*
  delete, since the user count history is sometimes useful for the
  archive doc.
- **Google Ads** (if running): pause campaign; download last
  performance report into the archive doc.

### 8. Free the slot

- Open `/` on saas-tracker.
- Verify the overview shows **Open slot** where the killed product
  was — that means the dashboard is correctly reading the new state.
- The next product can now start its 60-day window.

---

## What we **don't** do

- We don't keep "zombie" products in the codebase "just in case". Two
  products is the cap; the discipline is what makes the portfolio
  work.
- We don't pay for paused-but-not-deleted infra past 30 days. Set a
  calendar reminder when you pause so the deletion follow-through
  doesn't slip.
- We don't blame the team. The 60-day test exists exactly so we can
  fail cheaply and fast — a kill is a successful experiment.
