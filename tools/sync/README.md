# Localized nav/footer sync — AEM → DA.live

Authors localize **nav** and **footer** in AEM (the MSM/translation home). This
sync reads that localized markup from AEM and publishes it into **DA.live**,
which is the content source EDS actually serves. The runtime resolver in
`blocks/header/header.js` and `blocks/footer/footer.js` then loads
`global/<country>/<lang>/nav|footer` per page locale (English fallback when a
locale has none).

## Why this exists

- The deployed EDS content source for this site is **DA.live**
  (`content.da.live/garryd-old/aem-poc-v4`), confirmed via
  `admin.hlx.page/config/garryd-old/sites/aem-poc-v4.json`.
- AEM is **not** read at runtime — so localized chrome authored only in AEM
  never surfaces. This sync bridges AEM → DA.live so both DA self-service pages
  and complex EDS pages share the same language-specific nav/footer.

## What it does

For each `<country>/<lang>` locale × each fragment (`nav`, `footer`):
1. Reads `…/franklin.delivery/…/content/avg-eds-garry/<country>/<lang>/<name>.html` from AEM.
2. Wraps it in the DA content shape (`<body><header/><main>…</main><footer/></body>`).
3. `POST admin.da.live/source/garryd-old/aem-poc-v4/global/<country>/<lang>/<name>.html`.
4. `POST admin.hlx.page/preview/...` (and `/live` when `PUBLISH=true`).

Locales missing in AEM are skipped cleanly (no overwrite, no failure).

## Required GitHub Secrets

Add under **Settings → Secrets and variables → Actions** (never commit these):

| Secret | Purpose | Notes |
|---|---|---|
| `AEM_AUTHOR_URL` | AEM author base URL | e.g. `https://author-p149556-e1749225.adobeaemcloud.com` |
| `AEM_TOKEN` | Bearer token for an **AEM service/technical account** | Needs **read** on `/bin/franklin.delivery` for `/content/avg-eds-garry/**`. Use a technical-account (JWT/OAuth server-to-server) access token, refreshed by the account — not a personal login. |
| `DA_TOKEN` | Bearer token for `admin.da.live` + `admin.hlx.page` | An IMS token for a user/service with write access to the DA source and EDS admin for `garryd-old/aem-poc-v4`. |

> Do **not** paste secrets into chat, code, or commits. They live only in GitHub Secrets.

## Triggers

- **Manual:** Actions → "Sync localized nav & footer" → *Run workflow* (optionally set `locales`, `fragments`, `publish`).
- **Scheduled:** every 6h (`.github/workflows/sync-nav-footer.yaml` `cron`) — adjust/remove once a webhook drives it.
- **On AEM rollout:** fire a `repository_dispatch` (`event_type: aem-rollout`) from an AEM workflow/webhook after a rollout completes:
  ```bash
  curl -X POST -H "Authorization: Bearer <GH_PAT>" \
    -H "Accept: application/vnd.github+json" \
    https://api.github.com/repos/garryd-old/aem-poc-v4/dispatches \
    -d '{"event_type":"aem-rollout"}'
  ```

## Run locally (for testing)

```bash
AEM_AUTHOR_URL=https://author-…adobeaemcloud.com \
AEM_TOKEN=… DA_TOKEN=… \
LOCALES=fr/fr FRAGMENTS=nav,footer PUBLISH=false \
node tools/sync/aem-nav-footer-to-da.mjs
```

## Config (env)

`DA_ORG` (garryd-old) · `DA_REPO` (aem-poc-v4) · `EDS_BRANCH` (main) ·
`AEM_SITE_ROOT` (/content/avg-eds-garry) · `LOCALES` (blank = all from
`migration-work/langmaster/manifest.json`) · `FRAGMENTS` (nav,footer) ·
`PUBLISH` (false).
