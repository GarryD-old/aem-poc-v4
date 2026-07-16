export default function decorate(block) {
  const rows = [...block.children];

  rows.forEach((row) => {
    const cells = [...row.children];
    const firstCell = cells[0];
    const lastCell = cells[cells.length - 1];

    const heading = firstCell?.querySelector('h2, h3, h4, h5, h6');
    const firstLink = firstCell?.querySelector('a');
    const lastLink = lastCell?.querySelector('a');
    const rightHasText = lastCell !== firstCell
      && (lastCell?.textContent || '').trim().length > 0;

    // 1. Section headline — a row whose (first) cell carries a heading element.
    if (heading && !firstLink) {
      row.className = 'installation-files-headline';
      return;
    }

    // 2. Featured download — a right-hand cell that contains a link (the button).
    if (cells.length > 1 && lastLink) {
      row.className = 'installation-files-featured';
      firstCell.className = 'installation-files-featured-label';
      lastCell.className = 'installation-files-featured-cta';
      lastLink.classList.add('button', 'installation-files-download-btn');
      lastLink.classList.remove('secondary');
      return;
    }

    // 3. File row — a link on the left, optional meta text on the right.
    if (firstLink) {
      row.className = 'installation-files-file';
      firstLink.classList.remove('button', 'primary', 'secondary');
      firstLink.classList.add('installation-files-link');
      if (cells.length > 1) {
        firstCell.className = 'installation-files-file-label';
        lastCell.className = 'installation-files-file-meta';
      }
      return;
    }

    // 4. Alert / note — a text-only row with no link and no heading.
    // (rightHasText guards against treating a stray empty second cell as content.)
    row.className = 'installation-files-alert';
    if (cells.length > 1 && !rightHasText) lastCell.remove();
  });
}
