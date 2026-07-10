const MAX_VISIBLE = 6;

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function arrowButton(direction) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `blog-toc-arrow blog-toc-arrow-${direction}`;
  btn.setAttribute('aria-label', direction === 'up' ? 'Scroll up' : 'Scroll down');
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 24L0 12l2.22-2.22 9.78 9.9 9.74-9.86L24 12z" fill="currentColor"/></svg>';
  return btn;
}

export default function decorate(block) {
  const main = document.querySelector('main');
  const headings = [...main.querySelectorAll('h1, h2')]
    .filter((h) => !block.contains(h) && h.textContent.trim());

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

  // Body holds the (optional) arrows and the scroll container so the
  // collapse toggle can hide them all together.
  const body = document.createElement('div');
  body.className = 'blog-toc-body';

  const arrowUp = arrowButton('up');
  const scroll = document.createElement('div');
  scroll.className = 'blog-toc-scroll';
  const list = document.createElement('ul');
  list.className = 'blog-toc-list';
  const arrowDown = arrowButton('down');

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

  scroll.append(list);
  body.append(arrowUp, scroll, arrowDown);
  wrapper.append(header, body);
  block.append(wrapper);

  // Collapse / expand
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    block.classList.toggle('blog-toc-collapsed', expanded);
  });

  // Limit to MAX_VISIBLE items; enable arrow scrolling only when needed.
  const updateArrows = () => {
    const atTop = scroll.scrollTop <= 1;
    const atBottom = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 1;
    arrowUp.disabled = atTop;
    arrowDown.disabled = atBottom;
  };

  const measureAndCap = () => {
    const items = [...list.children];
    if (items.length <= MAX_VISIBLE) return true;
    // Use bounding rects (robust vs offsetTop, which can be 0 before layout).
    const listTop = list.getBoundingClientRect().top;
    const cutTop = items[MAX_VISIBLE].getBoundingClientRect().top;
    const maxH = Math.round(cutTop - listTop);
    if (maxH <= 0) return false; // layout not ready yet
    scroll.style.maxHeight = `${maxH}px`;
    updateArrows();
    return true;
  };

  const setupScroll = () => {
    if (links.length <= MAX_VISIBLE) {
      block.classList.remove('blog-toc-scrollable');
      return;
    }
    block.classList.add('blog-toc-scrollable');

    const step = () => Math.max(scroll.clientHeight * 0.8, 80);
    arrowUp.addEventListener('click', () => scroll.scrollBy({ top: -step(), behavior: 'smooth' }));
    arrowDown.addEventListener('click', () => scroll.scrollBy({ top: step(), behavior: 'smooth' }));
    scroll.addEventListener('scroll', updateArrows);

    // Retry measurement across frames until layout yields a real height.
    let attempts = 0;
    const tryMeasure = () => {
      if (measureAndCap() || attempts >= 20) return;
      attempts += 1;
      requestAnimationFrame(tryMeasure);
    };
    tryMeasure();

    // Re-cap on resize (item wrapping can change heights).
    window.addEventListener('resize', measureAndCap);
  };

  // Scroll-spy: highlight the entry for the heading currently in view.
  const setActive = (activeLink) => {
    links.forEach(({ link }) => link.classList.toggle('active', link === activeLink));
    // Keep the active entry visible within the scroll container.
    if (block.classList.contains('blog-toc-scrollable') && activeLink) {
      activeLink.scrollIntoView({ block: 'nearest' });
    }
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

  setupScroll();
}
