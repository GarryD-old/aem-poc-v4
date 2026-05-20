/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-features.
 * Base block: cards.
 * Source: https://www.avg.com/en-eu/antitrack (section#advertisers .container.grey.features)
 *
 * Container block (xwalk model: card-feature). Each row = one feature blurb:
 *   cell 1 = icon image (field: image; imageAlt is collapsed onto the <img alt> attribute)
 *   cell 2 = heading + paragraph combined into one richtext cell (field: text)
 *
 * Source DOM (validated against migration-work/block-context/cards-features/source.html):
 *   .container.grey.features
 *     .row.top / .row.bottom
 *       .span6.card
 *         .span2.ico > img
 *         .span10.text > h3 + p
 */
export default function parse(element, { document }) {
  // Find every feature card inside the container.
  // Validated selectors: each card is a .span6.card with .ico (icon image)
  // and .text (heading + paragraph) descendants. Fallbacks broaden the
  // selector for layout variations on other pages.
  const cards = Array.from(
    element.querySelectorAll('.card, .span6.card, [class*="card"]'),
  ).filter((card) => card.querySelector('.ico, [class*="ico"], img')
    && card.querySelector('.text, [class*="text"], h3, h4, p'));

  const cells = [];

  cards.forEach((card) => {
    // Image cell (field: image). imageAlt is collapsed onto the <img alt>
    // attribute, so no separate hint is emitted for it.
    const img = card.querySelector('.ico img, [class*="ico"] img, img');
    const imageFragment = document.createDocumentFragment();
    if (img) {
      imageFragment.appendChild(document.createComment(' field:image '));
      imageFragment.appendChild(img);
    }

    // Text cell (field: text) — heading + paragraph combined into one
    // richtext cell as defined by the cards-features model.
    const textContainer = card.querySelector('.text, [class*="text"]') || card;
    const heading = textContainer.querySelector('h3, h2, h4, [class*="like-h"]');
    const paragraphs = Array.from(textContainer.querySelectorAll('p'));

    const textFragment = document.createDocumentFragment();
    textFragment.appendChild(document.createComment(' field:text '));
    if (heading) textFragment.appendChild(heading);
    paragraphs.forEach((p) => textFragment.appendChild(p));

    cells.push([imageFragment, textFragment]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-features',
    cells,
  });
  element.replaceWith(block);
}
