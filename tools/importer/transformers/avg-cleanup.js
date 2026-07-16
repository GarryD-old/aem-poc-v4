/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AVG site-wide cleanup.
 * Removes non-authorable global chrome (header nav, footer, cookie/consent
 * banners, tracking beacons, hidden modals) so the import contains only
 * page-level authorable content under #body-inner.
 *
 * All selectors verified against migration-work/cleaned.html.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Cookie / consent UI and privacy modals that could block/skew block parsing.
    // From cleaned.html: #ensNotifyBanner (line 832), #cheqMini (834),
    // <dialog id="ensModalWrapper"> (858), #ensModalWrapper consent center.
    WebImporter.DOMUtils.remove(element, [
      '#ensNotifyBanner',
      '#cheqMini',
      '#ensModalWrapper',
      '#smb-cm-channel-utm-map',
      '#smb-cm-channel-cookie-map',
      '#ZN_8ksX2qGJaVxaYw6',
      '#modal-video',                              // hidden video modal (leaves a stray "×" close glyph)
      '.modal',                                    // any other hidden bootstrap modals
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Global site chrome — header nav and footer (per page-structure.json
    // excludedChrome: header #menu, footer #footer). Plus tracking iframes/
    // beacons, the language-selector modal, and skip links.
    WebImporter.DOMUtils.remove(element, [
      '#menu',                                     // global navigation header (line 3)
      '#footer',                                   // global footer (line 515)
      '#language-selector',                        // hidden language modal (line 695)
      '#destination_publishing_iframe_symantec_0', // Adobe ID sync iframe (line 854)
      '[id^="batBeacon"]',                         // Bing tracking beacons (line 856)
      'a.sr-only-focusable',                       // skip-to-content/menu links (693-694)
      'iframe',
      'link',
      'noscript',
      'script',
      'source',
    ]);
  }
}
