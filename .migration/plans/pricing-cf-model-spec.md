# Content Fragment Model Spec — "Pricing SKU" (Simplified POC)

Reference for building the pricing CF model in AEM author so its published
JSON matches the EDS pricing feed consumed by `scripts/pricing.js`.

## Why this exists
Pricing is the only governed value. Everything else (titles, buylinks,
formats, marketing copy) stays authored on the page. A page card references a
**SKU**; the block injects only the matching price numbers from the feed.

## Config prerequisite
- Tools → General → Configuration Browser → `avg-eds-garry` → Properties →
  enable **Content Fragment Models** → Save.

## Model
- Location: Tools → Assets → Content Fragment Models → `avg-eds-garry`
- Name: **Pricing SKU** (id `pricing-sku`)

## Fields (only 4 — POC)
All fields are **Single line text** so the published JSON matches the feed
strings exactly; `pricing.js` needs no changes.

| Field Label | Property Name (JSON key) | Data Type | Required | Sample |
|---|---|---|---|---|
| SKU | `sku` | Single line text | Yes | `ismac-00-001-12` |
| Currency | `currency` | Single line text | No | `€` |
| Yearly Price | `yearly` | Single line text | No | `53.99` |
| Monthly Price | `monthly` | Single line text | No | `4.50` |

> Property Name must match the JSON key exactly (case-sensitive).
> No buylink, titles, or format fields — those live on the page.

## CF instances (one per SKU)
- Stored under: `/content/dam/avg-eds-garry/language-masters/en/pricing/`
- Create → Content Fragment → model "Pricing SKU" → name = the SKU.
- Seed to mirror `content/language-masters/en/pricing.json`:

| Fragment name | currency | yearly | monthly |
|---|---|---|---|
| `apw-00-001-12` | € | 54.99 | 4.58 |
| `ismac-00-001-12` | € | 53.99 | 4.50 |
| `ismd-00-010-12` | € | 64.99 | 5.42 |
| `anw-00-001-12` | € | 54.99 | 4.58 |
| `anm-00-001-12` | € | 54.99 | 4.58 |

## How a page card uses it
Add a directive line `sku: <sku>` as the first paragraph of the card body.
The block reads it, removes it, looks up the price, and injects:
- yearly price into `.cards-pricing-trio-annual` (keeps authored `/year`)
- monthly price into `.cards-pricing-trio-price` (keeps authored `/month`)

Cards with no `sku:` (e.g. free-trial) are left untouched.

## Publishing the feed
Target the same URL the POC uses → `/language-masters/en/pricing.json`
returning `{ "data": [ { sku, currency, yearly, monthly } ], ":type": "sheet" }`.
A GraphQL persisted query over `pricing-sku` fragments (or an EDS JSON sheet)
produces it. Keep keys + URL identical so `pricing.js` is unchanged.

## Publish step
Select the model + all CF instances → Publish.

## Locale expansion (later)
Repeat per language master:
`/content/dam/avg-eds-garry/language-masters/{de,fr}/pricing/` →
`/language-masters/{de,fr}/pricing.json`. `pricing.js` accepts a `feedPath`
arg so a block can request the locale feed.
