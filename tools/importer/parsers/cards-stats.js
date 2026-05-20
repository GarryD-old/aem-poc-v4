/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-stats variant (base block: cards).
 * Source: https://www.avg.com/en-eu/antitrack — section#scan-facts .features
 * Generated: 2026-05-20
 *
 * Block library description: each block row = one stat callout;
 *   cell 1 = icon image, cell 2 = stat value (h3) + caption paragraph.
 *
 * Source DOM (validated against migration-work/block-context/cards-stats/source.html):
 *   <div class="features">
 *     <div class="feature-item">
 *       <img src="..." alt="">
 *       <p class="values">70%</p>
 *       <p>of websites track their visitors</p>
 *     </div>
 *     ... (4 feature-item children total)
 *   </div>
 *
 * UE model (blocks/cards-stats/_cards-stats.json) — card-stat fields:
 *   - image (reference)            -> field hint: image
 *   - imageAlt (collapsed via Alt) -> NO field hint (collapsed into <img alt>)
 *   - text (richtext)              -> field hint: text  (stat value + caption)
 */
export default function parse(element, { document }) {
  // First row of the block table is the block name (handled by createBlock).
  const cells = [];

  // Each .feature-item becomes one card-stat row.
  // Use :scope > so we only pick direct children, with .feature-item as fallback class.
  const items = Array.from(
    element.querySelectorAll(':scope > .feature-item, :scope > div'),
  ).filter((node) => node.querySelector('img') && node.querySelector('p'));

  items.forEach((item) => {
    // Cell 1: icon image. The img alt collapses into the image field; no
    // separate hint for imageAlt per Universal Editor field-collapsing rules.
    const img = item.querySelector('img');
    const imageCell = document.createDocumentFragment();
    if (img) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(img);
    }

    // Cell 2: stat value (promoted to <h3>) + caption paragraph, combined into
    // the richtext "text" field. Source uses <p class="values"> for the value;
    // we lift it to <h3> so the rendered card matches the cards-stats library
    // example which uses heading-style values.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));

    const valueParagraph = item.querySelector('p.values, p[class*="value"]');
    if (valueParagraph) {
      const h3 = document.createElement('h3');
      h3.textContent = valueParagraph.textContent.trim();
      textCell.appendChild(h3);
    }

    // Caption(s): every <p> that is not the value paragraph.
    const captionParagraphs = Array.from(item.querySelectorAll('p')).filter(
      (p) => p !== valueParagraph,
    );
    captionParagraphs.forEach((p) => {
      // Reference the source element directly; no need to clone.
      textCell.appendChild(p);
    });

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-stats',
    cells,
  });
  element.replaceWith(block);
}
