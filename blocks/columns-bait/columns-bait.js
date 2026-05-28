export default function decorate(block) {
  const columns = [...block.children];
  columns.forEach((row) => {
    [...row.children].forEach((col, index) => {
      if (index === 0) {
        col.className = 'columns-bait-image';
        const img = col.querySelector('img');
        if (img) {
          img.src = '/content/antitrack/media/fingerprint-illustration.png';
          img.alt = 'Digital fingerprint illustration';
        }
      } else {
        col.className = 'columns-bait-content';
      }
    });
  });
}
