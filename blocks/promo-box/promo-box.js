export default function decorate(block) {
  const rows = [...block.children];

  // Classify each field row by content: image => icon, link => cta, else text.
  let iconRow = null;
  let nameRow = null;
  const textRows = [];
  let ctaRow = null;

  rows.forEach((row) => {
    const cell = row.firstElementChild || row;
    const img = cell.querySelector('picture, img');
    const cta = cell.querySelector('a');
    if (img && !cta) {
      iconRow = row;
    } else if (cta) {
      ctaRow = row;
    } else if (!nameRow) {
      nameRow = row;
    } else {
      textRows.push(row);
    }
  });

  // Product row: icon + name on one line.
  if (nameRow || iconRow) {
    const product = nameRow || iconRow;
    product.className = 'promo-box-product';
    if (iconRow && iconRow !== product) {
      const img = iconRow.querySelector('picture, img');
      const pic = img ? (img.closest('picture') || img) : null;
      if (pic) {
        pic.classList.add('promo-box-icon');
        product.prepend(pic);
      }
      iconRow.remove();
    } else if (iconRow === product) {
      const img = iconRow.querySelector('picture, img');
      const pic = img ? (img.closest('picture') || img) : null;
      if (pic) pic.classList.add('promo-box-icon');
    }
  }

  textRows.forEach((row) => { row.className = 'promo-box-text'; });

  if (ctaRow) {
    ctaRow.className = 'promo-box-cta';
    const cta = ctaRow.querySelector('a');
    if (cta) {
      cta.classList.add('button', 'promo-box-btn');
      cta.classList.remove('secondary');
    }
  }
}
