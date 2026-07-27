import { loadFragment } from '../fragment/fragment.js';

// Country code -> display name, matched from the locale segment of the URL.
const FOOTER_COUNTRY_NAMES = {
  ar: 'Argentina',
  au: 'Australia',
  be: 'België',
  br: 'Brasil',
  ca: 'Canada',
  cz: 'Česká republika',
  cl: 'Chile',
  co: 'Colombia',
  dk: 'Denmark',
  de: 'Deutschland',
  es: 'España',
  fr: 'France',
  in: 'India',
  id: 'Indonesia',
  it: 'Italia',
  my: 'Malaysia',
  mx: 'México',
  nl: 'Nederland',
  nz: 'New Zealand',
  no: 'Norge',
  pl: 'Polska',
  pt: 'Portugal',
  ru: 'Россия',
  ch: 'Schweiz',
  sk: 'Slovensko',
  za: 'South Africa',
  se: 'Sweden',
  tr: 'Türkiye',
  gb: 'United Kingdom',
  us: 'United States',
  tw: '臺灣',
  jp: '日本',
  kr: '대한민국',
  ww: 'Worldwide',
};

// Country codes with no national flag — use the globe icon instead of {code}.svg.
const FLAG_OVERRIDE = { ww: 'globe' };

/**
 * Resolve candidate locale-specific fragment paths, in priority order. Two site
 * layouts share this codebase (repoless): the AEM-sourced site mounts content
 * at .../language-masters, so nav/footer live at `/<lang>/navigation/<name>` or
 * `/<lang>/<country>/navigation/<name>`; the DA-sourced site uses
 * `/global/<country>/<lang>/<name>`. Caller tries each then `/global/<name>`.
 * @param {string} name Fragment name, e.g. 'footer'
 * @returns {string[]} Candidate paths, most-specific first (may be empty).
 */
function getLocalizedFragmentPaths(name) {
  const { pathname } = window.location;
  const candidates = [];
  const token = pathname.match(/\/([a-z]{2})-([a-z]{2})(?:\/|$)/i);
  if (token) {
    const [, lang, country] = token;
    const l = lang.toLowerCase();
    const c = country.toLowerCase();
    candidates.push(`/global/${c}/${l}/${name}`);
    candidates.push(`/${l}/${c}/navigation/${name}`);
    candidates.push(`/${l}/navigation/${name}`);
    return candidates;
  }
  const bare = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(?:\/|$)/i);
  if (bare) {
    const [, a, b] = bare;
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    candidates.push(`/${x}/${y}/navigation/${name}`);
    candidates.push(`/global/${x}/${y}/${name}`);
    return candidates;
  }
  const lang = pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
  if (lang) {
    candidates.push(`/${lang[1].toLowerCase()}/navigation/${name}`);
  }
  return candidates;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // Try each locale-specific footer candidate (AEM language-masters and DA
  // language-site layouts), then fall back to the global English footer when
  // the locale has no authored footer yet.
  const footerCandidates = [...getLocalizedFragmentPaths('footer'), '/global/footer'];
  let fragment = null;
  for (let i = 0; i < footerCandidates.length && !fragment; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    fragment = await loadFragment(footerCandidates[i]);
  }

  block.textContent = '';

  const sections = [...fragment.querySelectorAll(':scope .section')];

  // Build footer structure: top row (columns) + bottom row
  const topRow = document.createElement('div');
  topRow.className = 'footer-top';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'footer-bottom';

  // First section = brand (logo + country + login)
  // Sections 2-5 = columns (About, Home products, Customer area, Partners)
  // Last section = bottom (copyright)
  sections.forEach((section, i) => {
    section.querySelectorAll('a.button').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      const wrapper = a.closest('.button-container');
      if (wrapper) wrapper.classList.remove('button-container');
    });

    if (i < sections.length - 1) {
      topRow.append(section);
    } else {
      bottomRow.append(section);
    }
  });

  // Add logo to brand section
  const brandSection = topRow.querySelector(':scope > div:first-child');
  if (brandSection) {
    const logo = document.createElement('div');
    logo.className = 'footer-logo';
    brandSection.prepend(logo);
  }

  // Link columns (every top-row div except the brand) become accordions on
  // mobile: the heading is a toggle button and the links collapse below it.
  const columns = [...topRow.children].filter((col) => col !== brandSection);
  columns.forEach((col) => {
    col.classList.add('footer-column');
    const heading = col.querySelector('strong');
    if (!heading) return;

    const headingP = heading.closest('p') || heading.parentElement;
    // Paragraphs may sit inside a `.default-content-wrapper`; operate on that
    // actual container so we don't move the whole wrapper (and the heading)
    // into the collapsible group.
    const contentHost = headingP.parentElement;

    // Collect every link paragraph after the heading into a collapsible group.
    const links = document.createElement('div');
    links.className = 'footer-column-links';
    [...contentHost.children].forEach((child) => {
      if (child !== headingP) links.append(child);
    });

    // Toggle button carries the heading text + a chevron (CSS-drawn).
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'footer-column-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.append(...headingP.childNodes);
    headingP.replaceWith(toggle);
    contentHost.append(links);

    toggle.addEventListener('click', () => {
      const open = col.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  });

  block.append(topRow);
  block.append(bottomRow);

  // Country selector: trigger same modal as header nav
  const regionLink = block.querySelector('a[href*="region"]');
  if (regionLink) {
    const { pathname } = window.location;
    const locale = pathname.match(/\/[a-z]{2}-([a-z]{2})(?:\/|$)/i);
    const bare = pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
    const code = (locale?.[1] || bare?.[1] || '').toLowerCase();
    const countryCode = FOOTER_COUNTRY_NAMES[code] ? code : 'us';
    const flagFile = FLAG_OVERRIDE[countryCode] || countryCode;
    regionLink.classList.add('footer-region');
    regionLink.innerHTML = `<img src="/icons/flags/${flagFile}.svg" alt="" width="24" height="24">
      <span>${FOOTER_COUNTRY_NAMES[countryCode]}</span>
      <svg class="footer-region-chevron" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;
    regionLink.addEventListener('click', (e) => {
      e.preventDefault();
      const headerRegion = document.querySelector('header .nav-tools a[href*="region"]');
      if (headerRegion) {
        headerRegion.click();
      }
    });
  }
}
