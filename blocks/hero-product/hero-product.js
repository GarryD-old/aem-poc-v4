/*
 * hero-product variant
 * Product hero with centered headline, subhead and trust strip on a light background.
 * Variant of the base hero block.
 */

export default function decorate(block) {
  block.classList.add('hero-product');
  // Identify the row (direct child of the block) that contains the
  // background picture, and mark it as media so CSS can position it
  // as a full-bleed backdrop. Remaining rows are content rows.
  [...block.children].forEach((row) => {
    if (row.querySelector('picture, img')) {
      row.classList.add('hero-product-media');
    } else {
      row.classList.add('hero-product-content');
    }
  });
}
