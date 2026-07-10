function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function decorate(block) {
  const main = document.querySelector('main');
  // Collect the page headings we want to index. Skip any heading inside this
  // block and anything inside the site header/footer.
  const headings = [...main.querySelectorAll('h1, h2')]
    .filter((h) => !block.contains(h) && h.textContent.trim());

  // Optional author-provided title override (first cell of the block).
  const titleOverride = block.textContent.trim();
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'blog-toc-wrapper';

  const header = document.createElement('div');
  header.className = 'blog-toc-header';
  const heading = document.createElement('h2');
  heading.className = 'blog-toc-title';
  heading.textContent = titleOverride || 'Contents';
  const toggle = document.createElement('button');
  toggle.className = 'blog-toc-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'Toggle contents');
  header.append(heading, toggle);

  const list = document.createElement('ul');
  list.className = 'blog-toc-list';

  const links = [];
  headings.forEach((h) => {
    if (!h.id) h.id = slugify(h.textContent);
    const li = document.createElement('li');
    li.className = `blog-toc-item blog-toc-level-${h.tagName.toLowerCase()}`;
    const a = document.createElement('a');
    a.href = `#${h.id}`;
    a.textContent = h.textContent.trim();
    a.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${h.id}`);
    });
    li.append(a);
    list.append(li);
    links.push({ heading: h, link: a });
  });

  wrapper.append(header, list);
  block.append(wrapper);

  // Collapse / expand
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    block.classList.toggle('blog-toc-collapsed', expanded);
  });

  // Scroll-spy: highlight the entry for the heading currently in view.
  const setActive = (activeLink) => {
    links.forEach(({ link }) => link.classList.toggle('active', link === activeLink));
  };

  if ('IntersectionObserver' in window && links.length) {
    const visible = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      // Pick the topmost currently-visible heading; else the last one above the fold.
      let current = links.find(({ heading: h }) => visible.has(h));
      if (!current) {
        const scrolled = window.scrollY + 120;
        current = [...links].reverse().find(({ heading: h }) => h.offsetTop <= scrolled)
          || links[0];
      }
      if (current) setActive(current.link);
    }, { rootMargin: '-100px 0px -66% 0px', threshold: 0 });
    links.forEach(({ heading: h }) => observer.observe(h));
    setActive(links[0].link);
  }
}
