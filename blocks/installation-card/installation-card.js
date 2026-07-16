export default function decorate(block) {
  // Simple block: model fields arrive as one row each — icon / info / ctas.
  const rows = [...block.children];
  const iconRow = rows[0];
  const infoRow = rows[1];
  const ctasRow = rows[2];

  const info = infoRow?.firstElementChild || infoRow;
  const ctas = ctasRow?.firstElementChild || ctasRow;

  if (info) {
    info.className = 'installation-card-info';

    // Move the icon (from its own row) into the info cell so it renders beside the text.
    if (iconRow) {
      const iconEl = iconRow.querySelector('picture, img');
      if (iconEl) {
        const pic = iconEl.closest('picture') || iconEl;
        pic.classList.add('installation-card-icon');
        info.prepend(pic);
      }
      iconRow.remove();
    }

    // A leading "Label" pill: a paragraph whose text is wrapped in <em>.
    const labelP = info.querySelector('p em');
    if (labelP) {
      const p = labelP.closest('p');
      p.classList.add('installation-card-label');
      p.textContent = labelP.textContent;
    }

    // Learn more link — strip EDS button styling.
    const learnMore = [...info.querySelectorAll('a')]
      .find((a) => /learn more/i.test(a.textContent));
    if (learnMore) {
      learnMore.classList.remove('button', 'primary', 'secondary');
      learnMore.classList.add('installation-card-learn-more');
      const wrap = learnMore.closest('p') || learnMore.parentElement;
      if (wrap) wrap.classList.add('installation-card-learn-more-wrap');
    }
  }

  if (ctas) {
    ctas.className = 'installation-card-ctas';
    const links = [...ctas.querySelectorAll('a')];
    links.forEach((a) => {
      const isMore = /more option/i.test(a.textContent);
      const isTrial = /trial/i.test(a.textContent);
      if (isMore) {
        a.classList.remove('button', 'primary', 'secondary');
        a.classList.add('installation-card-more');
        const wrap = a.closest('p') || a.parentElement;
        if (wrap) wrap.classList.add('installation-card-more-wrap');
      } else {
        a.classList.add('button', 'installation-card-btn');
        if (isTrial) a.classList.add('installation-card-btn-trial');
        else a.classList.add('installation-card-btn-primary');
      }
    });
  }

  // Re-wrap the surviving info/ctas cells into a single flex row for layout.
  const wrapper = document.createElement('div');
  wrapper.className = 'installation-card-row';
  if (info) wrapper.append(info);
  if (ctas) wrapper.append(ctas);
  block.textContent = '';
  block.append(wrapper);
}
