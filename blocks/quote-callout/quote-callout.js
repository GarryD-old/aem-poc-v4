export default function decorate(block) {
  // Flatten the authored wrapper rows into the block itself so the styled
  // left-bar callout wraps the text directly.
  const content = document.createElement('div');
  content.className = 'quote-callout-content';
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    while (cell.firstChild) content.append(cell.firstChild);
  });
  block.textContent = '';
  block.append(content);
}
