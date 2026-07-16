export default function decorate(block) {
  const rows = [...block.children];

  rows.forEach((row, index) => {
    const cells = [...row.children];

    // Single-cell rows: either the section headline (first row) or an alert note.
    if (cells.length === 1) {
      const cell = cells[0];
      const link = cell.querySelector('a');
      if (index === 0 && !link) {
        row.className = 'installation-files-headline';
      } else if (!link) {
        row.className = 'installation-files-alert';
      } else {
        row.className = 'installation-files-file';
        link.classList.remove('button', 'primary', 'secondary');
        link.classList.add('installation-files-link');
      }
      return;
    }

    // Two-cell rows: left = label/link, right = meta text or a download button.
    const left = cells[0];
    const right = cells[cells.length - 1];
    const rightLink = right.querySelector('a');

    if (rightLink) {
      // Featured download row: plain label on the left, green button on the right.
      row.className = 'installation-files-featured';
      left.className = 'installation-files-featured-label';
      right.className = 'installation-files-featured-cta';
      rightLink.classList.add('button', 'installation-files-download-btn');
      rightLink.classList.remove('secondary');
    } else {
      // Standard file row: a download link on the left, meta (pdf / ###) on the right.
      row.className = 'installation-files-file';
      left.className = 'installation-files-file-label';
      right.className = 'installation-files-file-meta';
      const leftLink = left.querySelector('a');
      if (leftLink) {
        leftLink.classList.remove('button', 'primary', 'secondary');
        leftLink.classList.add('installation-files-link');
      }
    }
  });
}
