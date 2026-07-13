function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function decorate(block) {
  const main = document.querySelector('main');

  // Build the nav from the page's H2s (each legal product/section is an H2),
  // excluding the block's own content.
  const headings = [...main.querySelectorAll('h2')]
    .filter((h) => !block.contains(h) && h.textContent.trim());

  const titleOverride = block.textContent.trim();
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.className = 'legal-sidenav-nav';
  nav.setAttribute('aria-label', titleOverride || 'On this page');

  const list = document.createElement('ul');
  list.className = 'legal-sidenav-list';

  const links = [];
  headings.forEach((h) => {
    if (!h.id) h.id = slugify(h.textContent);
    const li = document.createElement('li');
    li.className = 'legal-sidenav-item';
    const a = document.createElement('a');
    a.className = 'legal-sidenav-link';
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

  nav.append(list);
  block.append(nav);

  // Scroll-spy: highlight the entry for the section currently in view.
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
