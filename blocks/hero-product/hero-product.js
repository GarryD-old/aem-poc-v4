/*
 * hero-product variant
 * Product hero with centered headline, subhead and trust strip on a light background.
 * Variant of the base hero block.
 */

export default function decorate(block) {
  block.classList.add('hero-product');
  // Mark the picture/image wrapper so CSS can position it as a backdrop.
  const pic = block.querySelector('picture, img');
  if (pic) {
    const wrapper = pic.closest('div');
    if (wrapper) wrapper.classList.add('hero-product-media');
  }
  // Wrap remaining text content for centered alignment.
  [...block.children].forEach((row) => {
    if (!row.classList.contains('hero-product-media')) {
      row.classList.add('hero-product-content');
    }
  });
}
