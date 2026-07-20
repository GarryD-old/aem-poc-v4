/*
 * AEM -> DA.live localized nav/footer sync.
 *
 * Reads localized nav & footer markup from the AEM author instance (via the
 * franklin.delivery markup pipeline), wraps it in the DA content shape, uploads
 * it to DA.live at global/<country>/<lang>/<name>, and triggers an EDS preview
 * (and optional publish). This lets AEM stay the authoring / MSM-translation
 * home while DA.live remains the runtime content source EDS actually serves.
 *
 * Runs in CI (GitHub Actions). Credentials come from env, never hard-coded:
 *   AEM_AUTHOR_URL   e.g. https://author-p149556-e1749225.adobeaemcloud.com
 *   AEM_TOKEN        AEM service-user bearer token (GitHub Secret)
 *   DA_TOKEN         DA.live / IMS bearer token for admin.da.live + admin.hlx.page
 * Config (with sensible defaults):
 *   DA_ORG=garryd-old  DA_REPO=aem-poc-v4  EDS_BRANCH=main
 *   AEM_SITE_ROOT=/content/avg-eds-garry
 *   LOCALES=fr/fr,de/de           (comma list of <country>/<lang>; default: all from manifest)
 *   FRAGMENTS=nav,footer
 *   PUBLISH=false                  (true also calls admin.hlx.page/live)
 *
 * Usage: node tools/sync/aem-nav-footer-to-da.mjs
 */

const {
  AEM_AUTHOR_URL,
  AEM_TOKEN,
  DA_TOKEN,
  DA_ORG = 'garryd-old',
  DA_REPO = 'aem-poc-v4',
  EDS_BRANCH = 'main',
  AEM_SITE_ROOT = '/content/avg-eds-garry',
  LOCALES = '',
  FRAGMENTS = 'nav,footer',
  PUBLISH = 'false',
} = process.env;

function requireEnv(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}
requireEnv('AEM_AUTHOR_URL', AEM_AUTHOR_URL);
requireEnv('AEM_TOKEN', AEM_TOKEN);
requireEnv('DA_TOKEN', DA_TOKEN);

const fragments = FRAGMENTS.split(',').map((s) => s.trim()).filter(Boolean);

// Locales to sync: explicit LOCALES env, else derive <country>/<lang> from the
// langmaster manifest committed in the repo.
async function resolveLocales() {
  if (LOCALES.trim()) {
    return LOCALES.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const { readFile } = await import('node:fs/promises');
  try {
    const manifest = JSON.parse(await readFile('migration-work/langmaster/manifest.json', 'utf-8'));
    const set = new Set(manifest.sites.map((s) => `${s.siteCode}/${s.langCode}`));
    return [...set];
  } catch {
    console.warn('No LOCALES set and manifest not found; defaulting to fr/fr');
    return ['fr/fr'];
  }
}

// Read one fragment's markup from AEM. franklin.delivery emits EDS block markup
// for the authored page. Path: <root>/<country>/<lang>/<name>
async function readAemFragment(country, lang, name) {
  const url = `${AEM_AUTHOR_URL}/bin/franklin.delivery/${DA_ORG}/${DA_REPO}/${EDS_BRANCH}`
    + `${AEM_SITE_ROOT}/${country}/${lang}/${name}.html`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${AEM_TOKEN}` } });
  if (!res.ok) return null; // 404 = not authored for this locale; skip cleanly
  return res.text();
}

// Wrap block markup in the DA content shape DA.live expects.
function toDaHtml(inner) {
  return `\n<body>\n  <header></header>\n  <main>${inner}</main>\n  <footer></footer>\n</body>\n`;
}

async function uploadToDa(country, lang, name, daHtml) {
  const path = `global/${country}/${lang}/${name}.html`;
  const form = new FormData();
  form.append('data', new Blob([daHtml], { type: 'text/html' }), `${name}.html`);
  const res = await fetch(`https://admin.da.live/source/${DA_ORG}/${DA_REPO}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DA_TOKEN}` },
    body: form,
  });
  return { ok: res.ok, status: res.status, webPath: `/global/${country}/${lang}/${name}` };
}

async function edsAdmin(action, webPath) {
  const res = await fetch(
    `https://admin.hlx.page/${action}/${DA_ORG}/${DA_REPO}/${EDS_BRANCH}${webPath}`,
    { method: 'POST', headers: { Authorization: `Bearer ${DA_TOKEN}` } },
  );
  return { ok: res.ok, status: res.status };
}

async function main() {
  const locales = await resolveLocales();
  const publish = PUBLISH.toLowerCase() === 'true';
  let synced = 0; let skipped = 0; let failed = 0;

  for (const locale of locales) {
    const [country, lang] = locale.split('/');
    if (!country || !lang) { console.warn(`Skipping malformed locale "${locale}"`); continue; }
    for (const name of fragments) {
      // eslint-disable-next-line no-await-in-loop
      const markup = await readAemFragment(country, lang, name);
      if (markup === null) {
        console.log(`- skip ${locale}/${name} (not in AEM)`);
        skipped += 1;
        // eslint-disable-next-line no-continue
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const up = await uploadToDa(country, lang, name, toDaHtml(markup.trim()));
      if (!up.ok) {
        console.error(`x fail ${locale}/${name}: DA upload ${up.status}`);
        failed += 1;
        // eslint-disable-next-line no-continue
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      const prev = await edsAdmin('preview', up.webPath);
      let liveNote = '';
      if (publish) {
        // eslint-disable-next-line no-await-in-loop
        const live = await edsAdmin('live', up.webPath);
        liveNote = ` live:${live.status}`;
      }
      console.log(`+ sync ${locale}/${name}: DA:${up.status} preview:${prev.status}${liveNote}`);
      synced += 1;
    }
  }

  console.log(`\nDone. synced=${synced} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
