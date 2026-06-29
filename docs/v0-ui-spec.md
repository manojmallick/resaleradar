# ResaleRadar — v0 UI Spec (paste into v0.dev)

> Goal: generate the full frontend in v0, then wire the real Aurora/pgvector + Bedrock backend into it.
> **The component props below match the exact JSON the `/api/identify`, `/api/value`, and `/api/listing`
> routes return**, so the UI drops onto the backend with zero rework. Keep components presentational
> (take a typed prop) — the one rule that prevents a rewrite.

---

## STEP 1 — Initial scaffold prompt (paste this first)

```
Build a Next.js 16 (App Router) + TypeScript + Tailwind B2C app called ResaleRadar — a resale price
intelligence tool. "Snap a photo of anything you want to sell and instantly get its market value
across eBay, Poshmark, and Depop — plus how fast it'll sell and an auto-generated listing." Use
shadcn/ui components and lucide-react icons.

DESIGN SYSTEM (use throughout):
- Aesthetic: clean, modern, trustworthy fintech — "resale = money / growth". Premium but friendly.
- Palette: deep forest green (#06281E) primary, emerald accent (#10B981 / hover #34D399 / light
  #6EE7B7), surfaces white on a faint mint background (#F6FBF8), mint tint for highlights (#ECFDF5).
  Platform accent dots ONLY on platform labels: eBay #2563EB, Poshmark #DB2777, Depop #DC2626.
- Typography: serif headers ("Source Serif 4" / Georgia fallback) for warmth + gravitas; Inter for
  body and UI. Generous line-height. Prices are large and bold.
- Components: rounded-xl/2xl cards, soft shadows, 1px borders, accessible focus rings. Mobile-first.

PAGES (App Router routes):
1. /                  Landing — dark forest hero "Know what it sells for before you list it.",
   subhead about resellers guessing at price, and a LARGE photo-upload dropzone ("Snap a photo to
   value your item", camera + file). Below: 3 feature cards (Real visual comps / Days-to-sell not
   just price / Listing in one tap) and a 3-step "How it works" (Snap → See the market → List it).
2. /results/[itemId] The valuation report (see DETAILED SPEC below). The hero screen.
3. /dashboard        "Your closet" — a grid of scanned items with current value + best platform +
   days-to-sell, an estimated-total-value header, and an empty state.
4. /pricing          3 tiers: Free $0 (5 scans/mo), Pro $9/mo (unlimited + cross-platform +
   auto-listing + alerts), Business $29/mo (bulk, API, inventory). Mark Pro "Most popular".
   Footnote: "Plus 1% on cross-posted listings that sell."

Shared top nav: logo "ResaleRadar" with a radar icon on the forest bar, links (Scan, Dashboard,
Pricing) + a green "New scan" button. Footer with the honesty note (see below). Mobile responsive.

HONESTY NOTE (must appear in the footer and near the dropzone, verbatim intent):
"eBay values are live from eBay's official API. Poshmark and Depop are estimated from comparable
eBay sold data — and labeled as such." This honest framing is a feature, not a disclaimer.
```

---

## STEP 2 — Results / valuation page detail (paste after scaffold)

```
Now refine /results/[itemId]. It renders the valuation of one scanned item.

ITEM HEADER: a square item thumbnail (the uploaded photo) + serif title (e.g. 'Nike Air Jordan 1
Retro High OG "Chicago"'), with chips for brand, category, and condition, and "Scanned {date}".
On the right: a "Track price" outline button (toggles to "Tracking price" with a bell icon).

HERO RECOMMENDATION BANNER (the velocity hook — make it prominent, dark forest gradient, white text):
- Eyebrow "Best move".
- Big serif headline: "Sell on eBay for $178".
- Subline: "Priced for the fastest sale — not the highest sticker that sits unsold. We rank by
  expected dollars-per-day, not just median price."
- Two stats on the right: "Est. days to sell ~6" (clock icon) and "Velocity $30/day" (trend icon).

ACROSS MARKETPLACES: a 3-up grid of ValuationCard, one per platform, sorted by velocity (best first).
Each ValuationCard shows:
  - Platform name with its colored accent dot. The BEST card gets an emerald ring + a "Best to sell"
    badge (zap icon).
  - Big bold median price + the word "recommended".
  - A PriceRangeBar: a horizontal low→high bar with a light→dark emerald gradient and a dark marker
    at the median; low / median / high labels beneath.
  - Two small stat tiles: "Est. days to sell ~6" and "Value velocity $30/day".
  - A footer row: "{n} comps" on the left and a source pill on the right —
    "Live · eBay API" (emerald tint) for eBay, "Estimated from comparables" (muted gray) otherwise.
    THIS LABEL IS REQUIRED — it's the honest-data story.

LISTING GENERATOR (below the cards): a card titled "Auto-generated listing" with a sparkles icon.
- Empty state: short blurb + a "Generate listing" button (shows a spinner + "Writing your listing…").
- Filled state: chips ("Best on eBay", "$178", "~6 days"), then a bordered block with a bold title
  and a multi-paragraph plain-text description; a "Copy" button (turns into a check on copy) and a
  ghost "Regenerate" button.

Add a "Showing sample data" amber notice variant for when the backend isn't live yet.
```

