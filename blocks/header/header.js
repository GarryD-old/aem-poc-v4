import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

// Country code -> display name for the region selector (matches the modal list).
const COUNTRY_NAMES = {
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

// Derive the current country from the URL. Matches a locale segment (/en-us/ -> us)
// or a bare country segment (/us/ -> us). Falls back to United States.
function detectCountryCode() {
  const { pathname } = window.location;
  const locale = pathname.match(/\/[a-z]{2}-([a-z]{2})(?:\/|$)/i);
  const bare = pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
  const code = (locale?.[1] || bare?.[1] || '').toLowerCase();
  return COUNTRY_NAMES[code] ? code : 'us';
}

/**
 * Resolve candidate locale-specific fragment paths, in priority order, for the
 * page's locale. Two site layouts share this codebase (repoless):
 *  - AEM-sourced site: content mounted at .../language-masters, so nav/footer
 *    live at `/<lang>/navigation/<name>` (e.g. /en/navigation/nav) or
 *    `/<lang>/<country>/navigation/<name>` for market locales (e.g. fr/fr).
 *  - DA-sourced site: locale trees under `/global/<country>/<lang>/<name>`.
 * The caller tries each candidate then falls back to `/global/<name>`.
 * @param {string} name Fragment name, e.g. 'nav' or 'footer'
 * @returns {string[]} Candidate paths, most-specific first (may be empty).
 */
function getLocalizedFragmentPaths(name) {
  const { pathname } = window.location;
  const candidates = [];
  // <lang>-<country> locale token anywhere in the path (e.g. /fr-fr/, /en-us/).
  const token = pathname.match(/\/([a-z]{2})-([a-z]{2})(?:\/|$)/i);
  if (token) {
    const [, lang, country] = token;
    const l = lang.toLowerCase();
    const c = country.toLowerCase();
    // DA language-site tree.
    candidates.push(`/global/${c}/${l}/${name}`);
    // AEM language-masters tree (market locale, then language root).
    candidates.push(`/${l}/${c}/navigation/${name}`);
    candidates.push(`/${l}/navigation/${name}`);
    return candidates;
  }
  // Bare <a>/<b> pair as the first two path segments. On the AEM tree this is
  // <lang>/<country> (e.g. /fr/fr/); on the DA tree it's <country>/<lang>.
  const bare = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(?:\/|$)/i);
  if (bare) {
    const [, a, b] = bare;
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    candidates.push(`/${x}/${y}/navigation/${name}`); // AEM <lang>/<country>
    candidates.push(`/global/${x}/${y}/${name}`); // DA <country>/<lang>
    return candidates;
  }
  // Single leading locale segment (e.g. /en/products/...): AEM language root.
  const lang = pathname.match(/^\/([a-z]{2})(?:\/|$)/i);
  if (lang) {
    const l = lang[1].toLowerCase();
    candidates.push(`/${l}/navigation/${name}`);
  }
  return candidates;
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches && e.relatedTarget) {
      // Mobile: only close when focus genuinely moves to an element outside the
      // nav. Tapping a non-focusable row (e.g. "PC") fires focusout with a null
      // relatedTarget — ignore it, otherwise the drill-down panel would open and
      // immediately close. The menu closes via the hamburger X or back button.
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > :where(a,p)');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

async function buildBreadcrumbsFromNavTree(nav, currentUrl) {
  const crumbs = [];

  const homeUrl = document.querySelector('.nav-brand a[href]').href;

  let menuItem = Array.from(nav.querySelectorAll('a')).find((a) => a.href === currentUrl);
  if (menuItem) {
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
      menuItem = menuItem.closest('ul')?.closest('li');
    } while (menuItem);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  const placeholders = await fetchPlaceholders();
  const homePlaceholder = placeholders.breadcrumbsHomeLabel || 'Home';

  crumbs.unshift({ title: homePlaceholder, url: homeUrl });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1].url = null;
  }
  crumbs[crumbs.length - 1]['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = await buildBreadcrumbsFromNavTree(document.querySelector('.nav-sections'), document.location.href);

  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    return li;
  }));

  breadcrumbs.append(ol);
  return breadcrumbs;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Load nav as a fragment. Try each locale-specific candidate (AEM
  // language-masters and DA language-site layouts), then fall back to the
  // global English nav when the locale has no authored nav yet.
  const navCandidates = [...getLocalizedFragmentPaths('nav'), '/global/nav'];
  let fragment = null;
  for (let i = 0; i < navCandidates.length && !fragment; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    fragment = await loadFragment(navCandidates[i]);
  }

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
      navSection.addEventListener('mouseenter', () => {
        if (isDesktop.matches && navSection.classList.contains('nav-drop')) {
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', 'true');
        }
      });
      navSection.addEventListener('mouseleave', () => {
        if (isDesktop.matches) {
          navSection.setAttribute('aria-expanded', 'false');
        }
      });
    });
    navSections.querySelectorAll('.button-container').forEach((buttonContainer) => {
      buttonContainer.classList.remove('button-container');
      buttonContainer.querySelector('.button').classList.remove('button');
    });
    navSections.querySelectorAll('ul ul li').forEach((li) => {
      if (li.querySelector('strong')) {
        li.classList.add('nav-category');
      }
    });
  }

  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const search = navTools.querySelector('a[href*="search"]');
    if (search && search.textContent === '') {
      search.setAttribute('aria-label', 'Search');
    }
    const regionLink = navTools.querySelector('a[href*="region"]');
    if (regionLink) {
      const countryCode = detectCountryCode();
      const flagFile = FLAG_OVERRIDE[countryCode] || countryCode;
      regionLink.classList.add('nav-region');
      regionLink.innerHTML = `<img src="/icons/flags/${flagFile}.svg" alt="" width="24" height="24">
        <span>${COUNTRY_NAMES[countryCode]}</span>
        <svg class="nav-region-chevron" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;
      regionLink.addEventListener('click', (e) => {
        e.preventDefault();
        const existing = document.querySelector('.region-modal-overlay');
        if (existing) { existing.remove(); return; }
        const modal = document.createElement('div');
        modal.className = 'region-modal-overlay';
        modal.innerHTML = `<div class="region-modal">
          <div class="region-modal-header">
            <h2>Change country/region</h2>
            <button class="region-modal-close" aria-label="Close">✕</button>
          </div>
          <div class="region-modal-body">
            <div class="region-modal-col">
              <a href="/en-ar/"><img src="/icons/flags/ar.svg" alt="" width="24" height="24" loading="lazy">Argentina: <span>Español</span></a>
              <a href="/en-au/"><img src="/icons/flags/au.svg" alt="" width="24" height="24" loading="lazy">Australia: <span>English</span></a>
              <a href="/nl-be/"><img src="/icons/flags/be.svg" alt="" width="24" height="24" loading="lazy">België: <span>Nederlands</span></a>
              <a href="/fr-be/"><img src="/icons/flags/be.svg" alt="" width="24" height="24" loading="lazy">Belgique: <span>Français</span></a>
              <a href="/pt-br/"><img src="/icons/flags/br.svg" alt="" width="24" height="24" loading="lazy">Brasil: <span>Português do Brasil</span></a>
              <a href="/en-ca/"><img src="/icons/flags/ca.svg" alt="" width="24" height="24" loading="lazy">Canada: <span>English</span></a>
              <a href="/fr-ca/"><img src="/icons/flags/ca.svg" alt="" width="24" height="24" loading="lazy">Canada: <span>Français</span></a>
              <a href="/cs-cz/"><img src="/icons/flags/cz.svg" alt="" width="24" height="24" loading="lazy">Česká republika: <span>Čeština</span></a>
              <a href="/es-cl/"><img src="/icons/flags/cl.svg" alt="" width="24" height="24" loading="lazy">Chile: <span>Español</span></a>
              <a href="/es-co/"><img src="/icons/flags/co.svg" alt="" width="24" height="24" loading="lazy">Colombia: <span>Español</span></a>
              <a href="/en-dk/"><img src="/icons/flags/dk.svg" alt="" width="24" height="24" loading="lazy">Denmark: <span>English</span></a>
              <a href="/de-de/"><img src="/icons/flags/de.svg" alt="" width="24" height="24" loading="lazy">Deutschland: <span>Deutsch</span></a>
            </div>
            <div class="region-modal-col">
              <a href="/es-es/"><img src="/icons/flags/es.svg" alt="" width="24" height="24" loading="lazy">España: <span>Español</span></a>
              <a href="/fr-fr/"><img src="/icons/flags/fr.svg" alt="" width="24" height="24" loading="lazy">France: <span>Français</span></a>
              <a href="/en-in/"><img src="/icons/flags/in.svg" alt="" width="24" height="24" loading="lazy">India: <span>English</span></a>
              <a href="/id-id/"><img src="/icons/flags/id.svg" alt="" width="24" height="24" loading="lazy">Indonesia: <span>Bahasa Indonesia</span></a>
              <a href="/it-it/"><img src="/icons/flags/it.svg" alt="" width="24" height="24" loading="lazy">Italia: <span>Italiano</span></a>
              <a href="/ms-my/"><img src="/icons/flags/my.svg" alt="" width="24" height="24" loading="lazy">Malaysia: <span>Bahasa Melayu</span></a>
              <a href="/es-mx/"><img src="/icons/flags/mx.svg" alt="" width="24" height="24" loading="lazy">México: <span>Español</span></a>
              <a href="/nl-nl/"><img src="/icons/flags/nl.svg" alt="" width="24" height="24" loading="lazy">Nederland: <span>Nederlands</span></a>
              <a href="/en-nz/"><img src="/icons/flags/nz.svg" alt="" width="24" height="24" loading="lazy">New Zealand: <span>English</span></a>
              <a href="/no-no/"><img src="/icons/flags/no.svg" alt="" width="24" height="24" loading="lazy">Norge: <span>Norsk</span></a>
              <a href="/pl-pl/"><img src="/icons/flags/pl.svg" alt="" width="24" height="24" loading="lazy">Polska: <span>Polski</span></a>
              <a href="/pt-pt/"><img src="/icons/flags/pt.svg" alt="" width="24" height="24" loading="lazy">Portugal: <span>Português</span></a>
            </div>
            <div class="region-modal-col">
              <a href="/ru-ru/"><img src="/icons/flags/ru.svg" alt="" width="24" height="24" loading="lazy">Россия: <span>Русский</span></a>
              <a href="/de-ch/"><img src="/icons/flags/ch.svg" alt="" width="24" height="24" loading="lazy">Schweiz: <span>Deutsch</span></a>
              <a href="/sk-sk/"><img src="/icons/flags/sk.svg" alt="" width="24" height="24" loading="lazy">Slovensko: <span>Slovenčina</span></a>
              <a href="/en-za/"><img src="/icons/flags/za.svg" alt="" width="24" height="24" loading="lazy">South Africa: <span>English</span></a>
              <a href="/fr-ch/"><img src="/icons/flags/ch.svg" alt="" width="24" height="24" loading="lazy">Suisse: <span>Français</span></a>
              <a href="/en-se/"><img src="/icons/flags/se.svg" alt="" width="24" height="24" loading="lazy">Sweden: <span>English</span></a>
              <a href="/tr-tr/"><img src="/icons/flags/tr.svg" alt="" width="24" height="24" loading="lazy">Türkiye: <span>Türkçe</span></a>
              <a href="/en-gb/"><img src="/icons/flags/gb.svg" alt="" width="24" height="24" loading="lazy">United Kingdom: <span>English</span></a>
              <a href="/en-us/"><img src="/icons/flags/us.svg" alt="" width="24" height="24" loading="lazy">United States: <span>English</span></a>
              <a href="/zh-tw/"><img src="/icons/flags/tw.svg" alt="" width="24" height="24" loading="lazy">臺灣: <span>繁體中文</span></a>
              <a href="/ja-jp/"><img src="/icons/flags/jp.svg" alt="" width="24" height="24" loading="lazy">日本: <span>日本語</span></a>
              <a href="/ko-kr/"><img src="/icons/flags/kr.svg" alt="" width="24" height="24" loading="lazy">대한민국: <span>한국어</span></a>
            </div>
          </div>
          <div class="region-modal-footer">
            <a href="/es-ww/"><img src="/icons/flags/globe.svg" alt="" width="24" height="24" loading="lazy">América Latina (español)</a>
            <a href="/en-eu/"><img src="/icons/flags/globe.svg" alt="" width="24" height="24" loading="lazy">Europe (English)</a>
            <a href="/en-ww/"><img src="/icons/flags/globe.svg" alt="" width="24" height="24" loading="lazy">Worldwide (English)</a>
          </div>
        </div>`;
        document.body.append(modal);
        const closeModal = () => modal.remove();
        modal.querySelector('.region-modal-close')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (evt) => {
          if (evt.target === modal) closeModal();
        });
      });
    }
  }

  // Group the sections + tools into a single slide-in panel for mobile. On
  // desktop `.nav-mobile-menu` is display:contents, so brand/sections/tools
  // still flow in the nav flex row exactly as before.
  const menuPanel = document.createElement('div');
  menuPanel.className = 'nav-mobile-menu';
  if (navSections) menuPanel.append(navSections);
  if (navTools) menuPanel.append(navTools);
  nav.append(menuPanel);

  // Mobile drill-down: each top-level item with a submenu gets a back header
  // and, when tapped, slides its submenu in as a full panel.
  if (navSections) {
    const closeAllDrilled = () => {
      navSections.querySelectorAll('.nav-mobile-open').forEach((el) => el.classList.remove('nav-mobile-open'));
    };
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li.nav-drop').forEach((li) => {
      const submenu = li.querySelector(':scope > ul');
      if (!submenu) return;
      const title = getDirectTextContent(li);
      const back = document.createElement('li');
      back.className = 'nav-mobile-back';
      back.innerHTML = `<button type="button" aria-label="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>${title}</span>
        </button>`;
      submenu.prepend(back);
      back.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        li.classList.remove('nav-mobile-open');
      });
      li.addEventListener('click', (e) => {
        if (isDesktop.matches) return;
        // Ignore taps on the submenu contents (links / back button).
        if (e.target.closest('.nav-mobile-back') || e.target.closest('a')) return;
        if (e.target.closest(':scope > ul') && e.target.closest('ul') === submenu) return;
        e.preventDefault();
        li.classList.add('nav-mobile-open');
      });
    });
    // Collapse any drilled submenu whenever the whole menu is toggled closed.
    nav.addEventListener('nav-menu-close', closeAllDrilled);
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    const wasExpanded = nav.getAttribute('aria-expanded') === 'true';
    toggleMenu(nav, navSections);
    if (wasExpanded) nav.dispatchEvent(new CustomEvent('nav-menu-close'));
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  // Resize-flicker guard: suppress nav transitions while the window is actively
  // resizing so the slide-in panel/submenus don't animate as the layout flips
  // between desktop and mobile. Re-enable transitions once resize settles.
  let resizeSettleTimer;
  window.addEventListener('resize', () => {
    nav.classList.add('nav-resizing');
    clearTimeout(resizeSettleTimer);
    resizeSettleTimer = setTimeout(() => nav.classList.remove('nav-resizing'), 200);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Optional breadcrumbs, enabled per-page via the `breadcrumbs` metadata flag.
  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
