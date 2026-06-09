export default function decorate(block) {
  const rows = [...block.children];
  rows.forEach((row) => {
    const cols = [...row.children];
    cols.forEach((col) => {
      if (col.querySelector('picture')) {
        col.className = 'columns-feature-image';
      } else {
        col.className = 'columns-feature-content';
      }
    });
    // If the image column comes first, mark the row as reversed
    if (cols[0] && cols[0].classList.contains('columns-feature-image')) {
      row.classList.add('columns-feature-reversed');
    }
  });
}
