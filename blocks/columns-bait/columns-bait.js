export default function decorate(block) {
  const columns = [...block.children];
  columns.forEach((row) => {
    [...row.children].forEach((col, index) => {
      if (index === 0) {
        col.className = 'columns-bait-image';
      } else {
        col.className = 'columns-bait-content';
        const allP = [...col.querySelectorAll(':scope > p')];
        const checkItems = [];
        allP.forEach((p) => {
          const img = p.querySelector('img');
          const strong = p.querySelector('strong');
          if (img && strong) {
            const item = document.createElement('div');
            item.className = 'columns-bait-check-item';
            const icon = document.createElement('picture');
            icon.append(img);
            item.append(icon);
            const text = document.createElement('p');
            text.append(strong);
            item.append(text);
            checkItems.push(item);
            p.remove();
          }
        });
        if (checkItems.length > 0) {
          const grid = document.createElement('div');
          grid.className = 'columns-bait-checklist';
          checkItems.forEach((item) => grid.append(item));
          col.append(grid);
        }
      }
    });
  });
}
