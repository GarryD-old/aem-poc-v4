// eslint-disable-next-line import/no-unresolved
import { moveInstrumentation } from '../../scripts/scripts.js';

// keep track globally of the number of tab blocks on the page
let tabBlockCnt = 0;

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tablist-${tabBlockCnt += 1}`;

  // the first cell of each row is the title of the tab
  const tabHeadings = [...block.children]
    .filter((child) => child.firstElementChild && child.firstElementChild.children.length > 0)
    .map((child) => child.firstElementChild);

  tabHeadings.forEach((tab, i) => {
    const id = `tabpanel-${tabBlockCnt}-tab-${i + 1}`;

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-panel';
    tabpanel.id = id;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;

    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');

    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });

    // add the new tab list button, to the tablist
    tablist.append(button);

    // remove the tab heading from the dom, which also removes it from the UE tree
    tab.remove();

    // remove the instrumentation from the button's h1, h2 etc (this removes it from the tree)
    if (button.firstElementChild) {
      moveInstrumentation(button.firstElementChild, null);
    }
  });

  block.prepend(tablist);

  // Handle nested accordion blocks inside tabs panels (not decorated by block loader)
  block.querySelectorAll('.tabs-panel .faq-list').forEach((accordion) => {
    [...accordion.children].forEach((item) => {
      const heading = item.children[0];
      const body = item.children[1];
      if (!heading || !body) return;

      item.setAttribute('data-open', 'false');

      heading.style.cursor = 'pointer';
      heading.addEventListener('click', () => {
        const isOpen = item.getAttribute('data-open') === 'true';
        if (isOpen) {
          item.setAttribute('data-open', 'false');
        } else {
          item.setAttribute('data-open', 'true');
        }
      });
    });
  });

  // Fallback: handle flat <p> structure in richtext on author
  block.querySelectorAll('.tabs-panel div[data-aue-type="richtext"]').forEach((rt) => {
    const paragraphs = [...rt.querySelectorAll(':scope > p')];
    for (let i = 0; i < paragraphs.length; i += 2) {
      const question = paragraphs[i];
      const answer = paragraphs[i + 1];
      if (!answer) break;
      question.addEventListener('click', () => {
        const visible = answer.style.display === 'block';
        answer.style.display = visible ? 'none' : 'block';
        question.classList.toggle('faq-open', !visible);
      });
    }
  });
}
