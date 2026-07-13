export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const table = document.createElement('table');
  table.className = 'legal-table-table';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    const cells = [...row.children];
    cells.forEach((cell) => {
      const isHeader = rowIndex === 0;
      const el = document.createElement(isHeader ? 'th' : 'td');
      if (isHeader) el.setAttribute('scope', 'col');
      while (cell.firstChild) el.append(cell.firstChild);
      tr.append(el);
    });
    (rowIndex === 0 ? thead : tbody).append(tr);
  });

  table.append(thead, tbody);
  block.textContent = '';
  block.append(table);
}
