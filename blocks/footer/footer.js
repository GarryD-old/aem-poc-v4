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
};

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // FORCE proxy tunnel, ignore metadata
  const footerPath = '/global/footer';

  const fragment = await loadFragment(footerPath);

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
    regionLink.classList.add('footer-region');
    regionLink.innerHTML = `<img src="/icons/flags/${countryCode}.svg" alt="" width="24" height="24">
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
