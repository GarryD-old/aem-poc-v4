import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

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
    } else if (!isDesktop.matches) {
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
  // load nav as fragment
  const navMeta = getMetadata('nav');
  
  // UPDATED LINE: Forces the navPath to use the /global tunnel
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/global/nav';
  
  const fragment = await loadFragment(navPath);

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
      regionLink.addEventListener('click', (e) => {
        e.preventDefault();
        const existing = document.querySelector('.region-modal-overlay');
        if (existing) { existing.remove(); return; }
        const modal = document.createElement('div');
        modal.className = 'region-modal-overlay';
        modal.innerHTML = `<div class="region-modal">
          <div class="region-modal-header">
            <h2>Change language</h2>
            <button class="region-modal-close" aria-label="Close">✕</button>
          </div>
          <div class="region-modal-body">
            <div class="region-modal-col">
              <a href="/en-ar/">🇦🇷 Argentina: <span>Español</span></a>
              <a href="/en-au/">🇦🇺 Australia: <span>English</span></a>
              <a href="/nl-be/">🇧🇪 België: <span>Nederlands</span></a>
              <a href="/fr-be/">🇧🇪 Belgique: <span>Français</span></a>
              <a href="/pt-br/">🇧🇷 Brasil: <span>Português do Brasil</span></a>
              <a href="/en-ca/">🇨🇦 Canada: <span>English</span></a>
              <a href="/fr-ca/">🇨🇦 Canada: <span>Français</span></a>
              <a href="/cs-cz/">🇨🇿 Česká republika: <span>Čeština</span></a>
              <a href="/es-cl/">🇨🇱 Chile: <span>Español</span></a>
              <a href="/es-co/">🇨🇴 Colombia: <span>Español</span></a>
              <a href="/en-dk/">🇩🇰 Denmark: <span>English</span></a>
              <a href="/de-de/">🇩🇪 Deutschland: <span>Deutsch</span></a>
            </div>
            <div class="region-modal-col">
              <a href="/es-es/">🇪🇸 España: <span>Español</span></a>
              <a href="/fr-fr/">🇫🇷 France: <span>Français</span></a>
              <a href="/en-in/">🇮🇳 India: <span>English</span></a>
              <a href="/id-id/">🇮🇩 Indonesia: <span>Bahasa Indonesia</span></a>
              <a href="/it-it/">🇮🇹 Italia: <span>Italiano</span></a>
              <a href="/ms-my/">🇲🇾 Malaysia: <span>Bahasa Melayu</span></a>
              <a href="/es-mx/">🇲🇽 México: <span>Español</span></a>
              <a href="/nl-nl/">🇳🇱 Nederland: <span>Nederlands</span></a>
              <a href="/en-nz/">🇳🇿 New Zealand: <span>English</span></a>
              <a href="/no-no/">🇳🇴 Norge: <span>Norsk</span></a>
              <a href="/pl-pl/">🇵🇱 Polska: <span>Polski</span></a>
              <a href="/pt-pt/">🇵🇹 Portugal: <span>Português</span></a>
            </div>
            <div class="region-modal-col">
              <a href="/ru-ru/">🇷🇺 Россия: <span>Русский</span></a>
              <a href="/de-ch/">🇨🇭 Schweiz: <span>Deutsch</span></a>
              <a href="/sk-sk/">🇸🇰 Slovensko: <span>Slovenčina</span></a>
              <a href="/en-za/">🇿🇦 South Africa: <span>English</span></a>
              <a href="/fr-ch/">🇨🇭 Suisse: <span>Français</span></a>
              <a href="/en-se/">🇸🇪 Sweden: <span>English</span></a>
              <a href="/tr-tr/">🇹🇷 Türkiye: <span>Türkçe</span></a>
              <a href="/en-gb/">🇬🇧 United Kingdom: <span>English</span></a>
              <a href="/en-us/">🇺🇸 United States: <span>English</span></a>
              <a href="/zh-tw/">🇹🇼 臺灣: <span>繁體中文</span></a>
              <a href="/ja-jp/">🇯🇵 日本: <span>日本語</span></a>
              <a href="/ko-kr/">🇰🇷 대한민국: <span>한국어</span></a>
            </div>
          </div>
          <div class="region-modal-footer">
            <span>🌐 Global Website:</span>
            <a href="/es-ww/">Español</a> /
            <a href="/en-ww/">Worldwide (English)</a> /
            <a href="/en-eu/">Europe (English)</a>
          </div>
        </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.region-modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
      });
    }
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
