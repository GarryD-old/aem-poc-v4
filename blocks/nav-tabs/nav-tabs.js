export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'nav-tabs-list';

  // Find all the links the author created in the Word doc
  const links = block.querySelectorAll('a');

  links.forEach((link) => {
    const li = document.createElement('li');
    li.className = 'nav-tab-item';

    // Strip EDS button decoration: a lone link in a cell gets turned into a
    // blue "button" pill (and wrapped in .button-container) before this block
    // runs, so remove those classes here.
    link.classList.remove('button', 'primary', 'secondary');

    // Author override: a tab bolded in the table (**BUSINESS**) is forced active.
    // Lets authors mark which tab this page represents even when the tab's href
    // points at a different page (e.g. the reusable installation-files template).
    const forcedActive = !!link.closest('strong') || !!link.querySelector('strong');
    if (forcedActive) {
      // Unwrap the <strong> so it doesn't affect tab typography.
      const strong = link.querySelector('strong');
      if (strong) strong.replaceWith(...strong.childNodes);
      const wrapStrong = link.closest('strong');
      if (wrapStrong) wrapStrong.replaceWith(link);
    }

    // Otherwise fall back to matching the tab href against the current page.
    let matchesPath = false;
    try {
      matchesPath = window.location.pathname === new URL(link.href).pathname;
    } catch (e) { /* relative or malformed href — ignore */ }

    if (forcedActive || matchesPath) {
      li.classList.add('active'); // Marks the current tab for the green underline
      link.classList.add('active');
    }

    // Move the link into our new list item
    li.append(link);
    ul.append(li);
  });

  // Clear the original Word doc bullet list and replace it with our structured list
  block.textContent = '';
  block.append(ul);
}
