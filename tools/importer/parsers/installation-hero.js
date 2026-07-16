/* eslint-disable */
/* global WebImporter */
/**
 * Parser for installation-hero. Base: hero.
 * Source: https://www.avg.com/en-ww/installation-files-business#pc
 * Simple xwalk block. Model fields: backLink, icon, iconAlt, title, subheading, learnMore.
 * On this page only title (h1) and subheading (p) are present — back link, icon and
 * learn-more are optional and absent, so they are NOT fabricated. Each field is its own
 * single-cell row (simple-block rule). Field hints inserted before content per hinting.md
 * (iconAlt is a collapsed *Alt field so it never gets its own hint/row).
 */
export default function parse(element, { document }) {
  // Title: the hero h1 (fall back to h2). Required.
  const title = element.querySelector('h1, h2');

  // Subheading: the first non-empty paragraph that is not a link wrapper. Optional.
  const subheading = [...element.querySelectorAll('p')].find((p) => {
    const a = p.querySelector('a');
    return !a && p.textContent.trim();
  });

  // Empty-block guard: bail if no meaningful content.
  if (!title && !subheading) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const withHint = (name, node) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${name} `));
    frag.appendChild(node);
    return frag;
  };

  const cells = [];
  if (title) cells.push([withHint('title', title)]);
  if (subheading) cells.push([withHint('subheading', subheading)]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'installation-hero', cells });
  element.replaceWith(block);
}
