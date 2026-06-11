import { moveInstrumentation } from '../../scripts/scripts.js';
import { getPriceBySku, buildBuylink } from '../../scripts/pricing.js';

// SKUs offered in the platform dropdown on the first card (POC)
const PLATFORM_SKUS = ['ismac-00-001-12', 'apw-00-001-12'];

async function applyPricingFromSku(body, sku) {
  const record = await getPriceBySku(sku);
  if (!record) return;

  // Title (strong/h3) from entitlement
  const titleEl = body.querySelector('h3') || body.querySelector('strong');
  if (titleEl) titleEl.textContent = record.entitlementTitle;

  // Annual price line
  const annual = body.querySelector('.cards-pricing-trio-annual');
  if (annual) {
    annual.textContent = `${record.currency}${record.yearlySalePrice}${record.priceFormat}`;
  }

  // Monthly headline price
  const price = body.querySelector('.cards-pricing-trio-price');
  if (price) {
    price.innerHTML = `${record.currency}${record.monthlySalePrice}<span>${record.secondaryPriceFormat}</span>`;
  }

  // Buylink
  const btn = body.querySelector('a.button');
  if (btn) btn.href = await buildBuylink(record);
}

function createPlatformDropdown(li) {
  const dropdown = document.createElement('div');
  dropdown.className = 'cards-pricing-trio-dropdown';

  const select = document.createElement('select');
  select.className = 'cards-pricing-trio-select';
  select.setAttribute('aria-label', 'Select platform');

  const body = li.querySelector('.cards-pricing-trio-card-body');

  Promise.all(PLATFORM_SKUS.map((sku) => getPriceBySku(sku))).then((records) => {
    records.forEach((record, i) => {
      if (!record) return;
      const option = document.createElement('option');
      option.value = i;
      option.textContent = record.entitlementTitle;
      select.append(option);
    });
  });

  select.addEventListener('change', () => {
    applyPricingFromSku(body, PLATFORM_SKUS[select.value]);
  });

  dropdown.append(select);
  li.prepend(dropdown);
}

function restructureCardBody(body) {
  const allP = [...body.querySelectorAll(':scope > p:not(.button-container)')];
  const buttonContainer = body.querySelector('.button-container');

  const priceLine = allP.find((p) => /[$€][\dX.]+\/year/.test(p.textContent));
  const worksOutLine = allP.find((p) => p.textContent.includes('It works out as'));

  if (priceLine && worksOutLine) {
    const annualText = priceLine.textContent.trim();
    const monthlyMatch = worksOutLine.textContent.match(/[$€][\dX.]+/);
    const monthly = monthlyMatch ? monthlyMatch[0] : '';

    priceLine.className = 'cards-pricing-trio-annual';
    priceLine.textContent = annualText;

    worksOutLine.className = 'cards-pricing-trio-works-out';
    worksOutLine.textContent = 'It works out as';

    const priceEl = document.createElement('p');
    priceEl.className = 'cards-pricing-trio-price';
    priceEl.innerHTML = `${monthly}<span>/month</span>`;

    if (buttonContainer) {
      buttonContainer.before(priceEl);
    } else {
      worksOutLine.after(priceEl);
    }
  }
}

