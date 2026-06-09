# Internet Security for Mac — New Page Migration Plan

## Overview
Create a new EDS page `internet-security-for-mac` that mirrors the Figma design (node `2340-50899`) and pulls content/links from the live AVG Mac product page. The page reuses the existing nav and footer, reuses most existing blocks from the antitrack page, and introduces **three new block variants**: a 3-card pricing block, an alternating feature-columns block, and a 2-column comparison table. Built as an xwalk content file at `content/internet-security-for-mac.plain.html`, pushed to GitHub, and intended to live under `/content/avg-eds-garry/language-masters/en` in AEM author.

## Key Decisions (confirmed)
- **Pricing cards**: Create a **new block** `cards-pricing-trio` based on the existing `cards-pricing` block, supporting 3 cards (1 Mac, 10 devices, free-trial card). Keep the original `cards-pricing` block untouched for the antitrack page.
- **Feature sections**: New block variant `columns-feature` for the alternating dark-card image+text sections.
- **Comparison table**: New block variant `table-compare2` for the 2-column Free-vs-Paid format with embedded buttons + inline pricing.
- **Prices**: Leave placeholders; user will supply exact Mac pricing values.
- **Nav/Footer**: Unchanged — reused as-is (shared fragments).

## New Pricing Block: `cards-pricing-trio`
Copy `blocks/cards-pricing/` (JS, CSS, `_cards-pricing.json`, `metadata.json`) as the base, renamed to `cards-pricing-trio`, then adapt:
- **3-card grid** instead of 2 (CSS `grid-template-columns: repeat(3, 1fr)` at desktop).
- **Card 1 (1 Mac)** & **Card 2 (10 devices)**: price, "It works out as €X/month", Buy now button, Subscription details — same structure as existing.
- **Card 3 (free trial)**: "Give it a try" heading, "Start free trial" button, "(Pay €0 at checkout)" subtext — no price line.
- Reuse existing JS patterns: platform dropdown on first card, subscription-details modal, money-back guarantee injection, AVG product heading injection (icon + title + subtitle).
- Update `_cards-pricing-trio.json` model `id`/`name`/`filter` to `cards-pricing-trio` so AEM treats it as a distinct component (avoids model-mapping conflicts).
- Free-trial card gets a CSS modifier (e.g. `.cards-pricing-trio-trial`) for distinct styling.

## Page Section Breakdown (top → bottom)
1. **Hero** — bg image, icon + "AVG Internet Security for Mac" heading, subheading, 3 pricing cards overlaid (reuse `hero` + new `cards-pricing-trio`).
2. **Shop and bank online with confidence** — text left, dark feature cards right (Payments, Website Shield) → `columns-feature`.
3. **Protect your important files from hackers** — dark cards left (Ransomware, Hacker Attacks), text right → `columns-feature` reversed.
4. **Secure your Wi-Fi network** — text left, dark cards right (Anti-phishing, Files & Email) → `columns-feature`.
5. **"With AVG Internet Security for Mac you also get"** — 3 icon features (Real-time protection, Email shield, Fast performance) → reuse `cards-features` + laptop UI image below.
6. **"Get advanced Mac protection from AVG"** — 2-column comparison table (Free Antivirus vs Internet Security) with inline pricing card + buttons → new `table-compare2`.
7. **"You may still be wondering…"** — tabs (FAQs / How to install / System requirements) → reuse `tabs`.
8. **"Get expert advice…"** — article cards → reuse `cards` (article links + images).
9. **Bottom CTA** — dark section repeating icon + heading + 3 pricing cards → reuse `cards-pricing-trio` (dark variant).

## Content Source Mapping
- **Text**: Hero, feature headings/descriptions, FAQ, system requirements from live site fetch (verbatim where available).
- **Links**: Buy-now/checkout URLs and article links scraped from live `avg.com/en-eu/internet-security-for-mac`.
- **Prices**: Placeholders pending user input.

## New Assets Required (naming convention for upload to `/content/dam/avg-eds-garry/`)
All paths use the publish URL prefix `https://publish-p149556-e1749182.adobeaemcloud.com`.

