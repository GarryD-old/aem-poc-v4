/* eslint-disable */
/* global WebImporter */
/**
 * Parser for installation-hero. Base: hero.
 * Source: https://www.avg.com/en-ww/installation-files-business#pc
 *
 * This is the reusable installation-files TEMPLATE, so the DA table exposes every
 * authorable field the block supports (per the Figma hero: optional back button,
 * optional icon, title, subheading, optional "Learn more" link). Fields absent from
 * the source page are emitted as editable placeholders so authors can fill or delete
 * them in DA.live. Simple xwalk block — each field is its own single-cell row.
 * iconAlt is a collapsed *Alt field (rides on the <img alt>), so it gets no own row.
 */
export default function parse(element, { document }) {
  const title = element.querySelector('h1, h2');
  const subheading = [...element.querySelectorAll('p')].find((p) => {
    const a = p.querySelector('a');
    return !a && p.textContent.trim();
  });

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

  // Back link — optional. Emit a placeholder authors can retarget or remove.
  const back = element.querySelector('a[data-hero-back]') || (() => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = 'Back to [somewhere]';
    return a;
  })();

  // Icon — optional. Use a real AVG shield icon as an editable placeholder.
  const icon = (() => {
    const img = document.createElement('img');
    img.src = 'https://static2.avg.com/10004907/web/i/product-icons/antivirus-business-edition-product-icon-90x90.png';
    img.setAttribute('alt', 'Page icon');
    return img;
  })();

  // Learn more — optional. Placeholder link authors can retarget or remove.
  const learnMore = (() => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = 'Learn more';
    return a;
  })();

  // Row order matches the block model: backLink, icon, title, subheading, learnMore.
  const cells = [];
  cells.push([withHint('backLink', back)]);
  cells.push([withHint('icon', icon)]);
  if (title) cells.push([withHint('title', title)]);
  if (subheading) cells.push([withHint('subheading', subheading)]);
  cells.push([withHint('learnMore', learnMore)]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'installation-hero', cells });
  element.replaceWith(block);
}
