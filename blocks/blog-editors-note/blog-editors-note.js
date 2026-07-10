export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'blog-editors-note-content';
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    while (cell.firstChild) content.append(cell.firstChild);
  });
  block.textContent = '';
  block.append(content);
}
