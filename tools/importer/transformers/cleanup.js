/* eslint-disable */
/* global WebImporter */

/**
 * Site-wide DOM cleanup transformer for avg.com migration.
 *
 * Removes non-authorable site chrome (navigation, footer, language modal),
 * widgets that cannot be migrated (Trustpilot/Adobe iframes), tracking and
 * visibility helpers, the scan popup modal, duplicate hidden buy variants
 * (mac/android/ios) and inline data: URL images.
 *
 * All selectors below were verified against migration-work/cleaned.html for
 * the AVG AntiTrack (en-eu) page. Do not add selectors that have not been
 * verified to exist in the captured DOM.
 *
 * Signature: transform(hookName, element, payload)
 *  - hookName  : 'beforeTransform' | 'afterTransform'
 *  - element   : the <main> / root element being mutated
 *  - payload   : importer payload (template, url, etc.) - unused here
 *
 * Mutates the DOM in place. Does not return a value.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

// Site chrome / widgets / tracking - all selectors verified in cleaned.html.
const BEFORE_REMOVE_SELECTORS = [
  // Page header / navigation chrome
  'nav#menu',
  'nav.global-navigation',
  'nav.navigation',
  'header',
  '.header',
  '#header',
  // Page footer (the AVG site has both #bottom holding the link menu and
  // #footer holding the copyright row — both must go)
  '#bottom',
  '#footer',
  'footer',
  '.footer',
  '.copyright-row',
  '.footer-links',
  '.login-section',
  '.bi-nav-footer-links',
  // Language switcher modal
  '.language-selector',
  '#language-selector',
  // Scan popup modal
  '.js-scan-popup',
  '.scan-popup',
  // Trustpilot iframe widget cannot be migrated
  '.trustpilot-widget',
  // Bi-visibility tracking helpers
  '[class*="bi-visibility-"]',
  // Cookie consent, geo banners, and CHEQ debug overlay
  '#onetrust-banner-sdk',
  '.onetrust-pc-dark-filter',
  '.cookie-banner',
  '.geo-banner',
  '.bi-cookie-banner',
  '#cheq__cookie-preferences',
  '#cheq__cookie-preferences--banner',
  '#cheq__cookie-preferences--modal',
  '[id^="cheq__"]',
  '[class^="cheq__"]',
  '[class^="cheqMini__"]',
  '.cheq-debug',
  '#cheq-dev',
  '[id^="cheq-dev"]',
  '[class^="cheq-dev"]',
  '#cheqMini',
  '[id^="cheqMini"]',
  '#ensNotifyBanner',
  '.ensNotifyBanner',
  '[id^="ens"]',
  // CHEQ-rendered Q&A modal anchor div with Zendesk style id
  '[id^="ZN_"]',
  // Bing UET tracking beacons
  '[id^="batBeacon"]',
  // Tracking pixels (Bing/MS UET, Adobe Audience Manager etc)
  'img[src*="bat.bing.com"]',
  'img[src*="demdex.net"]',
  'img[src*="omtrdc.net"]',
  'img[src*="doubleclick.net"]',
  'img[src*="google-analytics.com"]',
  'img[src*="googletagmanager.com"]',
  // Pre-content nav rows (top utility bar with Log in / Blog / language flag)
  '.navigation-top',
  '.navigation-header',
  '.bg-image-sni-0',
  // Sticky platform-detect bar (logo + Download free trial + Buy Now)
  '#sticky-bar-platform-detect',
  '.sticky-bar',
  // Header parsys placeholder
  '.header-parsys',
  // Inline assets that are never authorable
  'script',
  'style',
  'noscript',
  'link[rel="stylesheet"]',
  // All iframes
  'iframe',
];

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // 1) Remove non-authorable site shell, widgets, tracking, scripts/iframes
    //    BEFORE block parsing so block parsers see only authorable content.
    WebImporter.DOMUtils.remove(element, BEFORE_REMOVE_SELECTORS);

    // 2) Remove duplicate hidden buy variants inside action boxes.
    //    Verified in cleaned.html: each .actionbox holds .js-pc + .js-mac +
    //    .js-android + .js-ios siblings (lines 636-651, 658-660, 1007-1039).
    //    Keep only .js-pc (the default visible variant) and drop the rest.
    const hiddenBuyVariants = element.querySelectorAll(
      '.actionbox .js-mac, .actionbox .js-android, .actionbox .js-ios',
    );
    hiddenBuyVariants.forEach((node) => {
      if (node && node.parentNode) node.remove();
    });

    // 3) Strip inline data: URLs from <img src> so the importer does not try
    //    to download huge inline base64 SVGs (verified: navigation close icons
    //    at lines 41, 55, 116, 177, etc. all use src="data:image/svg+xml;...").
    element.querySelectorAll('img[src^="data:"]').forEach((img) => {
      img.setAttribute('src', '');
    });

    // 4) Remove stray empty Vue comment placeholders (<!---->) that appear
    //    throughout the rendered output (e.g. lines 407, 460, 467, 491).
    //    Walk all comment nodes under element and drop empty ones.
    const removeEmptyComments = (root) => {
      const walker = root.ownerDocument.createTreeWalker(
        root,
        // NodeFilter.SHOW_COMMENT === 128
        128,
        null,
        false,
      );
      const comments = [];
      let current = walker.nextNode();
      while (current) {
        comments.push(current);
        current = walker.nextNode();
      }
      comments.forEach((c) => {
        if (!c.nodeValue || c.nodeValue.trim() === '') {
          if (c.parentNode) c.parentNode.removeChild(c);
        }
      });
    };
    removeEmptyComments(element);
  }

  if (hookName === TransformHook.afterTransform) {
    // 5) Defensive sweep for any chrome elements re-introduced by parsers
    //    or that survived the beforeTransform pass.
    WebImporter.DOMUtils.remove(element, [
      'nav#menu',
      'header',
      '#footer',
      '.language-selector',
      '#language-selector',
      'iframe',
      'noscript',
      'link[rel="stylesheet"]',
      '[class*="bi-visibility-"]',
    ]);

    // 6) Remove empty <div> elements (no children, no text content).
    //    The Vue render leaves many wrappers behind once their content has
    //    been pulled into block tables. Iterate until stable so we collapse
    //    nested empty wrappers as well.
    let removedThisPass;
    do {
      removedThisPass = 0;
      element.querySelectorAll('div').forEach((div) => {
        // Skip if it has any child elements or non-whitespace text
        if (div.children.length === 0 && (!div.textContent || div.textContent.trim() === '')) {
          // Skip divs that carry an id we may still need (defensive)
          if (div.id && div.id.length > 0) return;
          if (div.parentNode) {
            div.parentNode.removeChild(div);
            removedThisPass += 1;
          }
        }
      });
    } while (removedThisPass > 0);

    // 7) Strip class attributes everywhere except where parsers depend on
    //    selectors. Parsers run before this hook, so the AEM block tables
    //    they emitted no longer need classes for matching. We keep id
    //    attributes (used by section transformer) and href/src/alt.
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('class');
      el.removeAttribute('style');
      el.removeAttribute('onclick');
      el.removeAttribute('data-track');
      el.removeAttribute('data-analytics');
    });
  }
}
