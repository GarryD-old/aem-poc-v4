import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const table = document.createElement('table');
  const rows = [...block.children];

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    const cells = [...row.children];

    // Detect a pricing/CTA footer row (contains a link/button)
    const isFooterRow = row.querySelector('a');
    if (isFooterRow) tr.classList.add('table-compare2-cta-row');

    cells.forEach((cell) => {
      const el = rowIndex === 0 ? document.createElement('th') : document.createElement('td');
      el.innerHTML = cell.innerHTML;
      const text = el.textContent.trim();
      if (rowIndex > 0 && text === '✓') {
        el.classList.add('has-tick');
        el.innerHTML = '';
      } else if (rowIndex > 0 && text === '✗') {
        el.classList.add('no-tick');
        el.innerHTML = '';
      }
      tr.append(el);
    });

    if (rowIndex === 0) {
      const thead = document.createElement('thead');
      thead.append(tr);
      table.append(thead);
    } else {
      let tbody = table.querySelector('tbody');
      if (!tbody) {
        tbody = document.createElement('tbody');
        table.append(tbody);
      }
      tbody.append(tr);
    }
  });

  block.textContent = '';
  block.append(table);
}
