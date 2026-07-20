/* eslint-disable */
/* global WebImporter */
/**
 * Parser for promo-box. Base: promo/callout.
 * Source: https://www.avg.com/en-ww/installation-files-business#pc
 *
 * promo-box.js classifies each row by its single cell's content:
 *   image + no link  -> product (icon row)
 *   contains a link  -> cta
 *   otherwise        -> text
 * This page's AVG Clear box has NO image, so we emit three single-cell rows:
 *   row 1 -> product name text  (field:productName)
 *   row 2 -> body paragraph      (field:text)
 *   row 3 -> Download link        (field:cta)
 * The optional `icon` reference field is absent on this page and is not fabricated.
 * Field hints inserted before content per hinting.md.
 */
export default function parse(element, { document }) {
  const paragraphs = [...element.querySelectorAll('p')];

  // Product name: first non-empty paragraph without a link.
  const nameP = paragraphs.find((p) => !p.querySelector('a') && p.textContent.trim()) || null;

  // Body text: a subsequent non-empty paragraph without a link, distinct from the name.
  const bodyP = paragraphs.find((p) => p !== nameP && !p.querySelector('a') && p.textContent.trim()) || null;

  // CTA: the download / action link.
  const cta = element.querySelector('a') || null;

  // Optional product icon (AVG Clear gear). An <img>/<picture> not inside a link.
  const iconEl = [...element.querySelectorAll('img, picture')]
    .map((el) => el.closest('picture') || el)
    .find((el) => !el.closest('a')) || null;

  if (!nameP && !bodyP && !cta && !iconEl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const withHint = (fieldName, node) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${fieldName} `));
    frag.appendChild(node);
    return frag;
  };

  // Simple block: each model field is its own single-cell ROW —
  // icon (reference) / productName (text) / text (richtext) / cta (richtext).
  // The block JS re-joins the icon and name onto one line at render time.
  const cells = [];

  if (iconEl) cells.push([withHint('icon', iconEl)]);

  if (nameP) {
    const span = document.createElement('span');
    span.textContent = nameP.textContent.trim();
    cells.push([withHint('productName', span)]);
  }

  if (bodyP) cells.push([withHint('text', bodyP)]);

  if (cta) {
    // Normalize the CTA to a clean anchor carrying its label text.
    const label = (cta.textContent || '').trim();
    const a = document.createElement('a');
    a.setAttribute('href', cta.getAttribute('href') || '#');
    a.textContent = label || 'Download';
    cells.push([withHint('cta', a)]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'promo-box', cells });
  element.replaceWith(block);
}
