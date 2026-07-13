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

    // Check if the link matches the page we are currently on
    if (window.location.pathname === new URL(link.href).pathname) {
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
