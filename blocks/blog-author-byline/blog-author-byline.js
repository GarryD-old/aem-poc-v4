function setMeta(name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.append(el);
  }
  el.setAttribute('content', content);
}

// "Updated May 28, 2026 • 9 min read" -> { label: 'Updated', iso: '2026-05-28...' }
function parseMetaLine(text) {
  const match = text.match(/(Published|Updated)\s+(.+?)(?:\s*[•·|]|$)/i);
  if (!match) return null;
  const label = match[1].toLowerCase();
  const date = new Date(match[2].trim());
  if (Number.isNaN(date.getTime())) return null;
  return { label, iso: date.toISOString() };
}

// Keep the SEO metadata (and any Article JSON-LD the blog-meta block created)
// in sync with what the byline shows: author + published/updated dates.
function syncSeo({ author, publishedIso, modifiedIso }) {
  if (author) setMeta('author', author);
  if (publishedIso) setMeta('published-time', publishedIso);
  if (modifiedIso) setMeta('modified-time', modifiedIso);

  // Block decorate order isn't guaranteed, so if blog-meta already emitted the
  // Article JSON-LD, patch it in place rather than relying on ordering.
  const ld = document.head.querySelector('script[data-blog-meta]');
  if (!ld) return;
  try {
    const data = JSON.parse(ld.textContent);
    if (author) data.author = { '@type': 'Person', name: author };
    if (publishedIso) data.datePublished = publishedIso;
    if (modifiedIso) data.dateModified = modifiedIso;
    ld.textContent = JSON.stringify(data);
  } catch (e) {
    // leave the existing JSON-LD untouched if it can't be parsed
  }
}

export default function decorate(block) {
  // Rows: 1) headshot  2) "Written by <a>..."  3) "Reviewed by <a>..."  4) meta line
  const rows = [...block.children].map((row) => row.querySelector(':scope > div') || row);
  const [imageCell, ...textCells] = rows;

  // Derive SEO signals from the authored text before the DOM is rebuilt.
  const writtenCell = textCells.find((c) => /written by/i.test(c?.textContent || ''));
  const author = writtenCell
    ? (writtenCell.querySelector('a')?.textContent
      || writtenCell.textContent.replace(/written by/i, '')).trim()
    : '';
  const metaCell = textCells.find((c) => /(published|updated)\s/i.test(c?.textContent || ''));
  const parsed = metaCell ? parseMetaLine(metaCell.textContent) : null;
  syncSeo({
    author,
    publishedIso: parsed?.label === 'published' ? parsed.iso : undefined,
    modifiedIso: parsed?.label === 'updated' ? parsed.iso : undefined,
  });

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
