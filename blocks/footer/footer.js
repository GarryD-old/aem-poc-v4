import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';

  const sections = [...fragment.querySelectorAll(':scope .section')];

  // Build footer structure: top row (columns) + bottom row
  const topRow = document.createElement('div');
  topRow.className = 'footer-top';

  const bottomRow = document.createElement('div');
  bottomRow.className = 'footer-bottom';

  // First section = brand (logo + country + login)
  // Sections 2-5 = columns (About, Home products, Customer area, Partners)
  // Last section = bottom (copyright)
  sections.forEach((section, i) => {
    section.querySelectorAll('a.button').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      const wrapper = a.closest('.button-container');
      if (wrapper) wrapper.classList.remove('button-container');
    });

    if (i < sections.length - 1) {
      topRow.append(section);
    } else {
      bottomRow.append(section);
    }
  });

  // Add logo to brand section
  const brandSection = topRow.querySelector(':scope > div:first-child');
  if (brandSection) {
    const logo = document.createElement('div');
    logo.className = 'footer-logo';
    brandSection.prepend(logo);
  }

  block.append(topRow);
  block.append(bottomRow);

  // Country selector: trigger same modal as header nav
  const regionLink = block.querySelector('a[href*="region"]');
  if (regionLink) {
    regionLink.addEventListener('click', (e) => {
      e.preventDefault();
      const headerRegion = document.querySelector('header .nav-tools a[href*="region"]');
      if (headerRegion) {
        headerRegion.click();
      }
    });
  }
}
