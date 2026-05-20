# AVG AntiTrack — Content Migration Plan (avg.com → AEM EDS)

## Status

**Plan approved — execution gated.** Plan mode is currently active, which restricts me to read-only tools (Read, Grep, Glob, AskUserQuestion). I cannot run the Playwright scrape, generate parser/transformer files, run `run-bulk-import.js`, or write to `/content/antitrack.html` from inside plan mode.

To start Phase 1-4, the user must **exit plan mode** (the harness's Execute mode toggle / approval). Once switched, the steps below run as listed.

## Goal

Migrate the **content** of `https://www.avg.com/en-eu/antitrack#pc` into a new AEM Edge Delivery Services page, structured to match the **AVG AntiTrack — Desktop** layout in Figma (`8rqXJHOgsb99dBqYnrepyI`, node `3831:297798`). Strip the source site's legacy layout/styling; map the extracted text into the EDS block palette; rely on tokens/base styles in `styles/styles.css`.

## Source

- **Live URL:** `https://www.avg.com/en-eu/antitrack#pc`
- **Figma frame:** `3831:297798` — *AVG AntiTrack - Desktop* (1600 × 12209) — 16 sections (Hero, WYSIWYG ×3, Product UI, Bait ×5, Awards, Before Footer Teaser, Product Info, Cross Promo, Carousel, Footer).

## Target structure (Figma section → EDS block intent)

| # | Figma section (node) | Likely EDS block | Content from live page |
|---|---|---|---|
| 1 | Hero (`3831:322311`) | `hero` | Product name, headline, subhead, primary CTA, hero supporting visual, ratings/trust strip |
| 2 | WYSIWYG (`3831:297800`) | default-content + `cards` | Two-pricing card module (1 device / 10 devices) + 3 trust callouts (scan + emails / identity / payments) |
| 3 | WYSIWYG (`4430:417133`) | default-content section | "What AVG AntiTrack does" intro line |
| 4 | Product UI (`3831:297803`) | `cards` (4-up + 3-up grid) | Feature tile grid: 7 short feature blurbs |
| 5 | Bait #1 (`3876:130242`) | `columns` (text + image) | Feature explainer block 1 |
| 6 | Bait #2 (`3840:137223`) | `columns` (image + text) | Feature explainer block 2 |
| 7 | Bait #3 (`4419:190501`) | `columns` (text + image) | Feature explainer block 3 |
| 8 | Bait #4 (`4419:190729`) | `columns` (image + text) | Feature explainer block 4 |
| 9 | Bait #5 (`3840:140304`) | `columns` (text + image) | Feature explainer block 5 |
| 10 | WYSIWYG (`3840:230700`) | default-content + 3 step icons | "How it works" — 3-step icon row |
| 11 | Awards (`3840:230569`) | `cards` ("Awards") + testimonial cards | Awards row + 3 testimonials with star ratings |
| 12 | Before Footer Teaser (`3831:301505`) | `hero` (variant) or CTA banner | Repeat product CTA + pricing ribbon |
| 13 | Product Info (`3831:297811`) | `accordion` | FAQ section (FAQs / How to install / System requirements tabs) |
| 14 | Cross Promo (`3840:184322`) | `cards` (3-up) | "You might also be interested in" — 3 sibling products |
| 15 | Carousel (`3831:297812`) | `carousel` | Article cards row with paging |
| 16 | Footer (`3831:297813`) | repo's `blocks/footer` fragment | **Out of scope** — handled by existing footer fragment |

## Content mapping rules

- **Headline / subhead:** lift the live page's H1 + descriptive lede only — no marketing copy invented.
- **Pricing:** extract the two SKU offers (1-device / 10-device), price, "Save N%" badge, CTA label, "Try it free for X days" microcopy. Pricing strings copied verbatim from the live page (numbers + currency).
- **Feature tiles:** extract feature label + 1-2 line blurb per tile. Drop legacy icon classes.
- **FAQs:** extract Q/A pairs as-is. Each Q becomes an accordion summary; A becomes the body.
- **Testimonials / awards:** lift quote text + attribution + star count + award badge year/issuer.
- **Trademark / legal lines:** preserved as-is at section bottoms.
- **Long-form / borderline-licensed paragraphs:** summarize rather than copy verbatim. Capture short factual product copy (feature names, prices, FAQs, headings) — do not reproduce extended whitepaper-style passages even if they appear on the page.

## Authoring approach (EDS-native)

1. **Page document** at `/content/antitrack.html` — produced by the import pipeline; sections separated by `---`; blocks expressed as tables.
2. **Section metadata** for any section needing `style: highlight` (light grey alt-bg) or `style: dark`.
3. **Page metadata** block — title, description, OG image, robots — extracted from the live page's `<meta>` tags.
4. **Local images** — only product visuals visible in the Figma frame; downloaded under the import pipeline's media path.

## Pipeline (Phases 1-4)

### Phase 1 — Page analysis & content extraction
- Run `excat:excat-page-analysis` against `https://www.avg.com/en-eu/antitrack#pc` (Playwright-backed; renders JS, captures geo-resolved pricing).
- Outputs: cleaned HTML, analysis JSON, screenshots, downloaded images (cached under `migration-work/...`).

### Phase 2 — Block mapping (Figma → EDS)
- Inspect the analysis JSON; map each detected section to the Figma section list above.
- Run `excat:block-mapping-manager` to record DOM-selector → block-variant mappings in `page-templates.json`.
- For any Figma section without an existing block variant, run `excat:block-variant-manager` (new variants only when ≥70% similarity match fails). All new variant CSS uses existing `:root` tokens — no new tokens introduced.

### Phase 3 — Import infrastructure & content write
- Run `excat:excat-import-infrastructure` to generate parsers (per block variant) and transformers (cleanup + sections).
- Run `excat:excat-import-script` to bundle the page template + parsers + transformers into `tools/importer/import.js`.
- Run `run-bulk-import.js` over the AntiTrack URL → produces `/content/antitrack.html`.
- The content document is **never** hand-edited.

### Phase 4 — Preview & verification
- Render the imported page through the local preview server.
- Compare:
  - **Content fidelity:** preview vs live page (pricing, FAQs, feature names verbatim).
  - **Structural fidelity:** preview vs Figma frame (16-section order; block selection per section).
- `playwright_evaluate` checks: headings use `var(--heading-font-family)`; CTA bg uses `var(--link-color)`; alt sections use `var(--light-color)`; no inline color/font hard-codes.
- Iterate parser/transformer fixes (max 2 cycles) before raising blockers.

## Token & style guarantees

- All blocks reference variables from `styles/styles.css`. **No hard-coded hex values inside block CSS.**
- Section alt backgrounds use `section-metadata: style: highlight` → existing `main .section.highlight { background-color: var(--light-color); }` rule.
- CTA buttons use the existing pill button rule already in `styles.css`. No per-block button overrides.
- Headings inherit the global `h1`-`h6` scale.

## Out of scope

- Updating `:root` token values (separate plan; deferred).
- Header / footer / nav block code or content.
- Cookie banner, IP-detection geo banner, GTM/analytics scripts.
- Search overlay & language switcher in the live nav.
- Localised variants other than `en-eu`.

## Risks & notes

- **JS-rendered content** — pricing and FAQ require Playwright-rendered scrape (not raw HTML).
- **Currency / pricing variability** — `en-eu` resolves to per-visitor currency. Captured prices are static at import time.
- **Image rights** — third-party logos (PCMag, Trustpilot, av-test) are referenced only as already-displayed badge images; not redrawn.
- **Figma "Bait" sections** are placeholders ("Lorem ipsum…") in the design — for those, fall back to the live page's own explainer copy. Figma defines structure; live page defines content.
- **No copyrighted reproduction** — long-form passages summarized, not copied verbatim. Short factual product copy (feature names, prices, headings, FAQ Q/A) is captured as-is because it constitutes the product page itself.
- **Trustpilot widget** — capture rating as a static number; do not attempt to reproduce a live widget.

## Preview link

Preview link will only be available **after** Phase 3 completes and the content document exists. The link is provided as the final step — it cannot be supplied while plan mode is active.

## Checklist

- [ ] **Plan-mode gate:** exit plan mode / switch to Execute mode (only the user can do this; I cannot self-approve).
- [ ] Confirm the page slug + path: `/content/antitrack` (default) — flag for change if a different IA was already established.
- [ ] Run `excat:excat-page-analysis` against `https://www.avg.com/en-eu/antitrack#pc`; capture cleaned HTML, analysis JSON, screenshots, scraped images.
- [ ] Verify the 16-section split in analysis JSON matches the Figma section list; flag mismatches before mapping.
- [ ] Pull focused `get_design_context` per Figma section only when the parser/transformer needs structural detail beyond the screenshot.
- [ ] For each Figma section, confirm a corresponding EDS block exists in `/blocks/` or in the Block Library; queue any missing variants.
- [ ] Run `excat:block-mapping-manager` to add DOM-selector-to-block mappings (entry in `page-templates.json`).
- [ ] If any block variant requires creation: run `excat:block-variant-manager` with full metadata; CSS only references existing tokens in `styles/styles.css`.
- [ ] Generate parser + transformer files via `excat:excat-import-infrastructure` for any new section shapes (Hero, Bait, Before Footer Teaser, Cross Promo, Carousel) not already in `tools/importer/parsers/` and `tools/importer/transformers/`.
- [ ] Generate the import script via `excat:excat-import-script` combining the page template with the parsers/transformers.
- [ ] Bundle and run the import via `run-bulk-import.js`; verify the resulting document lands at `/content/antitrack.html`.
- [ ] Inspect the imported document for: section breaks (`---`), block tables in correct order matching the Figma section list, Section Metadata blocks where alt-bg is needed, Page Metadata block at the bottom, no inline styles, no leaked legacy class names.
- [ ] Sanity-check pricing strings, FAQ Q/A, testimonial quotes against the live page; summarized passages flagged in the final report.
- [ ] Sanity-check images: only those visible in the Figma frame are referenced; logos limited to what the live page legitimately displays.
- [ ] Render the page through the local preview; snapshot DOM structure; verify each Figma section maps to a rendered block.
- [ ] `playwright_evaluate` checks: heading font family, CTA background color, alt section background — all bound to `:root` tokens.
- [ ] Side-by-side comparison: live AntiTrack page vs Figma frame vs preview render.
- [ ] Iterate parser/transformer fixes (cap at 2 cycles) before raising blockers via AskUserQuestion.
- [ ] Final report: imported document path, preview link, list of new block variants created, list of images downloaded, list of FAQs imported, any passages summarized rather than copied verbatim, any sections that fell back to live-page copy because Figma had Lorem placeholders.

> **Execution requires Execute mode.** I'm holding here. To begin Phase 1, exit plan mode (or instruct the harness to switch to Execute) and I will start the page analysis immediately and report progress section-by-section.
