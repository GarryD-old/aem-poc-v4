export default function decorate(block) {
  const textDiv = block.querySelector(':scope > div:nth-child(2)');
  if (textDiv) {
    const awardSet = document.createElement('div');
    awardSet.className = 'hero-award-set';
    awardSet.innerHTML = '<img src="/content/dam/avg/awards/trustpilot-badge.png" alt="AVG Excellent rating on Trustpilot - 15,354 reviews">';
    textDiv.append(awardSet);
  }

  const section = block.closest('.hero-container');
  const pricingWrapper = section?.querySelector('.cards-pricing-wrapper');
  if (pricingWrapper) {
    const moneyBack = document.createElement('div');
    moneyBack.className = 'hero-money-back';
    moneyBack.innerHTML = '<span class="hero-money-back-icon"></span><span>30-day money-back guarantee</span>';
    pricingWrapper.append(moneyBack);
  }
}
