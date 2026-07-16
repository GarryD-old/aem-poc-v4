export default function decorate(block) {
  // Author supplies each element in its own row/cell. Any of them may be
  // removed in the authoring tool, so we classify by element type rather than
  // by fixed position — the layout adapts to whatever is present.
  const backLink = document.createElement('div');
  backLink.className = 'installation-hero-back';

  const heading = document.createElement('div');
  heading.className = 'installation-hero-heading';

  const body = document.createElement('div');
  body.className = 'installation-hero-body';

  const anchors = [...block.querySelectorAll('a')];
  const learnMore = anchors.find((a) => /learn more/i.test(a.textContent));
  const back = anchors.find((a) => a !== learnMore
    && (/back/i.test(a.textContent) || a.closest('div')?.previousElementSibling === null));

  // Icon: an image that is not inside a link.
  const icon = [...block.querySelectorAll('picture, img')]
    .map((el) => el.closest('picture') || el)
    .find((el) => !el.closest('a'));

  const title = block.querySelector('h1, h2');

  // Subheading: paragraphs that are not the back/learn-more link wrappers.
  const paragraphs = [...block.querySelectorAll('p')].filter((p) => {
    const a = p.querySelector('a');
    return !a || (a !== back && a !== learnMore);
  });

  if (back) {
    back.classList.remove('button', 'primary', 'secondary');
    backLink.append(back);
  }

  if (icon) {
    icon.classList.add('installation-hero-icon');
    heading.append(icon);
  }
  if (title) heading.append(title);

  paragraphs.forEach((p) => body.append(p));
  if (learnMore) {
    learnMore.classList.remove('button', 'primary', 'secondary');
    learnMore.classList.add('installation-hero-learn-more');
    const wrap = document.createElement('div');
    wrap.className = 'installation-hero-learn-more-wrap';
    wrap.append(learnMore);
    body.append(wrap);
  }

  block.textContent = '';
  if (back) block.append(backLink);
  if (heading.childNodes.length) block.append(heading);
  if (body.childNodes.length) block.append(body);
}
