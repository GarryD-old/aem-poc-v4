import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const columns = [...block.children];
  columns.forEach((row) => {
    [...row.children].forEach((col, index) => {
      if (index === 0) {
        col.className = 'columns-bait-image';
      } else {
        col.className = 'columns-bait-content';
      }
    });
  });
  block.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '600' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
}
