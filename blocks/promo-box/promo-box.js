export default function decorate(block) {
  const rows = [...block.children];

  rows.forEach((row) => {
    const cell = row.firstElementChild || row;
    const hasImg = cell.querySelector('picture, img');
    const cta = cell.querySelector('a');

    if (hasImg && !cta) {
      row.className = 'promo-box-product';
      const pic = hasImg.closest('picture') || hasImg;
      pic.classList.add('promo-box-icon');
      cell.prepend(pic);
      const emptyP = cell.querySelector('p:empty');
      if (emptyP) emptyP.remove();
    } else if (cta) {
      row.className = 'promo-box-cta';
      cta.classList.add('button', 'promo-box-btn');
      cta.classList.remove('secondary');
    } else {
      row.className = 'promo-box-text';
    }
  });
}
