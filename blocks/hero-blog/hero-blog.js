export default function decorate(block) {
  // The block may arrive as a single row with two cells (document authoring)
  // or as one row per field (Universal Editor model: text, then image).
  // Normalize both into a single flex row: content on the left, image on the right.
  const cells = [...block.querySelectorAll(':scope > div > div')];

  let contentCell;
  let imageCell;
  cells.forEach((cell) => {
    if (cell.querySelector('picture, img')) {
      imageCell = cell;
    } else if (cell.textContent.trim() || cell.children.length) {
      contentCell = cell;
    }
  });

  const row = document.createElement('div');
  if (contentCell) {
    contentCell.className = 'hero-blog-content';
    row.append(contentCell);
  }
  if (imageCell) {
    imageCell.className = 'hero-blog-image';
    row.append(imageCell);
  }

  block.textContent = '';
  block.append(row);
}
