/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-product variant.
 * Base block: hero
 * Source URL: https://www.avg.com/en-eu/antitrack
 * Target element: section#top
 * Generated: 2026-05-20 (rev 4)
 *
 * UE model fields (from blocks/hero-product/_hero-product.json):
 *   - image     (reference)  -> hinted as <!-- field:image -->
 *   - imageAlt  (collapsed)  -> applied as the <img> alt attribute (no hint)
 *   - text      (richtext)   -> hinted as <!-- field:text -->
 *
 * Layout (simple block, one column, one row per non-collapsed field):
 *   Row 1: block name "hero-product"
 *   Row 2: background image
 *   Row 3: rich-text content (heading + subheading + trust line)
 *
 * Excludes content that belongs to sibling blocks/default content in the same
 * section (handled by other parsers / default content):
 *   - .actionbox.actionbox-facelift  -> cards-pricing block
 *   - .money-back                    -> default content
 */
export default function parse(element, { document }) {
  // ---------------------------------------------------------------------------
  // 1. Image (background visual at the top of the hero)
  // ---------------------------------------------------------------------------
  // The AVG hero banner is rendered as a CSS background-image on
  // `div.container.text-center` (verified live: getComputedStyle returns
  // url("https://static2.avg.com/10004816/web/i/antitrack/avg-hero.jpg")).
  // The inline-source variant of this section uses an <img> instead, so we
  // support both. Other images in the section (platform icons, money-back
  // badge) live inside the pricing/info widgets and must be ignored.
  let image = null;

  // (a) Prefer a real <img>/<picture> at the top of the section, outside any
  //     sibling-block widgets.
  const directMedia = element.querySelector(
    ':scope > img, :scope > picture, :scope > .container > img, :scope > .container > picture, :scope > div > img, :scope > div > picture'
  );
  if (directMedia) {
    image = directMedia;
  } else {
    const candidateImages = element.querySelectorAll('img, picture');
    for (const img of candidateImages) {
      if (img.closest('.platforms')) continue;
      if (img.closest('.actionbox')) continue;
      if (img.closest('.money-back')) continue;
      if (img.closest('.trustpilot-widget')) continue;
      image = img;
      break;
    }
  }

  // (b) Fallback: hero visual is a CSS background-image. Probe the section
  //     itself and its top-level wrappers using inline style first, then
  //     computed style (when available — only present when running in a real
  //     browser).
  if (!image) {
    const bgCandidates = [
      element,
      ...element.querySelectorAll(':scope > div, :scope > .container, :scope > .hero, :scope > [class*="hero"], :scope > [class*="banner"]'),
    ];
    const extractBgUrl = (el) => {
      const inline = el.getAttribute && el.getAttribute('style') || '';
      let match = inline.match(/background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/i);
      if (match) return match[1];
      try {
        const view = (el.ownerDocument && el.ownerDocument.defaultView) || (typeof window !== 'undefined' ? window : null);
        if (view && typeof view.getComputedStyle === 'function') {
          const computed = view.getComputedStyle(el).backgroundImage;
          if (computed && computed !== 'none') {
            const m = computed.match(/url\(["']?([^"')]+)["']?\)/i);
            if (m) return m[1];
          }
        }
      } catch (e) {
        /* getComputedStyle not available in this environment */
      }
      return null;
    };
    for (const el of bgCandidates) {
      const url = extractBgUrl(el);
      if (url) {
        const synthesised = document.createElement('img');
        synthesised.src = url;
        synthesised.alt = '';
        image = synthesised;
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Text content (heading + subheading + trust line)
  // ---------------------------------------------------------------------------
  const heading = element.querySelector('h1, h2, h3');
  const subheading = element.querySelector('p.sub-h1, .sub-h1, p');
  const trust = element.querySelector('.trustpilot-widget');

  // ---------------------------------------------------------------------------
  // 3. Build cells with xwalk field hints
  // ---------------------------------------------------------------------------
  const cells = [];

  // Image row -- field:image hint, alt is collapsed onto the <img> element.
  if (image) {
    const imgFrag = document.createDocumentFragment();
    imgFrag.appendChild(document.createComment(' field:image '));
    imgFrag.appendChild(image);
    cells.push([imgFrag]);
  } else {
    // Always emit the image row (model requires the slot); leave empty if absent.
    cells.push(['']);
  }

  // Text row -- single richtext field combining heading, subheading and trust.
  const textFrag = document.createDocumentFragment();
  textFrag.appendChild(document.createComment(' field:text '));
  if (heading) textFrag.appendChild(heading);
  if (subheading && subheading !== heading) textFrag.appendChild(subheading);
  if (trust) {
    // Replace the iframe widget with a simple trust-line paragraph that imports
    // cleanly into AEM rich text. The iframe itself is not authoring-friendly.
    const trustLine = document.createElement('p');
    trustLine.textContent = 'Customer rating powered by Trustpilot';
    textFrag.appendChild(trustLine);
  }
  cells.push([textFrag]);

  // ---------------------------------------------------------------------------
  // 4. Create block and replace the source element
  // ---------------------------------------------------------------------------
  const block = WebImporter.Blocks.createBlock(document, {
    name: 'hero-product',
    cells,
  });
  element.replaceWith(block);
}
