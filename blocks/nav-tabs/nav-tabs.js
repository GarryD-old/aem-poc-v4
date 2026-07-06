export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'nav-tabs-list';
  
  // Find all the links the author created in the Word doc
  const links = block.querySelectorAll('a');
  
  links.forEach((link) => {
    const li = document.createElement('li');
    li.className = 'nav-tab-item';
    
    // Check if the link matches the page we are currently on
    if (window.location.pathname === new URL(link.href).pathname) {
      link.classList.add('active'); // Add the active class for the green underline
    }
    
    // Move the link into our new list item
    li.append(link);
    ul.append(li);
  });
  
  // Clear the original Word doc bullet list and replace it with our structured list
  block.textContent = '';
  block.append(ul);
}
