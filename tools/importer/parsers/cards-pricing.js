/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-pricing variant (retry to re-trigger validation).
 * Variant: cards-pricing
 * Base block: cards
 * Project type: xwalk
 * Source URL: https://www.avg.com/en-eu/antitrack
 * DOM selectors (from page-templates.json instances[]):
 *   - section#top .actionbox.actionbox-facelift
 *   - section#buy .actionbox.actionbox-facelift
 * Generated: 2026-05-20
 *
 * Block library mapping:
 *   - This is an xwalk container block. Block name row = "Cards (pricing)".
 *   - Each child item (card-pricing model) = 1 row with 2 cells:
 *       cell 1: platform icon image(s)   -> field: image  (imageAlt is collapsed onto <img alt>)
 *       cell 2: card body                -> field: text   (richtext: plan name, price,
 *                                                          monthly equivalent, Buy CTA)
 *
 * Source DOM shape (validated against migration-work/block-context/cards-pricing/source.html):
 *   <div class="row actionbox actionbox-facelift">
 *     <div class="center col-xs-12 col-lg-5">           <- one card per .center column
 *       <div class="js-vue-action-box vue-action-box">
 *         <div class="actionbox-container ...">
 *           <div class="toggler">                       <- contains <select>/<option> or
 *                                                          <div class="toggler-option ..."> with plan name
 *           <div class="row actionbox-buy">
 *             <div class="box ...">
 *               <div class="header-footer-wrap">
 *                 <div class="header-wrap">
 *                   <div class="platforms"><img ...>(<img ...>)</div>   <- 1 or 2 platform icons
 *                 <div class="footer-wrap row-year">
 *                   <div class="actionbox-price-main">
 *                     ... composed price (integer, decimal, currency, period) ...
 *                   <div class="month-price">It works out as <span ...>4,58 €</span>/month.</div>
 *                 <a class="actionbox-button bi-cart-link" href="..."><span>Buy now</span></a>
 */
export default function parse(element, { document }) {
  const cells = [];

  // Collect each card column (one .center per pricing card).
  const cards = Array.from(element.querySelectorAll(':scope > .center, :scope .center.col-xs-12'));

  cards.forEach((card) => {
    // ---- Cell 1: platform icon image(s) (field: image) ----
    // The card-pricing model has a single image field, but some cards in source have
    // multiple platform icons; preserve all <img> elements found inside .platforms.
    const platforms = card.querySelector('.platforms');
    const imageFragment = document.createDocumentFragment();
    imageFragment.appendChild(document.createComment(' field:image '));
    if (platforms) {
      const icons = Array.from(platforms.querySelectorAll('img'));
      icons.forEach((img) => imageFragment.appendChild(img));
    }

    // ---- Cell 2: card body (field: text) ----
    // Compose richtext: plan name (<h3>), price (<p>), monthly equivalent (<p>), CTA (<a>).
    const bodyFragment = document.createDocumentFragment();
    bodyFragment.appendChild(document.createComment(' field:text '));

    // Plan name: read from active <select> option, otherwise from .toggler-option.
    let planName = '';
    const activeOption = card.querySelector('select.actionbox-buy-filter option.active');
    if (activeOption) {
      planName = activeOption.textContent.trim();
    } else {
      const togglerOption = card.querySelector('.toggler-option, .js-toggler');
      if (togglerOption) planName = togglerOption.textContent.trim();
    }
    if (planName) {
      const planHeading = document.createElement('h3');
      planHeading.textContent = planName;
      bodyFragment.appendChild(planHeading);
    }

    // Price line: integer + decimal + currency + period (e.g. "54.99 €/year").
    const priceMain = card.querySelector('.actionbox-price-main');
    if (priceMain) {
      const integer = priceMain.querySelector('.price-wrapper .integer');
      // The decimal that has visible content lives in .price-suffix .decimal.row-short
      // (the .row-long decimal is empty in the source). Fall back to any non-empty .decimal.
      let decimalText = '';
      const decimals = priceMain.querySelectorAll('.decimal');
      for (const d of decimals) {
        const t = d.textContent.trim();
        if (t) { decimalText = t; break; }
      }
      const currency = priceMain.querySelector('.currency');
      // Prefer the visible long-form period; fall back to any .period found.
      const period = priceMain.querySelector('.row-long .period, .period');

      const priceParts = [];
      if (integer) {
        let num = integer.textContent.trim();
        // Only append the fractional part when the integer doesn't already include
        // a decimal separator (some renderings put the full price into .integer).
        if (decimalText && !/[.,]/.test(num)) {
          num = `${num}${decimalText.startsWith(',') || decimalText.startsWith('.') ? decimalText : `.${decimalText}`}`;
        }
        priceParts.push(num);
      }
      if (currency) priceParts.push(currency.textContent.replace(/\s+/g, ' ').trim());
      if (period) priceParts.push(period.textContent.trim());

      if (priceParts.length) {
        const priceP = document.createElement('p');
        const strong = document.createElement('strong');
        // Format: "54.99 €/year"
        const numAndCur = [priceParts[0], priceParts[1]].filter(Boolean).join(' ');
        const periodPart = priceParts[2] ? priceParts[2] : '';
        strong.textContent = `${numAndCur}${periodPart}`.trim();
        priceP.appendChild(strong);
        bodyFragment.appendChild(priceP);
      }
    }

    // Monthly equivalent line: "It works out as 4,58 €/month."
    const monthPrice = card.querySelector('.month-price');
    if (monthPrice) {
      const monthP = document.createElement('p');
      // Flatten to a single text string to keep richtext simple.
      monthP.textContent = monthPrice.textContent.replace(/\s+/g, ' ').trim();
      bodyFragment.appendChild(monthP);
    }

    // CTA: actionbox-button link.
    const ctaAnchor = card.querySelector('a.actionbox-button, a.bi-cart-link');
    if (ctaAnchor) {
      const ctaP = document.createElement('p');
      const newAnchor = document.createElement('a');
      newAnchor.href = ctaAnchor.getAttribute('href') || '#';
      const ctaSpan = ctaAnchor.querySelector('span');
      newAnchor.textContent = (ctaSpan ? ctaSpan.textContent : ctaAnchor.textContent)
        .replace(/\s+/g, ' ').trim();
      ctaP.appendChild(newAnchor);
      bodyFragment.appendChild(ctaP);
    }

    cells.push([imageFragment, bodyFragment]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-pricing',
    cells,
  });

  element.replaceWith(block);
}
