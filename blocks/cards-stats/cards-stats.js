import { moveInstrumentation } from '../../scripts/scripts.js';

const STAT_ICONS = [
  '/icons/stat-target.png',
  '/icons/stat-telescope.png',
  '/icons/stat-globe.png',
  '/icons/stat-clipboard.png',
];

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-stats-card-icon';
        const img = div.querySelector('img');
        if (img && STAT_ICONS[index]) {
          img.src = STAT_ICONS[index];
          img.alt = '';
        }
      } else {
        div.className = 'cards-stats-card-body';
      }
    });
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
