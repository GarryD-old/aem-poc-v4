# PIM Pricing Architecture for EDS — Plan

## Goal
Replicate the AEM PIM pricing component (per-SKU pricing record + dynamically built buylink) in Edge Delivery Services. Pricing is **sensitive**: prices, campaign codes, and signed checkout links must be governed, locale-scoped, and never hardcoded in page content. Blocks reference a SKU; pricing data and the live signed buylink are resolved at render time.

## Confirmed Decisions
- **Buylink**: fetched live from the Avast/AVG checkout/cart service at runtime (the `t` timestamp + `h` signed hash are generated server-side and expire, so they cannot be stored).
- **Data store**: AEM **Content Fragments** — one CF per SKU, mirroring the current PIM component fields. EDS reads the published JSON.
- **Tree location**: under `language-masters` — pricing is locale/currency scoped (`/content/avg-eds-garry/language-masters/en/pricing/...`).
- **Scope**: design the model **and** build a working POC.

## How the current AEM PIM component maps to fields
From the screenshot, each pricing record (SKU `APW-00-001-12`) has:

| PIM field | CF field name | Notes |
|-----------|--------------|-------|
| SKU / id (APW-00-001-12) | `sku` | unique key; also the lookup key |
| Seats | `seats` | 1 |
| Maintenance | `maintenance` | 12 (months) |
| Entitlement Title | `entitlementTitle` | "1 Windows PC" |
| Secondary Entitlement Title | `entitlementSubtitle` | "1 year" |
| Campaign Code | `campaignCode` | "WDS" |
| Discount Value | `discountValue` | optional |
| Monthly Strikethrough / Sale Price | `monthlyFullPrice`, `monthlySalePrice` | 4.58 / 4.58 |
| Strikethrough / Sale Price (yearly) | `yearlyFullPrice`, `yearlySalePrice` | 54.99 / 54.99 |
| Future Strikethrough / Sale Price | `futureFullPrice`, `futureSalePrice` | 54.99 / 54.99 |
| Price Format | `priceFormat` | "/year" |
| Secondary Price Format | `secondaryPriceFormat` | "/month" |
| Buylink | `buylinkBase` | base checkout URL + `product` SKU param; **t/h NOT stored** |
| Entitlement Note | `entitlementNote` | optional |
| Currency (implied) | `currency` | e.g. EUR/USD — needed for locale scope |

## Proposed Architecture

### 1. Content Fragment Model — "Pricing SKU"
Create a CF Model in AEM (`/conf/avg-eds-garry/.../models/pricing-sku`) with the fields above. Each product/SKU = one Content Fragment instance.

### 2. Tree / storage layout (locale-scoped)
```
/content/avg-eds-garry/language-masters/en/pricing/
    apw-00-001-12        (CF: 1 Windows PC, 1yr, EUR)
    anm-00-001-12        (CF: 1 Mac, 1yr)
    and-00-001-12        (CF: 10 devices, 1yr)
    ...
/content/avg-eds-garry/language-masters/de/pricing/   (de prices/currency)
/content/avg-eds-garry/language-masters/fr/pricing/   (fr prices/currency)
```
Each locale folder holds its own price CFs (different currency/amounts). Mirrors the language-masters model already in use.

### 3. EDS data feed
CFs are exposed to EDS as **published JSON**. Two viable read paths (POC will pick one):
- **Per-SKU JSON**: fetch `/language-masters/en/pricing/{sku}.json` on demand.
- **Aggregated index**: a single published `pricing.json` (all SKUs for a locale) that blocks fetch once and cache, then filter by SKU. Lower request count — **recommended for POC**.

### 4. Buylink resolution (live, signed)
The stored `buylinkBase` is only `https://checkout.avast.com/en-ww/web?product={SKU}&quantity=1&provider=gen&clearCart=1` (no `t`/`h`). At runtime a small **pricing service module** calls the checkout/cart signing endpoint to obtain the signed `t` + `h` and assembles the final href. Needs: the **checkout signing API endpoint + auth contract** (to be supplied). Until that's available, POC falls back to the unsigned base link so the flow is testable.

