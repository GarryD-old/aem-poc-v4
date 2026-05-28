import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const table = document.createElement('table');
  const rows = [...block.children];

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);
    const cells = [...row.children];
    cells.forEach((cell) => {
      const el = rowIndex === 0 ? document.createElement('th') : document.createElement('td');
      el.innerHTML = cell.innerHTML;
      if (rowIndex > 0 && el.textContent.trim() === '✓') {
        el.classList.add('has-tick');
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
