# Design Critique — Hewwo Pwincess Tournament Tracker

*April 21, 2026. Audience: organizer running live events. Scope: tournament browser + landing, schedule/standings/bracket, registration + auth. Format: read from code.*

---

## Overall Impression

The app has a clear visual identity — the "Two Peas" sage/cream palette is distinctive, the typography is modern (Geist), and the live-event pages have real craft in them (the Current Game card, real-time polling, the celebration animations). Somebody cared here.

The biggest gap is **theme discipline**. The `:root` in `globals.css` defines a thoughtful design system (primary, accent, muted, card, destructive, chart-1..5), but across the product you consistently reach past those tokens and write `text-gray-600`, `text-green-600`, `bg-yellow-50`, `text-blue-600`, `border-yellow-500/30`. Every one of those is a place the sage palette is being elbowed out by vanilla Tailwind. The result is a design that feels *almost* coherent but keeps slipping into "random SaaS app" whenever a new color is needed for a win/loss, seed ranking, or category badge.

The second biggest gap is that the app is heavily optimized for spectators (public-facing pages, beautiful browsing, polished landing) but you told me **the organizer is the primary audience**. Organizers mostly stare at read-only views and navigate somewhere else to actually do things. That's a structural opportunity.

---

## What's Working Well

A few things I'd explicitly keep:

The **landing and detail sections** (`tournament-details-section`, `tournament-format-section`, `tournament-rules-section`, `tournament-cta-section`) are quietly excellent. Consistent card treatments, `text-muted-foreground` labels with `uppercase tracking-wide`, subtle `bg-muted/40` section backgrounds, `GridPattern` behind the rules section as volleyball-net texture — this is the app at its best. If I were rebuilding the rest to match, this is my north star.

The **Current Game** card on the schedule page is genuinely great for a live event. Border-2 with `border-primary`, pulsing LIVE badge, big 6xl score, key-remount animation when a score changes. A referee or organizer can read it from across a gym. Keep this pattern.

**Real-time on the schedule page** — 5s polling plus Supabase realtime on `pool_matches` / `bracket_matches` — turns the page from a static list into something you can actually run a tournament from. Don't lose that feeling.

**Registration stepper** is clean. Progress bar uses `bg-muted` → `bg-primary`, errors use `border-destructive` + `text-destructive`, payment panel uses `bg-accent/20`. This flow mostly obeys the design system — which makes its contrast with the pages that don't even sharper.

**Motion is tasteful.** Staggered card entrances, `whileHover: { y: -4 }`, `whileTap: { scale: 0.98 }`, reduced-motion guards throughout. You didn't overdo it.

The **sign-in page** is a good minimal pattern — `max-w-sm`, centered, single outline button, no clutter. More pages should be this confident about what they are.

---

## Tournament Browser + Landing

### What it does

`/tournaments` is a filterable grid of tournament cards (upcoming/active/completed tabs); slug pages stack a hero, details section, format, rules, CTA, quick-actions sub-footer, and footer.

### Findings

| Finding | Severity | Recommendation |
|---|---|---|
| Tournament cards on the browser (`tournament-card-grid.tsx`) use `bg-white`, `border-gray-200`, `text-gray-600/500/700`, `text-red-600`, `text-blue-600` — none of the theme tokens. Lives in a visual world of its own. | Critical | Swap to `bg-card`, `border-border`, `text-muted-foreground`, and use `text-destructive` / `text-primary` for the pod-count accent. The cards will finally look like they belong to the rest of the app. |
| Quick-actions sub-footer uses hardcoded rainbow palettes (`bg-blue-50`, `bg-purple-50`, `bg-yellow-50`, `border-2 border-blue-500`, `text-blue-900`, `text-purple-700`) plus emoji icons. Dominates the page and reads like a different product. | Critical | Normalize to a single treatment: `bg-card` with `border-border`, `text-primary` icon, `text-muted-foreground` description. If you want differentiation, use `bg-accent/10` vs `bg-primary/5` rather than six crayon-box colors. |
| Hero headline renders at `lg:text-8xl` (128px) which is likely too large on many laptops and definitely crushes smaller mobile widths even with the `sm:text-5xl` step. | Moderate | Cap at `lg:text-6xl` or reintroduce a `xl:text-7xl lg:text-6xl md:text-5xl` cascade. Test on a 13" MBA width. |
| "Hewwo Pwincess, these are all the past, preset and future tournaments" — the "preset" is a typo for "present". | Minor | Fix copy. This is the first sentence an organizer reads. |
| Status-filter tabs are built from 4 manual `<Link>` elements with duplicated className logic. | Minor | Extract to a `<FilterTabs>` component or use shadcn `Tabs`. Lower risk of drift. |
| No organizer-specific hero state: a whitelisted organizer visiting `/tournaments` sees the same page as a random player, except for one "Create Tournament" button. | Moderate | Either (a) add an "My tournaments" / "Needs attention" section at the top for whitelisted users, or (b) make `/tournaments/create` feel more like a dashboard action rather than a single CTA. |

