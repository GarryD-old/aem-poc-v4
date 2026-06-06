export default function decorate(block) {
  const columns = [...block.children];
  columns.forEach((row) => {
    [...row.children].forEach((col, index) => {
      if (index === 0) {
        col.className = 'columns-bait-image';
        const img = col.querySelector('img');
        if (img) {
          img.style.width = '368px';
          img.style.height = '523px';
          img.style.maxWidth = '100%';
        }
      } else {
        col.className = 'columns-bait-content';
        const allP = [...col.querySelectorAll(':scope > p')];
        const checkItems = [];
        let i = 0;
        while (i < allP.length) {
          const p = allP[i];
          const pic = p.querySelector('picture');
          let handled = false;
          if (pic && p.children.length === 1 && p.textContent.trim() === '') {
            const nextP = allP[i + 1];
            if (nextP && nextP.querySelector('strong')) {
              const item = document.createElement('div');
              item.className = 'columns-bait-check-item';
              item.append(pic);
              item.append(nextP);
              checkItems.push(item);
              p.remove();
              i += 2;
              handled = true;
            }
          }
          if (!handled) i += 1;
        }
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