| Asset | Proposed DAM path |
|-------|-------------------|
| Hero background | `avg/hero/bg-is-mac-hero.jpg` |
| IS-Mac product icon | `avg/logo/internet-security-mac.png` |
| Payments feature card | `avg/features/feat-payments.png` |
| Website Shield card | `avg/features/feat-website-shield.png` |
| Ransomware card | `avg/features/feat-ransomware.png` |
| Hacker Attacks card | `avg/features/feat-hacker-attacks.png` |
| Anti-phishing card | `avg/features/feat-antiphishing.png` |
| Files & Email card | `avg/features/feat-files-email.png` |
| Real-time protection icon | `avg/icons/icon-realtime.png` |
| Email shield icon | `avg/icons/icon-email-shield.png` |
| Fast performance icon | `avg/icons/icon-fast-performance.png` |
| Laptop UI screenshot | `avg/hero/ui-is-mac-laptop.png` |
| Free Antivirus column icon | `avg/icons/icon-free-antivirus.png` |
| Internet Security column icon | `avg/icons/icon-internet-security.png` |
| (Reused) check-oval, win/mac icons, article images | existing paths |

## Checklist

### Setup
- [ ] Confirm Mac pricing values from user (1 Mac / 10 devices / free-trial terms)
- [ ] Confirm final asset list and naming with user; user uploads to DAM

### New Pricing Block (`cards-pricing-trio`)
- [ ] Copy `blocks/cards-pricing/` → `blocks/cards-pricing-trio/` (JS, CSS, JSON, metadata)
- [ ] Rename model `id`/`name`/`filter` to `cards-pricing-trio` in `_cards-pricing-trio.json`
- [ ] Update CSS to 3-column grid; add free-trial card modifier styling
- [ ] Adapt JS: 3-card support, free-trial card (no price, "Start free trial" CTA), retain dropdown/modal/heading injection
- [ ] Point heading icon to `internet-security-mac.png`

### Other New Block Variants
- [ ] Create `blocks/columns-feature/` — JS, CSS, `_columns-feature.json` model (alternating text + dark icon-card grid, supports reversed layout)
- [ ] Create `blocks/table-compare2/` — JS, CSS, `_table-compare2.json` model (2-column Free-vs-Paid, embedded buttons, inline pricing card, green check / grey dash cells)

### Content File
- [ ] Create `content/internet-security-for-mac.plain.html` with all 9 sections
- [ ] Hero section: bg image div + icon/heading/subheading + `cards-pricing-trio` (3 cards)
- [ ] 3× `columns-feature` sections (alternating layout, dark feature cards)
- [ ] `cards-features` "you also get" section + laptop UI image
- [ ] `table-compare2` comparison section
- [ ] `tabs` section (FAQs / How to install / System requirements) with live-site Q&A
- [ ] `cards` articles section (reuse antitrack article links/images)
- [ ] Bottom dark CTA: icon + heading + `cards-pricing-trio`
- [ ] Apply `section-metadata` styles (dark, light-gray, gradient) per Figma

### Block Code Adjustments
- [ ] Verify `tabs` block handles 3 tabs (currently 2)

### Asset Paths
- [ ] All `<img>`/CSS use `https://publish-p149556-e1749182.adobeaemcloud.com/content/dam/avg-eds-garry/...`
- [ ] No inline `<img>` inside xwalk richtext block content (use image cells, JS injection, or CSS) — per project constraint

### Validation & Delivery
- [ ] Lint all new/modified CSS and JS (no `no-descending-specificity` errors)
- [ ] Verify render on local preview (`localhost:3000/content/internet-security-for-mac`)
- [ ] Verify AEM content-model validation passes (no "component does not exist" / mapping errors)
- [ ] Commit and push to GitHub `main`
- [ ] User creates/moves page in AEM author under `/content/avg-eds-garry/language-masters/en`

> Execution requires **Execute mode**. Switch to Execute mode to begin implementing this plan.