---

## STEP 3 — Dashboard + upload-flow states (optional paste)

```
On /dashboard ("Your closet"): a header with item count + estimated total value, and a "Scan a new
item" green button. A responsive grid of item cards: photo, title (2-line clamp), brand/category/
condition chips, big price with "best on {platform}", and a "~6d" days-to-sell pill. Each card links
to /results/[itemId]. Include an EMPTY STATE (package icon, "Nothing scanned yet", CTA to scan).

On the landing dropzone, model the scan flow states in-place:
  idle → "Snap a photo to value your item"
  identifying → spinner + "Identifying your item with vision AI…"
  valuing → spinner + "Searching comparable sold items with pgvector…"
  done → redirect to /results/[itemId]
Show the chosen photo faded behind the dropzone while it works. Handle non-image files with an inline
error. Support drag-and-drop, click-to-choose, and mobile camera capture (capture="environment").
```

---

## DATA CONTRACT — make v0 mock these exact shapes (critical for backend wiring)

Tell v0: *"Type the mock data with these TypeScript interfaces and render from them."* These mirror
`lib/data.ts` and the API responses exactly.

```typescript
// One platform's valuation — the shape /api/value returns inside `platforms[]`
export interface PlatformValuation {
  platform: string;          // 'ebay' | 'poshmark' | 'depop'
  source: string;            // 'ebay_api' (=> "Live · eBay API") | 'estimated'
  comparables: number;       // how many sold comps backed this
  low: number;
  median: number;            // the recommended price for this platform
  high: number;
  avgDaysToSell: number | null;
  velocityScore: number;     // $/day = median / days-to-sell
  isBest: boolean;           // highest $/day -> gets the emerald ring + badge
}

// /api/value full response
export interface Valuation {
  platforms: PlatformValuation[];   // pre-sorted best-velocity first
  bestPlatform: string;
  recommendedPrice: number;
  estDaysToSell: number;
}

// /api/listing response
export interface ListingView {
  bestPlatform: string;
  title: string;
  description: string;       // plain text, may contain \n paragraph breaks
  suggestedPrice: number;
  estDaysToSell: number;
}

// The composed report the /results/[itemId] page renders
export interface ItemReport {
  id: string;
  title: string;
  brand: string | null;
  category: string;          // sneakers | handbags | apparel | watches | electronics | home | toys | other
  condition: string;         // new | like_new | good | fair | poor
  imageUrl: string | null;   // the uploaded photo (data URL)
  scannedAt: string;         // ISO
  platforms: PlatformValuation[];
  bestPlatform: string;
  recommendedPrice: number;
  estDaysToSell: number;
  listing: ListingView | null;
}

// One dashboard grid card
export interface ItemSummary {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  condition: string;
  imageUrl: string | null;
  recommendedPrice: number;
  bestPlatform: string;
  estDaysToSell: number;
  scannedAt: string;
}
```

### Realistic mock content to seed v0 (so the demo looks real)
- Hero item: **Nike Air Jordan 1 "Chicago"**, like_new, sneakers. Three platforms:
  - eBay — `source: 'ebay_api'`, median **$178**, ~6 days, **isBest: true** (highest $/day).
  - Poshmark — `source: 'estimated'`, median **$195** (higher!) but ~18 days → loses on velocity.
  - Depop — `source: 'estimated'`, median $170, ~12 days.
  This contrast (Poshmark higher price, eBay wins on speed) is the headline insight — make it obvious.
- A generated `listing` for the Jordan with an honest, keyword-rich title + 2 short paragraphs.
- Dashboard: 3 items (the Jordan; a Louis Vuitton Neverfull tote best on Poshmark ~11d; a Carhartt
  Detroit jacket best on Depop ~9d) with mixed best-platforms so the variety shows.

---

## Integration notes (how this connects to the backend)
- Real flow later: dropzone → `POST /api/identify {imageBase64}` → `{itemId, title, brand, category,
  condition}`; then `POST /api/value {itemId}` → `Valuation`; redirect to `/results/[itemId]`.
  The report page server-fetches via `getReportOrMock(itemId)`. "Generate listing" → `POST
  /api/listing {itemId}` → `ListingView`. "Track price" → `POST /api/track {itemId, targetPrice?}`.
- Keep components **presentational** — `ValuationCard` takes a `PlatformValuation`, the page takes an
  `ItemReport`, the dashboard card takes an `ItemSummary`. Don't bake fetch logic into the cards.
- The **source pill** ("Live · eBay API" vs "Estimated from comparables") and the **velocity stats**
  (days-to-sell + $/day) are the two things that make this not-a-clone. Don't drop them for polish.
- Don't implement auth in v0; the backend uses a single demo-user context server-side.
```
