import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const PLATFORM_OPTIONS = [
  {
    label: '1 Windows PC',
    price: '€54.99/year',
    monthly: '€4.58',
    url: 'https://checkout.avg.com/en-eu/web?product=anw.1.12m&quantity=1&campaignMarker=WDG%7Een-eu%7Eantitrack%7E%7E%7E999_aae&provider=gen&t=1779965766&h=e84282f8c7d601b4531b6d5edd9a9b3cea7dc03d5c2cabdd48019626b53cf07e&clearCart=1&trackingDisabled=marketing%3A1%2Cperformance%3A1%2Cpreference%3A1',
  },
  {
    label: '1 Mac',
    price: '€53.99/year',
    monthly: '€4.50',
    url: 'https://checkout.avg.com/en-eu/web?product=anm.1.12m&quantity=1&campaignMarker=WDG%7Een-eu%7Eantitrack%7E%7E%7E999_aae&provider=gen&t=1779965766&h=b1b61f1367d71c9ad785680232d526ff9eb29d8eb9a165b81f3c0d49ddf7681e&clearCart=1&trackingDisabled=marketing%3A1%2Cperformance%3A1%2Cpreference%3A1',
  },
];

function createPlatformDropdown(li) {
  const dropdown = document.createElement('div');
  dropdown.className = 'cards-pricing-dropdown';

  const select = document.createElement('select');
  select.className = 'cards-pricing-select';
  select.setAttribute('aria-label', 'Select platform');
  PLATFORM_OPTIONS.forEach((opt, i) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = opt.label;
    select.append(option);
  });

  select.addEventListener('change', () => {
    const selected = PLATFORM_OPTIONS[select.value];
    const body = li.querySelector('.cards-pricing-card-body');
    const h3 = body.querySelector('h3');
    const annual = body.querySelector('.cards-pricing-annual');
    const price = body.querySelector('.cards-pricing-price');
    const btn = body.querySelector('a.button');

    h3.textContent = selected.label;
    if (annual) annual.textContent = selected.price;
    if (price) price.innerHTML = `${selected.monthly}<span>/month</span>`;
    if (btn) btn.href = selected.url;
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

    priceLine.className = 'cards-pricing-annual';
    priceLine.textContent = annualText;

    worksOutLine.className = 'cards-pricing-works-out';
    worksOutLine.textContent = 'It works out as';

    const priceEl = document.createElement('p');
    priceEl.className = 'cards-pricing-price';
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
  modal.className = 'cards-pricing-modal-overlay';
  modal.innerHTML = `
    <div class="cards-pricing-modal">
      <button class="cards-pricing-modal-close" aria-label="Close">&times;</button>
      <h2>Important information about your subscription</h2>
      <h3>What is a subscription</h3>
      <p>A subscription is the commitment from AVG to you, our customer, that we will continuously work to protect, optimise and connect you virtually in exchange for an annual fee that we bill to your bank card or PayPal account. Your subscription fee enables AVG to support you with the service you selected to subscribe to until you cancel your subscription. If your subscription has expired we can help you here.</p>
      <p>The selected period for which you pay is measured in months and could be one month, one year or more years in length, depending on the service you selected to subscribe to from AVG. At the end of the selected period for which you have paid AVG will automatically charge your stored payment details for you to ensure ongoing, uninterrupted service.</p>
      <h3>Terms for auto-renewal and pricing</h3>
      <p>A fee for the next subscription period will be charged at the then current published price. The fees will be charged to your stored payment details up to 35 days prior to the anniversary of your subscription to AVG. These fees are subject to change. For annual subscriptions, we will notify you up to 65 days ahead of the anniversary of your subscription to remind you of the anniversary as well as the subscription fee that will be billed for the subsequent period.</p>
      <p>AVG products are sold as continuous subscriptions, a term used to describe the uninterrupted support we give you through our software for the period of your subscription. This means that your subscription continues without interruption unless you manually cancel it before the next billing date or in case we are unable to charge your stored payment details when due. We apply this concept of continuous subscription to ensure your service never gets interrupted and you continue to benefit from our service offering.</p>
      <p>AVG offers you many different services to which you can subscribe annually and we often discount the first year of that subscription to make it easier for you to onboard with us and enjoy our market leading services. This means that your first payment period may be discounted compared to the subsequent periods, a price difference that we make clear to you when you first selected to subscribe to our service. Prior to the anniversary of your subscription, we communicate the next payment period fee via a billing reminder.</p>
      <h3>Subscription updates, cancellations, and refunds</h3>
      <p>AVG only bills your stored payment method and has no other way of billing you for your ongoing AVG service. This means that you are responsible for agreeing to store your own payment method at first purchase and for keeping it updated to ensure that your service remains uninterrupted throughout the subscription period and relationship with us. You can cancel your subscription via the AVG Account that is linked to the email address you provided during the subscription purchase.</p>
      <p>You can request a refund by contacting AVG Customer Support within 30 days of your initial subscription or the anniversary of your subscription. For more general information regarding Subscriptions and Renewals, read here.</p>
      <h3>Customers responsibilities</h3>
      <p>Whilst we take our commitment to you very seriously, we also rely on you to enroll or download, install and regularly update our software. This is important as we continue to improve and expand the service you have subscribed to, and we wish you to continue to benefit from our efforts on your behalf. These ongoing improvements and expansions remain subject to the AVG EULA.</p>
      <button class="cards-pricing-modal-ok">OK, I understand</button>
    </div>
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.cards-pricing-modal-close') || e.target.closest('.cards-pricing-modal-ok')) {
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
        div.className = 'cards-pricing-card-image';
        imageDiv = div;
      } else {
        div.className = 'cards-pricing-card-body';
        bodyDiv = div;
      }
    });
    if (imageDiv && bodyDiv) {
      const h3 = bodyDiv.querySelector('h3');
      if (h3) h3.after(imageDiv);
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  ul.querySelectorAll('.cards-pricing-card-body').forEach((body) => {
    restructureCardBody(body);

    const paragraphs = body.querySelectorAll('p');
    const lastP = paragraphs[paragraphs.length - 1];
    if (lastP && lastP.textContent.trim() === 'Subscription details') {
      lastP.className = 'cards-pricing-subscription-details';
      lastP.innerHTML = 'Subscription details <button class="cards-pricing-info-btn" aria-label="Subscription details info">ⓘ</button>';
      lastP.querySelector('.cards-pricing-info-btn').addEventListener('click', () => {
        document.body.append(createSubscriptionModal());
      });
    }
  });

  const firstCard = ul.querySelector('li:first-child');
  if (firstCard) {
    createPlatformDropdown(firstCard);
  }

  block.textContent = '';
  block.append(ul);

  const section = block.closest('.section');
  if (section) {
    section.querySelectorAll('p').forEach((p) => {
      if (p.textContent.trim() === '30-day money-back guarantee' && !p.classList.contains('cards-pricing-money-back')) {
        p.classList.add('cards-pricing-money-back');
        p.innerHTML = '<img src="/icons/money-back.png" alt="" width="32" height="32"> 30-day money-back guarantee';
      }
    });
  }
}
