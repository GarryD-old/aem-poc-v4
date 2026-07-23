export default function decorate(block) {
  const rows = [...block.children];

  // Classify each authored field row by content: link => cta, heading => title,
  // anything else => body text. The icon is drawn in CSS (no authored image).
  let titleRow = null;
  let ctaRow = null;
  const textRows = [];

  rows.forEach((row) => {
    const cell = row.firstElementChild || row;
    const cta = cell.querySelector('a');
    const heading = cell.querySelector('h1, h2, h3');
    if (cta) {
      ctaRow = row;
    } else if (heading && !titleRow) {
      titleRow = row;
    } else {
      textRows.push(row);
    }
  });

  // Heading: a CSS-drawn icon on the left + the title to its right.
  const heading = document.createElement('div');
  heading.className = 'promo-cta-heading';
  const icon = document.createElement('span');
  icon.className = 'promo-cta-icon';
  icon.setAttribute('aria-hidden', 'true');
  heading.append(icon);
  if (titleRow) {
    titleRow.className = 'promo-cta-title';
    heading.append(...titleRow.childNodes);
  }

  const body = document.createElement('div');
  body.className = 'promo-cta-body';
  textRows.forEach((row) => body.append(...row.childNodes));

  if (ctaRow) {
    const cta = ctaRow.querySelector('a');
    if (cta) {
      cta.classList.add('button', 'promo-cta-btn');
      cta.classList.remove('secondary');
    }
    ctaRow.className = 'promo-cta-cta';
  }

  block.textContent = '';
  block.append(heading);
  if (body.childNodes.length) block.append(body);
  if (ctaRow) block.append(ctaRow);
}
