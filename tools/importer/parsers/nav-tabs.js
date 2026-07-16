/* eslint-disable */
/* global WebImporter */
/**
 * Parser for nav-tabs. Base: nav/tabs.
 * Source: https://www.avg.com/en-ww/installation-files-business#pc
 * nav-tabs.js reads ALL <a> in the block and builds one <li> per link, marking the tab
 * whose pathname matches the current page as active. This is a content-driven block with
 * no UE model, so there are no field hints — the block holds a single cell containing a
 * bulleted list (ul>li>a) of the tab links.
 *
 * On this page:
 *   PERSONAL  -> /en-ww/installation-files
 *   BUSINESS  -> /en-ww/installation-files-business  (current/active tab)
 * The source BUSINESS anchor has no href (it is the current page), so we give it the
 * business page href so nav-tabs.js marks it active when this page is served.
 */
export default function parse(element, { document }) {
  const anchors = [...element.querySelectorAll('a')];
  if (!anchors.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const ul = document.createElement('ul');

  anchors.forEach((source) => {
    const label = (source.textContent || '').trim();
    if (!label) return;

    const a = document.createElement('a');
    a.textContent = label;

    let href = source.getAttribute('href');
    // The active/current tab has no href in the source — synthesize the business page href.
    if (!href) href = '/en-ww/installation-files-business';
    a.setAttribute('href', href);

    const li = document.createElement('li');
    li.appendChild(a);
    ul.appendChild(li);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'nav-tabs', cells: [[ul]] });
  element.replaceWith(block);
}