function createSubscriptionModal() {
  const modal = document.createElement('div');
  modal.className = 'cards-pricing-trio-modal-overlay';
  modal.innerHTML = `
    <div class="cards-pricing-trio-modal">
      <button class="cards-pricing-trio-modal-close" aria-label="Close">&times;</button>
      <h2>Important information about your subscription</h2>
      <h3>What is a subscription</h3>
      <p>A subscription is the commitment from AVG to you, our customer, that we will continuously work to protect, optimise and connect you virtually in exchange for an annual fee that we bill to your bank card or PayPal account. Your subscription fee enables AVG to support you with the service you selected to subscribe to until you cancel your subscription.</p>
      <h3>Terms for auto-renewal and pricing</h3>
      <p>A fee for the next subscription period will be charged at the then current published price. The fees will be charged to your stored payment details up to 35 days prior to the anniversary of your subscription to AVG. These fees are subject to change.</p>
      <h3>Subscription updates, cancellations, and refunds</h3>
      <p>You can cancel your subscription via the AVG Account that is linked to the email address you provided during the subscription purchase. You can request a refund by contacting AVG Customer Support within 30 days of your initial subscription or the anniversary of your subscription.</p>
      <button class="cards-pricing-trio-modal-ok">OK, I understand</button>
    </div>
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.cards-pricing-trio-modal-close') || e.target.closest('.cards-pricing-trio-modal-ok')) {
      modal.remove();
    }
  });
  return modal;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    let imageDiv = null;
    let bodyDiv = null;
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-pricing-trio-card-image';
        imageDiv = div;
      } else {
        div.className = 'cards-pricing-trio-card-body';
        bodyDiv = div;
      }
    });
    if (imageDiv && bodyDiv) {
      const h3 = bodyDiv.querySelector('h3');
      if (h3) h3.after(imageDiv);
    }
    // Extract SKU directive (e.g. "sku: ismac-00-001-12") into a data attr
    if (bodyDiv) {
      const skuP = [...bodyDiv.querySelectorAll(':scope > p')]
        .find((p) => /^sku:/i.test(p.textContent.trim()));
      if (skuP) {
        li.dataset.sku = skuP.textContent.trim().replace(/^sku:\s*/i, '');
        skuP.remove();
      }
    }
    // Mark the free-trial card (no SKU and no yearly price)
    if (bodyDiv && !li.dataset.sku && !bodyDiv.textContent.includes('/year')) {
      li.classList.add('cards-pricing-trio-trial');
    }
    ul.append(li);
  });

  ul.querySelectorAll('.cards-pricing-trio-card-body').forEach((body) => {
    restructureCardBody(body);

    const paragraphs = body.querySelectorAll('p');
    const lastP = paragraphs[paragraphs.length - 1];
    if (lastP && lastP.textContent.trim() === 'Subscription details') {
      lastP.className = 'cards-pricing-trio-subscription-details';
      lastP.innerHTML = 'Subscription details <button class="cards-pricing-trio-info-btn" aria-label="Subscription details info">ⓘ</button>';
      lastP.querySelector('.cards-pricing-trio-info-btn').addEventListener('click', () => {
        document.body.append(createSubscriptionModal());
      });
    }
  });

  // Populate priced cards from their SKU record
  ul.querySelectorAll('li[data-sku]').forEach((li) => {
    const body = li.querySelector('.cards-pricing-trio-card-body');
    if (body) applyPricingFromSku(body, li.dataset.sku);
  });

  const firstCard = ul.querySelector('li:first-child');
  if (firstCard && firstCard.dataset.sku) {
    createPlatformDropdown(firstCard);
  }

  block.textContent = '';
  block.append(ul);

  const section = block.closest('.section');
  if (section && !section.classList.contains('hero-container') && !section.querySelector('.cards-pricing-trio-heading')) {
    const heading = document.createElement('div');
    heading.className = 'cards-pricing-trio-heading';
    heading.innerHTML = `
      <div class="cards-pricing-trio-title">
        <img src="https://publish-p149556-e1749225.adobeaemcloud.com/content/dam/avg-eds-garry/avg/logo/internet-security-mac.png" alt="AVG Internet Security for Mac" class="cards-pricing-trio-icon">
        <h2>AVG Internet Security for Mac</h2>
      </div>
      <p class="cards-pricing-trio-subtitle">Get our most advanced security for your Mac now</p>
    `;
    const wrapper = block.closest('.cards-pricing-trio-wrapper');
    if (wrapper) wrapper.before(heading);
  }

  if (section) {
    section.querySelectorAll('p').forEach((p) => {
      if (p.textContent.trim() === '30-day money-back guarantee' && !p.classList.contains('cards-pricing-trio-money-back')) {
        p.classList.add('cards-pricing-trio-money-back');
        p.innerHTML = '<img src="/icons/money-back.png" alt="" width="32" height="32"> 30-day money-back guarantee';
      }
    });
  }
}
