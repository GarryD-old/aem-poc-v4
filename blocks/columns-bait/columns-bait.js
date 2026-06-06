export default function decorate(block) {
  const columns = [...block.children];
  columns.forEach((row) => {
    [...row.children].forEach((col, index) => {
      if (index === 0) {
        col.className = 'columns-bait-image';
        const img = col.querySelector('img');
        if (img) {
          img.src = '/content/dam/avg-eds-garry/avg/hero/fingerprint.png';
          img.alt = 'Digital fingerprint illustration';
          img.style.width = '368px';
          img.style.height = '523px';
        }
      } else {
        col.className = 'columns-bait-content';
        col.querySelectorAll('p').forEach((p) => {
          const text = p.textContent.trim();
          if (text && !p.querySelector('a') && !p.querySelector('strong') && !p.querySelector('h2') && p.closest('.columns-bait-content') && !text.includes('.') && text.length < 40) {
            const icon = document.createElement('img');
            icon.src = '/content/dam/avg-eds-garry/avg/icons/Check-Oval.png';
            icon.alt = '';
            icon.width = 24;
            icon.height = 24;
            icon.style.verticalAlign = 'middle';
            icon.style.marginRight = '8px';
            p.prepend(icon);
          }
        });
      }
    });
  });
}
