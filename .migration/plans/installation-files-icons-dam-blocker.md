# Installation-Files Icons → DAM Delivery (BLOCKED) + DA.live self-host interim

**Status:** ⛔ DAM public delivery is **blocked on the current dev program**. Interim fix: **self-host the icon SVGs in DA.live**.

## The 10 EN installation-files pages

Live at `main--aem-poc-v4--garryd-old.aem.page/avg-installation-files/en/…` (2 landing + 8 product-detail). They currently reference **scraped `static2.avg.com` product icons** (old/placeholder). Goal: replace with the new AVG icon set.

## Why DAM delivery is blocked (verified 2026-07-22)

Tested on dev program `p149556-e1749225`:

- `https://publish-p149556-e1749225.adobeaemcloud.com/content/dam/avg/icons/product/consumer/Clear1.svg` → **403** (even after Quick Publish).
- Moved/published to `…/content/dam/avg-eds-garry/avg1/icons/product/consumer/Clear1.svg` → **still 403**.
- Even antitrack-style paths `…/content/dam/avg-eds-garry/avg/icons/…` and `…/icons/…` → **403 anonymously in a real browser** (not just curl).
- The `antitrack` page itself **404s** on the live site — so the assumption that "antitrack already renders DAM icons live" was based on a **stale local repo `.plain.html`**, not a live page. There is **no working DAM-delivery precedent** on this program.

**Conclusion:** the AEM **publish tier is not a public image host** on this dev program; it requires auth. No `/content/dam/**` URL renders publicly here, regardless of folder or publish state.

## What would unblock true DAM delivery (future)

- **Assets Open API / delivery** enabled on the program → `delivery-p149556-e1749225.adobeaemcloud.com/adobe/assets/urn:aaid:aem:<uuid>/original/as/<name>.svg` (URN-based, needs per-asset UUID), **or**
- A **production environment** whose publish tier / CDN is internet-facing → path-based `publish-…/content/dam/…`.
- The author **share link** (`linkshare.html?sh=…`) is auth/expiring — NOT usable as a production `<img src>`.

## Interim solution: self-host SVGs in DA.live

Decision: put the icon SVGs on our own site so they always render, under a shared, locale-agnostic folder:

- **DA.live upload:** `POST https://admin.da.live/source/garryd-old/aem-poc-v4/avg-installation-files/icons/{name}.svg`
- **Referenced in pages as:** `/avg-installation-files/icons/{name}.svg` (served from the site origin).
- Shared folder → reused by future `fr-fr`/`en-eu`/`pt-pt` installation pages (icons are locale-agnostic).

**File delivery route:** zip upload to the agent is blocked, so the SVG files come in via **GitHub** — user pushes the SVGs to the repo, the agent reads them from disk and POSTs each to DA.live.

## Regeneration is a one-liner once icons are hosted

`migration-work/generate-installation-da.mjs` + `migration-work/installation-data.json` already produce all 10 `.da.html`. Swapping icons = change each card/hero/promo icon `src` base to `/avg-installation-files/icons/{name}.svg`, regenerate, re-POST the 10 pages, re-preview. No re-scrape, no structural work.

## Icon → product mapping (to finalize when files arrive)

**Landing cards:** AntiVirus FREE, Internet Security, TuneUp, Secure VPN (PC), AntiTrack, Driver Updater, TuneUp for Mac, Secure VPN for Mac, Business Cloud Management, Antivirus Business Edition, Internet Security Business Edition, File Server Business Edition, Email Server Business Edition.
**Product hero icons:** avb, ise, fsc, msb, gsr, gsr-free, gse, gsl.
**Promo:** AVG Clear → `Clear1.svg` (blue gear, consumer folder).

## Reusable tooling (already in repo)

- `migration-work/extract-installation-data.mjs` — live en-ww scrape → `installation-data.json` (locale-relative link rule).
- `migration-work/generate-installation-da.mjs` — `installation-data.json` → 10 `.da.html` (2 layouts).
