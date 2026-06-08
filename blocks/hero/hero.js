export default function decorate(block) {
  const imgDiv = block.querySelector(':scope > div:first-child');
  const img = imgDiv?.querySelector('img');
  if (img && img.getAttribute('src')) {
    const section = block.closest('.hero-container');
    if (section) {
      section.style.backgroundImage = `url('${img.getAttribute('src')}')`;
      section.style.backgroundSize = 'cover';
      section.style.backgroundPosition = 'center';
    }
    imgDiv.style.display = 'none';
  }

  const contentDiv = block.querySelector(':scope > div:nth-child(2)');
  if (contentDiv) {
    const awardSet = document.createElement('div');
    awardSet.className = 'hero-award-set';
    awardSet.innerHTML = '<img src="/content/dam/avg-eds-garry/avg/icons/trustpilot-award-set.png" alt="AVG Excellent - 15,354 reviews on Trustpilot">';
    contentDiv.querySelector('div')?.append(awardSet);
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
