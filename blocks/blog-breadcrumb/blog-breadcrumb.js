export default function decorate(block) {
  const rows = [...block.children];

  const nav = document.createElement('nav');
  nav.className = 'blog-breadcrumb-nav';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.className = 'blog-breadcrumb-list';

  rows.forEach((row, i) => {
    const cell = row.querySelector(':scope > div') || row;
    const link = cell.querySelector('a');
    const label = cell.textContent.trim();
    if (!label) return;

    const li = document.createElement('li');
    li.className = 'blog-breadcrumb-item';

    const isLast = i === rows.length - 1;
    if (link && !isLast) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.textContent = label;
      li.append(a);
    } else {
      const span = document.createElement('span');
      span.className = 'blog-breadcrumb-current';
      span.textContent = label;
      if (isLast) span.setAttribute('aria-current', 'page');
      li.append(span);
    }
    ol.append(li);
  });

  nav.append(ol);
  block.textContent = '';
  block.append(nav);
}
