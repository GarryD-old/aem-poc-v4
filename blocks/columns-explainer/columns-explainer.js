/*
 * columns-explainer variant
 * Two-column explainer layout: image column + text/list column on a dark backdrop.
 * Variant of the base columns block.
 */

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-explainer-${cols.length}-cols`);

  // mark image-only columns so CSS can position them as the visual side
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-explainer-img-col');
        }
      }
    });
  });
}
