/* eslint-disable */
/* global WebImporter */
/**
 * Parser for installation-card. Base: card.
 * Source: https://www.avg.com/en-ww/installation-files-business#pc
 *
 * The page-templates instance selector matches ALL 5 .dc-item product rows, so this parser
 * runs once per product. In cleaned.html the source has unclosed <div>s, so each .dc-item is
 * DOM-nested inside the previous one. To avoid duplicating a product's content into every
 * ancestor card, we extract ONLY the current element's own content and STOP descending at any
 * nested .dc-item (see collectOwn / cloneWithoutNested helpers).
 *
 * xwalk model (2 richtext content columns + icon reference):
 *   icon / iconAlt  -> icon cell (image; iconAlt is collapsed onto the <img alt>)
 *   info            -> cell[0]: h4 name + description <p> + "Learn more" link
 *   ctas            -> cell[1]: the CTA anchors (Paid Version / More options, or
 *                      Create account / Log In for card 1)
 * installation-card.js reads cells[0] (info: picture/img + text + learn-more) and
 * cells[1] (ctas: anchors). Field hints inserted before content per hinting.md.
 */
export default function parse(element, { document }) {
  const NESTED = '.dc-item';

  // Does `node` sit inside a nested .dc-item that is a descendant of `element`
  // (i.e. it belongs to a different product, not this one)?
  const belongsToNested = (node) => {
    const owner = node.closest(NESTED);
    return owner && owner !== element;
  };

  // Collect matching nodes that belong to THIS dc-item only (skip nested products).
  const ownMatches = (selector) => [...element.querySelectorAll(selector)]
    .filter((node) => !belongsToNested(node));

  // Icon: the product image that is not inside a nested dc-item and not inside an anchor.
  const icon = ownMatches('img')
    .map((img) => img.closest('picture') || img)
    .find((el) => !el.closest('a')) || null;

  // Info cell: name (h4), description paragraph(s), and the "Learn more" link.
  const name = ownMatches('h4, h3, h2')[0] || null;
  const learnMore = ownMatches('a').find((a) => /learn more/i.test(a.textContent)) || null;
  const description = ownMatches('p').filter((p) => {
    const a = p.querySelector('a');
    return p.textContent.trim() && (!a || a !== learnMore);
  });

  // CTA anchors: every own anchor that is not the learn-more link.
  const ctas = ownMatches('a').filter((a) => a !== learnMore && (a.textContent || '').trim());

  // Empty-block guard.
  if (!name && !description.length && !ctas.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const withHint = (fieldName, nodes) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${fieldName} `));
    nodes.forEach((n) => n && frag.appendChild(n));
    return frag;
  };

  // installation-card is a SIMPLE block: each model field is its OWN ROW (one
  // column), never columns in a single row. helix-md2jcr maps row N to field N.
  // Rows: icon (reference) / info (richtext) / ctas (richtext). An image
  // (reference) must not share a richtext cell, so icon is its own row.
  const infoNodes = [];
  if (name) infoNodes.push(name);
  description.forEach((p) => infoNodes.push(p));
  if (learnMore) infoNodes.push(learnMore);

  const cells = [
    [icon ? withHint('icon', [icon]) : ''],
    [withHint('info', infoNodes)],
    [withHint('ctas', ctas)],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'installation-card', cells });
  element.replaceWith(block);
}