### 5. How a page/block consumes pricing
- Page content references a **SKU only** (no prices in content) — e.g. a `cards-pricing` / `cards-pricing-trio` card carries `data-sku="apw-00-001-12"` (authored via a CF reference field, not free text).
- A shared `scripts/pricing.js` module:
  1. loads the locale `pricing.json` (cached),
  2. looks up the SKU record,
  3. renders price, formats, strikethrough, campaign,
  4. requests the signed buylink and sets the CTA href.
- Existing pricing blocks are refactored to call this module instead of holding literal prices.

## POC Build (this iteration)
1. **Pricing data**: since CF authoring is an AEM-side task, the POC ships a representative `pricing.json` (a few real SKUs: `apw-00-001-12`, `anm-00-001-12`, `and-00-001-12`) at the locale path so the read path is real and the CF JSON shape is locked.
2. **`scripts/pricing.js`**: fetch + cache + lookup + format + buylink builder (with live-API hook stubbed, unsigned fallback active).
3. **Refactor `cards-pricing-trio`** (and optionally `cards-pricing`) to render from SKU lookup instead of hardcoded `€XX.XX`.
4. Wire `internet-security-for-mac` pricing cards to real Mac SKUs.

## Open Items Needed From You (for full production, not blocking POC)
- **Checkout signing API**: endpoint URL, request/response shape, and auth method for generating `t`/`h`.
- **Real SKU list + EUR prices** for the Mac page (currently placeholder `€XX.XX`).
- **CF Model creation** in AEM author (I provide the field spec; you create the model + instances, or confirm I scaffold the JSON shape only).

## Risks / Sensitivity Controls
- **No prices in page content** — single source of truth in CFs; reduces accidental edits.
- **Buylink never cached with t/h** — always freshly signed to avoid expired/invalid checkout sessions.
- **Locale isolation** — wrong-currency leakage prevented by per-locale pricing folders.
- **Fail-safe rendering** — if pricing JSON or signing API is unavailable, block shows a graceful fallback (e.g. "See pricing") rather than a broken/zero price.

## Checklist

### Architecture & Model (design)
- [ ] Finalize CF Model field spec for "Pricing SKU" (table above) and confirm with user
- [ ] Confirm locale-scoped tree path `/language-masters/{lang}/pricing/{sku}`
- [ ] Decide read path: aggregated `pricing.json` index (recommended) vs per-SKU JSON
- [ ] Document buylink signing contract requirements (endpoint, params, auth)

### POC Data
- [ ] Create representative `pricing.json` at `content/language-masters/en/pricing.json` (or equivalent feed) with 3+ real SKUs and full field shape
- [ ] Lock JSON schema so it matches the future CF JSON output

### POC Code
- [ ] Build `scripts/pricing.js` — load+cache feed, `getPriceBySku()`, price/format rendering helpers, `buildBuylink(sku)` with live-API hook + unsigned fallback
- [ ] Refactor `cards-pricing-trio` JS to render from SKU lookup (remove hardcoded `€XX.XX`); add `data-sku` support
- [ ] (Optional) Refactor `cards-pricing` similarly
- [ ] Wire `internet-security-for-mac` cards to Mac SKUs

### Validation & Delivery
- [ ] Lint JS/CSS (no errors)
- [ ] Verify on local preview: prices render from feed, buylink builds, fallback works when feed/API missing
- [ ] Confirm no literal prices remain in page content
- [ ] Commit & push to GitHub `main`

### Production hand-off (post-POC, needs user/AEM)
- [ ] User creates CF Model + SKU instances in AEM under `/language-masters/{lang}/pricing`
- [ ] Supply + integrate live checkout signing API (replace unsigned fallback)
- [ ] Provide real EUR/locale prices; remove placeholders
- [ ] Add `de`/`fr` pricing folders when those language masters go live

> Execution requires **Execute mode**. Switch to Execute mode to begin the POC build (data feed + `pricing.js` + block refactor). Architecture/model design items can be reviewed now.
