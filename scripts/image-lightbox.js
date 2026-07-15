/**
 * Image lightbox: makes in-article images clickable to open an enlarged modal
 * with the image and its alt text as a caption. Kept dependency-free and only
 * applied to blog article-body images.
 */

let overlay;

function closeLightbox() {
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  // Return focus to the trigger for accessibility.
  overlay.trigger?.focus();
}

function ensureOverlay() {
  if (overlay) return overlay;
  overlay = document.createElement('div');
  overlay.className = 'image-lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <button type="button" class="image-lightbox-close" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M34.31 29 56.9 6.42a3.12 3.12 0 0 0-4.41-4.42L29 23.69 6.42 1.1a3.12 3.12 0 0 0-4.42 4.42L23.69 29 1.1 51.59a3.12 3.12 0 0 0 4.42 4.41L29 34.31 51.59 56.9a3.12 3.12 0 0 0 4.41 0 3.12 3.12 0 0 0 0-4.41L34.31 29Z" fill="currentColor"/></svg>
    </button>
    <figure class="image-lightbox-dialog">
      <img class="image-lightbox-img" alt="">
      <figcaption class="image-lightbox-caption"></figcaption>
    </figure>`;
  document.body.append(overlay);

  const close = () => closeLightbox();
  overlay.querySelector('.image-lightbox-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    // Close on backdrop click (anywhere outside the figure).
    if (!e.target.closest('.image-lightbox-dialog')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
  return overlay;
}

function openLightbox(img, trigger) {
  const ov = ensureOverlay();
  const modalImg = ov.querySelector('.image-lightbox-img');
  const caption = ov.querySelector('.image-lightbox-caption');
  modalImg.src = img.currentSrc || img.src;
  modalImg.alt = img.alt || '';
  caption.textContent = img.alt || '';
  caption.style.display = img.alt ? '' : 'none';
  ov.trigger = trigger;
  ov.classList.add('open');
  document.body.style.overflow = 'hidden';
}

/**
 * Enhance article-body images within the given root so they open in a lightbox.
 * @param {Element} root container to search within
 */
export default function decorateImageLightbox(root) {
  const scope = root.querySelector('.blog-table-of-contents-container')
    || root.querySelector('main')
    || root;

  const pictures = scope.querySelectorAll('.default-content-wrapper picture');
  pictures.forEach((picture) => {
    const img = picture.querySelector('img');
    if (!img || picture.dataset.lightbox === 'true') return;
    picture.dataset.lightbox = 'true';
    picture.classList.add('image-lightbox-trigger');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'image-lightbox-button';
    trigger.setAttribute('aria-label', img.alt ? `Enlarge image: ${img.alt}` : 'Enlarge image');
    picture.parentNode.insertBefore(trigger, picture);
    trigger.append(picture);
    trigger.addEventListener('click', () => openLightbox(img, trigger));
  });
}
