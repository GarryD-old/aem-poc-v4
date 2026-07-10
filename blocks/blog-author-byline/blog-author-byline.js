export default function decorate(block) {
  // Rows: 1) headshot  2) "Written by <a>..."  3) "Reviewed by <a>..."  4) meta line
  const rows = [...block.children].map((row) => row.querySelector(':scope > div') || row);
  const [imageCell, ...textCells] = rows;

  block.textContent = '';

  const media = document.createElement('div');
  media.className = 'blog-author-byline-media';
  const pic = imageCell?.querySelector('picture, img');
  if (pic) media.append(pic.closest('picture') || pic);

  const details = document.createElement('div');
  details.className = 'blog-author-byline-details';
  textCells.forEach((cell) => {
    if (!cell || !cell.textContent.trim()) return;
    const line = document.createElement('div');
    line.className = 'blog-author-byline-line';
    line.append(...cell.childNodes);
    details.append(line);
  });

  block.append(media, details);
}
