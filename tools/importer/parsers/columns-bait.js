/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-bait. Two-column block: image | content.
 *
 * Follows the Columns convention: one content row with as many cells as columns.
 * columns-bait.js reads row.children[0] as the image column and row.children[1] as
 * the content column (heading + paragraphs). Columns blocks do NOT use field-hint
 * comments (per hinting.md), so cells carry raw content only. Source: a `.cb-row`
 * with `.cb-image` and `.cb-content` cells. Used for the "Help us improve" media CTA.
 */
export default function parse(element, { document }) {
  const row = element.querySelector(':scope > .cb-row') || element;
  const imageCell = row.querySelector('.cb-image');
  const contentCell = row.querySelector('.cb-content');

  const img = imageCell?.querySelector('picture, img');
  const picture = img ? (img.closest('picture') || img) : null;

  if (!picture && !contentCell) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const imageFrag = document.createDocumentFragment();
  if (picture) imageFrag.appendChild(picture);

  const contentFrag = document.createDocumentFragment();
  if (contentCell) [...contentCell.childNodes].forEach((n) => contentFrag.appendChild(n));

  // One row, two columns: image | content (no field hints — Columns convention).
  // "light" variant → dark text + green outline CTA on a light section background.
  const cells = [[imageFrag, contentFrag]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-bait (light)', cells });
  element.replaceWith(block);
}