### Hierarchy

On a tournament detail page, by the time I reach the quick-actions section I've forgotten what the tournament was — because the rainbow cards pull my eye so hard they outweigh the details above them. Reading order is currently: Hero → details → format → rules → **RAINBOW SHINY** → footer. That's backwards.

### Mobile

The 3-column grids collapse correctly. Hero typography is the main mobile risk. The tournament card footer (teams registered + open/full badge) is fine.

---

## Standings

### What it does

Sortable table of pod standings (GP, W, L, PF, PA, +/-), expandable rows to show player names, optional bracket-standings tab once bracket phase begins.

### Findings

| Finding | Severity | Recommendation |
|---|---|---|
| W/L columns use `text-green-600 dark:text-green-400`. Plus/minus column uses hardcoded `text-green-600` / `text-red-600` / `text-muted-foreground`. None of these are theme tokens. The green is not the sage primary — it's a generic lime. | Moderate | Introduce two semantic tokens in `globals.css`: `--success` and `--danger` (and paired foreground), map to `text-success` / `text-danger`. Use `text-primary` for "positive trend" if you want the sage feel, and reserve `--success` / `--danger` for actual outcomes. |
| The table is functionally good but visually flat. The default row hover is a very light gray that barely reads on the cream background. Odd-row striping would be easy and would dramatically improve scannability when 12+ pods are listed. | Moderate | Add `odd:bg-muted/30` (or similar) on `<tr>`. Also add a row border with `border-border/60` instead of nothing. |
| `TrendingUp` icon on positive +/- is a nice touch, but there's no paired indicator for negative. Users scanning for who's struggling have to read the number. | Minor | Add `TrendingDown` (with `text-muted-foreground`, not red) for negative diff. |
| Default sort by +/- is the right call for pool play — but once the bracket has started, standings matter less and many organizers want to see *seeding order* (the snake draft). There's no way to toggle that. | Moderate | Add a `Sort by seed` option once `getBracketTeams` returns data. Even a secondary column "Seed" that's visible only during bracket phase. |

### Organizer UX

The standings table is read-only. If a score was entered wrong, the organizer has to go find the scorekeeper page. A subtle "..." overflow menu per row with "Edit matches for this pod" would save a lot of navigation.

### Mobile

`overflow-x-auto` wrapper handles the 8-column table well. Consider making team-name column `sticky left-0 bg-card` so the team stays visible while scrolling rightward — that's the difference between "usable" and "confusing" at 375px.

---

## Schedule

### What it does

Hero → Current Game (2/3) + Next Up (1/3) → full schedule table → tournament notes. Polls every 5s plus realtime subscription.

### Findings

| Finding | Severity | Recommendation |
|---|---|---|
| The "On Deck" panel (`next-up.tsx`) uses a rotating palette of `bg-blue-100 text-blue-800`, `bg-green-100`, `bg-purple-100`, `bg-orange-100`, `bg-pink-100`, `bg-indigo-100` to differentiate pods. It's loud and unrelated to the sage palette. | Moderate | Either (a) use a single treatment (`bg-accent/20 text-accent-foreground`) for all pods — rely on the label number, not color, to tell them apart — or (b) if you want per-pod colors, seed them from the theme `--chart-1..5` tokens (which you already defined in `:root` but aren't using anywhere). |
| Score change animation uses `drop-shadow(0 0 12px #dc4444)` on Current Game and `drop-shadow(0 0 4px #dc4444)` in the schedule table. Red is off-brand for a celebratory "score just changed" moment in a sage app. | Minor | Pulse in `--primary` or a warm gold (you already use `rgba(200,165,70,...)` for the divider glow — reuse that). Red on a scoreboard implies error; gold implies "hey, something happened." |
| "FINAL" badge on completed Current Game uses `bg-green-600 text-white`. | Minor | `bg-primary text-primary-foreground` — it's literally the same visual weight, just on-theme. |
| Schedule table status badges mostly use theme tokens (`bg-primary`, `bg-muted`, `outline`) — good. | — | Keep. |
| No way to enter a score from the schedule page. An organizer running a live tournament spends their whole day here, then has to navigate to `/scorekeeper` to punch in a score, then back. | Critical (for organizer use case) | Add an inline "Enter score" button on the current-game card (organizer-only, gated on `isOrganizer`). This is the single highest-leverage UX improvement in the app. |
| Tournament Notes card is valuable but lives below the table, so on mobile it's 3 screens down. | Minor | On mobile, reorder: Current Game → Next Up → **Notes** → Schedule table. Organizers glance at the notes more often than they scroll the full schedule. |

