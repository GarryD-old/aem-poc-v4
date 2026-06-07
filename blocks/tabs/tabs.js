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

  // Build FAQ accordion from flat <p> pairs in the first tab panel
  const faqPanel = block.querySelector('.tabs-panel');
  if (faqPanel) {
    const contentDiv = faqPanel.querySelector(':scope > div > div') || faqPanel.querySelector(':scope > div');
    if (contentDiv) {
      const paragraphs = [...contentDiv.querySelectorAll(':scope > p')];
      if (paragraphs.length >= 2) {
        const faqList = document.createElement('div');
        faqList.className = 'faq-list';
        for (let i = 0; i < paragraphs.length; i += 2) {
          const q = paragraphs[i];
          const a = paragraphs[i + 1];
          if (!a) break;
          const item = document.createElement('div');
          item.setAttribute('data-open', 'false');
          const heading = document.createElement('div');
          heading.append(q);
          heading.style.cursor = 'pointer';
          const body = document.createElement('div');
          body.append(a);
          item.append(heading);
          item.append(body);
          heading.addEventListener('click', () => {
            const isOpen = item.getAttribute('data-open') === 'true';
            item.setAttribute('data-open', isOpen ? 'false' : 'true');
          });
          faqList.append(item);
        }
        contentDiv.append(faqList);
      }
    }
  }
}
