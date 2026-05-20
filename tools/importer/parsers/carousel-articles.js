/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-articles variant.
 * Variant: carousel-articles
 * Base block: carousel
 * Project type: xwalk
 * Source URL: https://www.avg.com/en-eu/antitrack
 * DOM selector (from page-templates.json instances[]):
 *   - div#blogposts .carousel-slider
 * Generated: 2026-05-20
 *
 * Block library mapping (from blocks/carousel-articles/_carousel-articles.json):
 *   - This is an xwalk container block. Block name row = "Carousel (articles)".
 *   - Each child item (carousel-articles-item model) = 1 row with 2 cells:
 *       cell 1: thumbnail image          -> field: media_image
 *                                           (media_imageAlt is collapsed onto <img alt>)
 *       cell 2: title + perex + Read More -> field: content_text  (richtext)
 *
 * Source DOM shape (validated against migration-work/block-context/carousel-articles/source.html):
 *   <section class="carousel-slider blog-slider ...">
 *     <div class="container">
 *       <div class="tiny-slider">
 *         <div class="tns-outer" id="tns1-ow">
 *           <div id="tns1-mw" class="tns-ovh">
 *             <div class="tns-inner" id="tns1-iw">
 *               <div class="... tns-slider tns-carousel ..." id="tns1">
 *                 <a href="{article-href}" class="tns-item" id="tns1-itemN">
 *                   <img src="{thumbnail}">
 *                   <h4 class="blog-title">{title}</h4>
 *                   <p class="blog-perex">{perex}</p>
 *                   <span class="button secondary"><span>Read More</span></span>
 *                 </a>
 *                 ... 7 article slides total ...
 *
 * Each slide is wrapped in a single anchor whose `href` is the article URL.
 * The visual "Read More" CTA is rendered as a <span> inside the slide anchor;
 * for authoring, the article href is reused as the href of an explicit
 * <a>Read More</a> link inside the content_text richtext cell.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Collect every article slide. Validated selector: each slide is an
  // <a class="tns-item"> directly under the tiny-slider track. Fallbacks
  // broaden to any anchor containing the expected blog-title element so
  // the parser is resilient to tns-item class name drift.
  const slideAnchors = Array.from(
    element.querySelectorAll('a.tns-item, .tns-slider > a, .tiny-slider a[id*="item"]'),
  ).filter((a) => a.querySelector('.blog-title, h4'));

  slideAnchors.forEach((slide) => {
    // ---- Cell 1: thumbnail image (field: media_image) ----
    // media_imageAlt is collapsed onto the <img alt> attribute, so no separate
    // hint is emitted for it.
    const img = slide.querySelector('img');
    const imageFragment = document.createDocumentFragment();
    imageFragment.appendChild(document.createComment(' field:media_image '));
    if (img) imageFragment.appendChild(img);

    // ---- Cell 2: title + perex + Read More link (field: content_text) ----
    // Compose richtext with the original h4 title, the perex paragraph, and a
    // proper anchor wrapping "Read More" pointing at the article URL.
    const textFragment = document.createDocumentFragment();
    textFragment.appendChild(document.createComment(' field:content_text '));

    const title = slide.querySelector('h4.blog-title, h4, [class*="blog-title"]');
    if (title) textFragment.appendChild(title);

    const perex = slide.querySelector('p.blog-perex, p[class*="perex"], p');
    if (perex) textFragment.appendChild(perex);

    // Build a real anchor for Read More using the slide-level href.
    const articleHref = slide.getAttribute('href') || '#';
    const readMoreSpan = slide.querySelector('span.button, [class*="button"]');
    const readMoreLabel = readMoreSpan
      ? readMoreSpan.textContent.replace(/\s+/g, ' ').trim()
      : 'Read More';
    const readMoreP = document.createElement('p');
    const readMoreLink = document.createElement('a');
    readMoreLink.href = articleHref;
    readMoreLink.textContent = readMoreLabel || 'Read More';
    readMoreP.appendChild(readMoreLink);
    textFragment.appendChild(readMoreP);

    cells.push([imageFragment, textFragment]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'carousel-articles',
    cells,
  });

  element.replaceWith(block);
}