### Mobile

Stacks correctly. The schedule table horizontal scroll is OK. Pod-filter buttons at the top are tappable but get cramped at 12 pods — consider a "More" overflow or a select on narrow widths.

---

## Bracket

### What it does

Columnar visualization of a 4- or 6-team double-elimination bracket plus bracket-team cards showing seed composition.

### Findings

| Finding | Severity | Recommendation |
|---|---|---|
| Bracket container is `min-w-[800px]` inside `overflow-x-auto`. On a phone this means the user sees ~40% of the bracket and has to horizontally scroll a long 2D grid to find the game they care about. | Critical | Build a phone layout: a vertical list of matchups grouped by round ("Winners R1", "Winners Final", "Losers R1"…) — essentially the same data as cards stacked. Keep the grid for `md:` and up. |
| Section headers use hardcoded `text-yellow-600` / `text-blue-600` / `text-purple-600`. | Moderate | Use `text-primary`, `text-accent-foreground`, and `text-muted-foreground` — or introduce a `--winners` / `--losers` / `--championship` set of semantic tokens if you want differentiation. |
| Winner name renders in `text-green-600`. | Moderate | `text-primary font-semibold` — the sage primary is already a "positive" feeling color in context. |
| Completed match cards use `border-green-500/30 bg-green-500/5` — generic green. | Moderate | `border-primary/30 bg-primary/5`. |
| Bracket team cards use hardcoded seed colors: 1st=`yellow-500`, 2nd=`slate-400`, 3rd=`amber-700`, 4th=`blue-600`. | Moderate | Real trophy metaphor is gold/silver/bronze which is fine as a deliberate exception — but the 4th seed shouldn't be blue; that's arbitrary. Either use gold/silver/bronze + muted for 4th (so: yellow-500, slate-400, amber-700, muted), or drop the rainbow and just badge seeds as "1 SEED" / "2 SEED" / … in theme colors. |
| Team names in match cards use `truncate` with no tooltip. On mobile, multi-player team names like "Anthony / Jackie / Sam" get cut to "Anthony /…". | Minor | Add `title={teamName}` attribute so hovering/long-pressing reveals the full name. Or two-line wrap on mobile. |
| Legend at the bottom of the bracket is using hardcoded colors in the swatches (`bg-green-500/30`, `border-green-500/30`), not theme. Will drift again after the theme pass above. | — | Re-derive from tokens after the theme cleanup. |

### Hierarchy

In the current rendering, "winners bracket" reads as yellow, "losers" as blue, "championship" as purple — three equally saturated, competing colors. The championship, which is the most important game in the tournament, should *visually dominate*, not just be purple. Consider making the championship card larger, sitting it on `bg-accent/10`, and pushing the two bracket sections to calmer supporting visuals.

---

## Registration + Auth

### What it does

Sign-in page (Google OAuth only), `/auth/complete` handler, multi-step registration form (auth → confirm → partner → team name → payment → success).

### Findings

