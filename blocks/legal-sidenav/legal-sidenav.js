function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const chevron = () => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 16 16');
  s.setAttribute('class', 'legal-sidenav-chevron');
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
  return s;
};

export default function decorate(block) {
  const main = document.querySelector('main');

  // Collect the page's H2/H3/H4 in document order to build a nested tree.
  // H2 = product (top level), H3 = sub-product/subsection, H4 = leaf subsection.
  const headings = [...main.querySelectorAll('h2, h3, h4')]
    .filter((h) => !block.contains(h) && h.textContent.trim());

  const titleOverride = block.textContent.trim();
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.className = 'legal-sidenav-nav';
  nav.setAttribute('aria-label', titleOverride || 'On this page');

  const rootList = document.createElement('ul');
  rootList.className = 'legal-sidenav-list';
  nav.append(rootList);

  const level = (h) => Number(h.tagName[1]); // 2, 3 or 4
  const links = [];
  // stack holds { level, listEl } for the currently open ancestor lists.
  const stack = [{ level: 1, listEl: rootList }];

  headings.forEach((h) => {
    if (!h.id) h.id = slugify(h.textContent);
    const lvl = level(h);

    // Pop to the parent whose level is just above this heading's.
    while (stack.length > 1 && stack[stack.length - 1].level >= lvl) stack.pop();
    const parentList = stack[stack.length - 1].listEl;

    const li = document.createElement('li');
    li.className = `legal-sidenav-item legal-sidenav-level-${lvl}`;

    const rowLink = document.createElement('a');
    rowLink.className = 'legal-sidenav-link';
    rowLink.href = `#${h.id}`;
    rowLink.textContent = h.textContent.trim();
    rowLink.addEventListener('click', (e) => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${h.id}`);
    });
    li.append(rowLink);
    parentList.append(li);
    links.push({ heading: h, link: rowLink });

    // Each item gets a child list it MAY fill; expand/collapse via a toggle
    // that we only reveal (in CSS) once the list has children.
    const childList = document.createElement('ul');
    childList.className = 'legal-sidenav-sublist';
    li.append(childList);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'legal-sidenav-toggle';
    toggle.setAttribute('aria-label', 'Toggle section');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.append(chevron());
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      li.classList.toggle('legal-sidenav-collapsed', open);
    });
    // Insert the toggle before the child list, after the link.
    li.insertBefore(toggle, childList);

    stack.push({ level: lvl, listEl: childList });
  });

  // After the whole tree is built: mark childless items as leaves (no chevron),
  // and collapse every parent by default so each product reads as a dropdown
  // (matching the live site — expand one at a time).
  nav.querySelectorAll('.legal-sidenav-item').forEach((li) => {
    const sub = li.querySelector(':scope > .legal-sidenav-sublist');
    if (!sub || !sub.children.length) {
      li.classList.add('legal-sidenav-leaf');
    } else {
      li.classList.add('legal-sidenav-collapsed');
      const toggle = li.querySelector(':scope > .legal-sidenav-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  block.append(nav);

  // Scroll-spy: highlight (green) the entry for the section currently in view
  // and expand its ancestor dropdowns so the active row is visible.
  const expandAncestors = (link) => {
    let li = link.closest('.legal-sidenav-item')?.parentElement?.closest('.legal-sidenav-item');
    while (li) {
      if (li.classList.contains('legal-sidenav-collapsed')) {
        li.classList.remove('legal-sidenav-collapsed');
        const t = li.querySelector(':scope > .legal-sidenav-toggle');
        if (t) t.setAttribute('aria-expanded', 'true');
      }
      li = li.parentElement?.closest('.legal-sidenav-item');
    }
  };

  const setActive = (activeLink) => {
    links.forEach(({ link }) => link.classList.toggle('active', link === activeLink));
    if (activeLink) expandAncestors(activeLink);
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
