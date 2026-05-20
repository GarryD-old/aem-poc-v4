/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-explainer (re-run after timeout).
 * Base block: columns (xwalk: core/franklin/components/columns/v1/columns).
 * Source: https://www.avg.com/en-eu/antitrack (section#trackers .row).
 * Block model (_columns-explainer.json): 2 columns x 1 row, single row.
 *
 * Structure (single-row, two-column):
 *   - Column 1: fingerprint illustration image
 *   - Column 2: heading + paragraphs + tracker bullet list
 *
 * NOTE (xwalk): Columns blocks must NOT include `<!-- field:* -->` field hints
 * (per hinting.md Block Types > Columns Blocks). Only default content allowed
 * in cells. Each cell is rendered as a column.
 *
 * Live DOM caveats — handled defensively:
 *   - On the live page the fingerprint visual is rendered as inline <svg>
 *     elements (NOT <img>). AEM's columns block accepts the `image` component
 *     but cannot author an inline <svg>. Strategy:
 *       1. Prefer an existing referenced (non-data:) <img> from the left col.
 *       2. Otherwise, fall back to AVG's static fingerprint icon URL that is
 *          referenced elsewhere on the same page (it represents the exact
 *          same product visual and is a real CDN asset that the importer can
 *          download and place in DAM).
 *       3. As a last resort, serialize the inline <svg> to a data: URL <img>
 *          so the visual is at least preserved.
 *   - The right column also contains a separate <img> (decorative trackers
 *     icon strip above the bullet list); we deliberately exclude any <img>
 *     elements from the right column's text content — the bullet list already
 *     represents the same information textually.
 */
export default function parse(element, { document }) {
  // ---- Locate the right (text) column first ----
  const allSpan6 = Array.from(element.querySelectorAll('.span6'));
  let rightCol = allSpan6.find(
    (c) => !c.classList.contains('finger') && c.querySelector('h1, h2, h3'),
  );
  if (!rightCol) {
    rightCol = element.querySelector('.span6:not(.finger)')
      || (element.querySelector('h1, h2, h3') && element.querySelector('h1, h2, h3').parentElement)
      || element;
  }

  // ---- Locate the left (image) column ----
  const leftCol = element.querySelector('.span6.finger, .finger, .finger-desktop, .img-fingerprint')
    || (rightCol && rightCol.previousElementSibling);

  // ---- Build column 1: fingerprint illustration ----
  const column1 = [];
  let leftImg = null;

  // 1. Prefer a referenced (non-data:) <img> already present in the left col.
  if (leftCol) {
    const candidates = Array.from(leftCol.querySelectorAll('img'));
    leftImg = candidates.find((i) => {
      const src = i.getAttribute('src') || '';
      return src && !src.startsWith('data:');
    }) || null;
  }

  // 2. Fall back to AVG's referenced fingerprint icon used elsewhere on the
  //    same page (so the importer downloads a real asset to DAM).
  if (!leftImg) {
    const pageDoc = element.ownerDocument || document;
    const referenced = Array.from(pageDoc.querySelectorAll('img'))
      .map((i) => i.getAttribute('src') || '')
      .find((src) => src && !src.startsWith('data:') && /fingerprint/i.test(src));
    if (referenced) {
      leftImg = document.createElement('img');
      leftImg.setAttribute('src', referenced);
      leftImg.setAttribute('alt', 'Digital fingerprint illustration');
    }
  }

  // 3. Last resort: serialize the inline <svg> in the left column to a data:
  //    URL <img> so the visual is at least preserved.
  if (!leftImg && leftCol) {
    const svg = leftCol.querySelector('svg');
    if (svg && typeof XMLSerializer !== 'undefined') {
      if (!svg.getAttribute('xmlns')) {
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      try {
        const xml = new XMLSerializer().serializeToString(svg);
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`;
        leftImg = document.createElement('img');
        leftImg.setAttribute('src', dataUrl);
        leftImg.setAttribute('alt', 'Digital fingerprint illustration');
      } catch (e) {
        // ignore
      }
    }
  }

  if (leftImg) {
    if (!leftImg.getAttribute('alt')) {
      leftImg.setAttribute('alt', 'Digital fingerprint illustration');
    }
    column1.push(leftImg);
  }

  // ---- Build column 2: heading + paragraphs + tracker bullet list ----
  const column2 = [];

  const heading = rightCol.querySelector('h1, h2, h3');
  if (heading) column2.push(heading);

  // Paragraphs in the right col body, NOT inside .trackers (decorative wrap).
  const trackerWrap = rightCol.querySelector('.trackers');
  const paragraphs = Array.from(rightCol.querySelectorAll('p')).filter(
    (p) => !trackerWrap || !trackerWrap.contains(p),
  );
  paragraphs.forEach((p) => column2.push(p));

  // Tracker bullet list — rebuild as a clean text-only <ul> (source <li>s
  // contain icon <img>s + label spans).
  const trackerList = rightCol.querySelector(
    'ul.tracker-list, .trackers ul, ul[class*="tracker"], ul',
  );
  if (trackerList) {
    const cleanList = document.createElement('ul');
    Array.from(trackerList.querySelectorAll(':scope > li')).forEach((li) => {
      const label = li.querySelector('.tracker-list-text, [class*="text"]');
      const text = (label ? label.textContent : li.textContent || '').trim();
      if (text) {
        const newLi = document.createElement('li');
        newLi.textContent = text;
        cleanList.appendChild(newLi);
      }
    });
    if (cleanList.children.length > 0) {
      column2.push(cleanList);
    }
  }

  // ---- Assemble cells: single data row with two columns ----
  const cells = [
    [column1, column2],
  ];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-explainer',
    cells,
  });

  element.replaceWith(block);
}