| Finding | Severity | Recommendation |
|---|---|---|
| Registration form is mostly on-theme. Main exception: the email-failure warning uses `bg-yellow-50 border border-yellow-200`. Small, but visible. | Minor | `bg-muted border-border text-foreground` with a `<TriangleAlert className="text-destructive"/>` icon. |
| The 6-step stepper is long for a 2-person pod signup. Steps: Auth → Confirm → Partner → Team Name → Payment → Success. "Confirm" and "Team Name" are low-density screens. | Moderate | Collapse Confirm into the Partner step (it's just "is this your email?"). Team Name could be an input on the Payment step. Target: 3 screens (Partner → Pay → Success). Measured UX: shorter forms correlate strongly with completion. |
| Turnstile CAPTCHA is ~300px wide, which is narrow mobile territory. On a 320px-wide device it clips. | Minor | Wrap in `overflow-x-auto` or use Turnstile's `compact` size variant. |
| Sign-in page's only auth option is Google. For a casual volleyball league this is fine, but there's zero copy explaining *why* — no "We use Google to confirm your email so we can send you tournament updates" line. | Minor | Add one line of microcopy under the button. It makes people less suspicious. |
| Multi-step form doesn't persist progress — a page refresh during step 4 kicks the user back to step 1. | Moderate | Mirror form state in `sessionStorage`, rehydrate on mount. Especially valuable on mobile where browser switches (to check Venmo, e.g.) can kill the page. |
| Payment step is a UI with no wire — per `CLAUDE.md` this is known ("Payment step in registration not wired"). Until it's wired, being explicit would help: "Payment is handled on the next screen via Venmo / in-person — we won't charge you here." | Minor | Add a note so the user isn't surprised when no card field appears. |

### Auth complete page

Not reviewed in depth, but worth spot-checking that the spinner state during `sessionStorage` redirect doesn't flash a "something broke" feel. A single-line "Finishing sign-in…" caption under the spinner goes a long way.

---

## Cross-Cutting Issues

### 1. Theme token discipline — the #1 issue

Your `:root` already defines everything you need, but the codebase habitually writes hardcoded Tailwind colors. Quick audit targets:

- `text-gray-500` / `text-gray-600` / `text-gray-700` → should be `text-muted-foreground` or `text-foreground`
- `bg-white` on cards → should be `bg-card`
- `border-gray-200` → should be `border-border`
- `text-green-600` / `text-red-600` for win/loss → add `--success` / `--danger` tokens, then use `text-success` / `text-danger`
- `bg-yellow-50` warnings → `bg-muted` with a `text-destructive` icon
- Category colors (pods, brackets, seeds) → use `--chart-1..5` which are already defined and map to the sage palette

A one-sitting find-and-replace with codemod would be ~80% of the aesthetic upgrade you're looking for.

### 2. Organizer workflow is read-only everywhere except scorekeeper

The biggest UX-for-organizer win isn't aesthetic — it's **inline score entry on the schedule and bracket pages**. Organizers currently triangulate between 3 pages to update a score. A single "edit score" modal triggered from either the schedule row or the bracket match card would cut navigation overhead dramatically.

Secondary organizer wins, in order: a per-tournament "manage" dashboard (links to settings/scorekeeper/registration list), a "needs attention" indicator on `/tournaments` for whitelisted users, a print view for brackets/schedules that organizers can stick on a gym wall.

### 3. Mobile bracket is broken

The `min-w-[800px]` layout is not a mobile design — it's a desktop design on rails. A vertical matchup list for `<md` breakpoints is a 1–2 day piece of work and makes the bracket page actually usable for the players who are on their phones courtside.

### 4. Hierarchy of importance on detail pages

Rank ordering of "what does the user most need": **Hero / current status** > details > **organizer actions** > format > rules > quick navigation. Currently the quick-actions section is visually the loudest because of the rainbow styling. Fix the styling and the hierarchy fixes itself.

### 5. Typography scale

Everything below `h1` is fine. The hero `lg:text-8xl` / `lg:text-10xl` / `text-11xl` scale in `@theme` is rarely the right call on anything but a full-bleed marketing page — and this is an app, not a marketing page. Recommend capping the in-app scale at `7xl` and reserving the bigger sizes for a dedicated marketing hero if you build one.

---

## Priority Recommendations

1. **Theme token sweep.** Find-and-replace hardcoded grays, greens, reds, yellows, blues across `tournament-card-grid`, `schedule-table`, `current-game`, `next-up`, `bracket-display`, `bracket-team-cards`, `bracket-standings`, `quick-actions-subfooter`. Introduce `--success` and `--danger` tokens. Expected impact: the app finally *feels* like one app. Estimated effort: 4–6 hours, plus visual regression pass.

2. **Mobile bracket redesign.** Ship a vertical matchup-list layout for `<md` widths. Same data, different shape. Expected impact: bracket becomes usable for courtside players and organizers with phones. Estimated effort: 1 day.

3. **Inline score entry on the schedule page.** Gated on `isOrganizer`, a small "Edit" button on the Current Game card and each schedule row opens a score modal. Expected impact: dramatic reduction in organizer page-hopping during live events. Estimated effort: 1–2 days.

4. **Simplify the registration stepper.** Collapse to Partner → Pay → Success. Add `sessionStorage` persistence. Expected impact: higher completion rate, fewer support tickets. Estimated effort: 1 day.

5. **Rework the quick-actions sub-footer.** Single treatment, theme colors, no rainbow. Expected impact: detail pages have correct visual hierarchy and feel professional. Estimated effort: 2–3 hours.

6. **Fix the "preset" typo** on `/tournaments`. First-impression credibility fix. 30 seconds.

---

*Next step if you want one: pick the theme token sweep. It's the highest surface-area-to-effort ratio of anything on the list, and the rest of the critique gets easier to reason about once the color system is unified.*
