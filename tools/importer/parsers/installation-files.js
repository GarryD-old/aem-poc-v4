/* eslint-disable */
/* global WebImporter */
/**
 * Parser for installation-files. Container block (filter: installation-files-row).
 *
 * Each source row is a `.if-row` carrying up to two cells:
 *   - label  (richtext): a heading, a download link, or note text
 *   - meta   (richtext, optional): right-aligned meta ("pdf", "###") or a download button
 * installation-files.js classifies each rendered row by content, so the parser's job is
 * simply to preserve label + meta per row. Field hints per hinting.md; empty meta cells
 * are left blank (no hint).
 */
export default function parse(element, { document }) {
  const rows = [...element.querySelectorAll(':scope > .if-row')];
  if (!rows.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const withHint = (name, nodes) => {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${name} `));
    nodes.forEach((n) => n && frag.appendChild(n));
    return frag;
  };

  const cells = rows.map((row) => {
    const labelCell = row.querySelector(':scope > .if-label');
    const metaCell = row.querySelector(':scope > .if-meta');

    const labelNodes = labelCell ? [...labelCell.childNodes] : [];
    const label = withHint('label', labelNodes);

    const metaText = (metaCell?.textContent || '').trim();
    if (metaText) {
      return [label, withHint('meta', [...metaCell.childNodes])];
    }
    // No meta — single-cell row (headline, alert, or link-only file row).
    return [label];
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'installation-files', cells });
  element.replaceWith(block);
}
