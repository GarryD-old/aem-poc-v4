const MAX_SLIDES = 8;

function goTo(block, index) {
  const slides = [...block.querySelectorAll('.image-slider-slide')];
  if (!slides.length) return;
  let next = index;
  if (next < 0) next = slides.length - 1;
  if (next >= slides.length) next = 0;
  block.dataset.activeSlide = next;

  const track = block.querySelector('.image-slider-track');
  track.style.transform = `translateX(-${next * 100}%)`;

  slides.forEach((slide, i) => slide.setAttribute('aria-hidden', i !== next));
  block.querySelectorAll('.image-slider-bullet').forEach((bullet, i) => {
    bullet.classList.toggle('image-slider-bullet-active', i === next);
    bullet.setAttribute('aria-current', String(i === next));
  });
}

export default function decorate(block) {
  // Collect the authored images (each stacked image/row becomes a slide).
  const pictures = [...block.querySelectorAll('picture')].slice(0, MAX_SLIDES);

  // Clear the authored rows; we rebuild the DOM as a slider.
  block.textContent = '';

  const viewport = document.createElement('div');
  viewport.className = 'image-slider-viewport';

  const track = document.createElement('div');
  track.className = 'image-slider-track';

  pictures.forEach((pic, idx) => {
    const slide = document.createElement('div');
    slide.className = 'image-slider-slide';
    slide.setAttribute('aria-hidden', idx !== 0);
    slide.append(pic);
    track.append(slide);
  });

  viewport.append(track);
  block.append(viewport);

  const single = pictures.length < 2;
  block.dataset.activeSlide = 0;

  if (!single) {
    const controls = document.createElement('div');
    controls.className = 'image-slider-controls';
    controls.innerHTML = `
      <button type="button" class="image-slider-control-prev" aria-label="Previous"></button>
      <button type="button" class="image-slider-control-next" aria-label="Next"></button>`;
    block.append(controls);

    const pagination = document.createElement('div');
    pagination.className = 'image-slider-pagination';
    pagination.setAttribute('aria-label', 'Slide navigation');
    pagination.innerHTML = pictures.map((_, idx) => `
      <button type="button" class="image-slider-bullet${idx === 0 ? ' image-slider-bullet-active' : ''}" data-slide="${idx}" aria-current="${idx === 0}" aria-label="Slide ${idx + 1}"></button>`).join('');
    block.append(pagination);

    controls.querySelector('.image-slider-control-prev')
      .addEventListener('click', () => goTo(block, Number(block.dataset.activeSlide) - 1));
    controls.querySelector('.image-slider-control-next')
      .addEventListener('click', () => goTo(block, Number(block.dataset.activeSlide) + 1));
    pagination.querySelectorAll('.image-slider-bullet').forEach((bullet) => {
      bullet.addEventListener('click', () => goTo(block, Number(bullet.dataset.slide)));
    });
  }
}
