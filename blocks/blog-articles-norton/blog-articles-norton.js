const MAX_CARDS = 6;

function buildCard(row) {
  // Cells in order: image, tag (link), title (link), meta.
  const cells = [...row.children];
  const [imageCell, tagCell, titleCell, metaCell] = cells;

  const card = document.createElement('div');
  card.className = 'blog-articles-norton-card';

  const media = document.createElement('div');
  media.className = 'blog-articles-norton-media';
  const pic = imageCell?.querySelector('picture, img');
  const titleLink = titleCell?.querySelector('a');
  const href = titleLink?.getAttribute('href');
  if (pic) {
    const node = pic.closest('picture') || pic;
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.append(node);
      media.append(a);
    } else {
      media.append(node);
    }
  }

  const body = document.createElement('div');
  body.className = 'blog-articles-norton-body';

  const tag = document.createElement('div');
  tag.className = 'blog-articles-norton-tag';
  if (tagCell) tag.append(...tagCell.childNodes);

  const title = document.createElement('div');
  title.className = 'blog-articles-norton-title';
  if (titleCell) title.append(...titleCell.childNodes);

  const meta = document.createElement('div');
  meta.className = 'blog-articles-norton-meta';
  if (metaCell) meta.append(...metaCell.childNodes);

  body.append(tag, title, meta);
  card.append(media, body);
  return card;
}

export default function decorate(block) {
  const rows = [...block.children];

  // First row without an image is the heading label.
  let headingText = 'Related articles';
  const firstRow = rows[0];
  if (firstRow && !firstRow.querySelector('picture, img')) {
    headingText = firstRow.textContent.trim() || headingText;
    firstRow.remove();
  }

  const cardRows = [...block.children]
    .filter((r) => r.querySelector('picture, img'))
    .slice(0, MAX_CARDS);
  const cards = cardRows.map(buildCard);

  block.textContent = '';

  const header = document.createElement('div');
  header.className = 'blog-articles-norton-header';
  const heading = document.createElement('h2');
  heading.className = 'blog-articles-norton-heading';
  heading.textContent = headingText;
  const controls = document.createElement('div');
  controls.className = 'blog-articles-norton-controls';
  controls.innerHTML = `
    <button type="button" class="blog-articles-norton-prev" aria-label="Page back"></button>
    <button type="button" class="blog-articles-norton-next" aria-label="Page forward"></button>`;
  header.append(heading, controls);

  const viewport = document.createElement('div');
  viewport.className = 'blog-articles-norton-viewport';
  const track = document.createElement('div');
  track.className = 'blog-articles-norton-track';
  cards.forEach((c) => track.append(c));
  viewport.append(track);

  block.append(header, viewport);

  const prev = controls.querySelector('.blog-articles-norton-prev');
  const next = controls.querySelector('.blog-articles-norton-next');

  const step = () => {
    const card = track.querySelector('.blog-articles-norton-card');
    if (!card) return viewport.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const updateControls = () => {
    const maxScroll = track.scrollWidth - viewport.clientWidth;
    prev.disabled = viewport.scrollLeft <= 1;
    next.disabled = viewport.scrollLeft >= maxScroll - 1;
  };

  prev.addEventListener('click', () => viewport.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => viewport.scrollBy({ left: step(), behavior: 'smooth' }));
  viewport.addEventListener('scroll', updateControls);
  window.addEventListener('resize', updateControls);
  updateControls();
}
