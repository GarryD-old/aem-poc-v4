import { moveInstrumentation } from '../../scripts/scripts.js';

const FEATURE_ICONS = [
  '/icons/feature-click.png',
  '/icons/feature-fingerprint.png',
  '/icons/feature-money.png',
  '/icons/feature-handcuffs.png',
];

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-features-card-icon';
        const img = div.querySelector('img');
        if (img && FEATURE_ICONS[index]) {
          img.src = FEATURE_ICONS[index];
          img.alt = '';
        }
      } else {
        div.className = 'cards-features-card-body';
      }
    });
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
