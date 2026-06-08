import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Remove button decoration from footer links
  footer.querySelectorAll('a.button').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary');
    const wrapper = a.closest('.button-container');
    if (wrapper) {
      wrapper.classList.remove('button-container');
    }
  });

  // Add logo to first section
  const firstSection = footer.querySelector(':scope > div:first-child');
  if (firstSection) {
    const logo = document.createElement('div');
    logo.className = 'footer-logo';
    firstSection.prepend(logo);
  }

  block.append(footer);
}
