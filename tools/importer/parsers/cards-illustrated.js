/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-illustrated.
 * Base block: cards.
 * Source: https://www.avg.com/en-eu/antitrack (section#data .cards)
 *
 * Container block (xwalk model: card-illustrated). Each row = one illustrated card:
 *   cell 1 = top illustration image (field: image; imageAlt is collapsed onto the <img alt> attribute)
 *   cell 2 = h3 heading + paragraph combined into one richtext cell (field: text)
 *
 * Source DOM (validated against migration-work/block-context/cards-illustrated/source.html):
 *   .cards
 *     .card
 *       img (top illustration)
 *       h3.like-h4
 *       p
 */
export default function parse(element, { document }) {
  // Find every illustrated card inside the container.
  // Validated selectors: each card is a .card containing an <img>, an
  // <h3> heading, and a <p>. Fallbacks broaden the selector for layout
  // variations on other pages.
  const cards = Array.from(
    element.querySelectorAll(':scope > .card, :scope > [class*="card"]'),
  ).filter((card) => card.querySelector('img')
    && card.querySelector('h2, h3, h4, [class*="like-h"], p'));

  const cells = [];

  cards.forEach((card) => {
    // Image cell (field: image). The top illustration image. imageAlt is
    // collapsed onto the <img alt> attribute, so no separate hint is
    // emitted for it.
    const img = card.querySelector(':scope > img, img');
    const imageFragment = document.createDocumentFragment();
    if (img) {
      imageFragment.appendChild(document.createComment(' field:image '));
      imageFragment.appendChild(img);
    }

    // Text cell (field: text) — heading + paragraph combined into one
    // richtext cell as defined by the card-illustrated model.
    const heading = card.querySelector('h3, h2, h4, [class*="like-h"]');
    const paragraphs = Array.from(card.querySelectorAll('p'));

    const textFragment = document.createDocumentFragment();
    textFragment.appendChild(document.createComment(' field:text '));
    if (heading) textFragment.appendChild(heading);
    paragraphs.forEach((p) => textFragment.appendChild(p));

    cells.push([imageFragment, textFragment]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-illustrated',
    cells,
  });
  element.replaceWith(block);
}
