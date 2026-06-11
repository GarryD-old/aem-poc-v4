/*
 * Pricing module (POC)
 * Single source of truth for product pricing in EDS.
 *
 * Pricing records are governed in AEM (Content Fragments under
 * /language-masters/{locale}/pricing) and published as a sheet JSON feed.
 * Pages reference a SKU only (never literal prices). This module loads the
 * feed, looks up a SKU, and builds the checkout buylink.
 *
 * Buylink note: the production checkout link is signed server-side with a
 * timestamp (t) and hash (h) that expire, so it can never be stored. This
 * POC builds the link from the stored unsigned base; buildBuylink() exposes
 * a hook where the live signing API will be called once available.
 */

const DEFAULT_FEED = '/language-masters/en/pricing.json';

/**
 * Load and cache the pricing feed for a locale.
 * @param {string} [feedPath] Path to the published pricing sheet JSON
 * @returns {Promise<Map<string, object>>} SKU -> pricing record
 */
export async function loadPricing(feedPath = DEFAULT_FEED) {
  window.avgPricing = window.avgPricing || {};
  if (!window.avgPricing[feedPath]) {
    window.avgPricing[feedPath] = new Promise((resolve) => {
      fetch(feedPath)
        .then((resp) => (resp.ok ? resp.json() : { data: [] }))
        .then((json) => {
          const map = new Map();
          (json.data || []).forEach((row) => {
            if (row.sku) map.set(row.sku.toLowerCase(), row);
          });
          window.avgPricing[feedPath] = map;
          resolve(map);
        })
        .catch(() => {
          window.avgPricing[feedPath] = new Map();
          resolve(window.avgPricing[feedPath]);
        });
    });
  }
  return window.avgPricing[feedPath];
}

/**
 * Look up a single pricing record by SKU.
 * @param {string} sku
 * @param {string} [feedPath]
 * @returns {Promise<object|null>}
 */
export async function getPriceBySku(sku, feedPath = DEFAULT_FEED) {
  if (!sku) return null;
  const map = await loadPricing(feedPath);
  return map.get(sku.toLowerCase()) || null;
}

/**
 * Build the checkout buylink for a SKU.
 * POC: returns the stored unsigned base link. The live signing API hook is
 * stubbed below — when the endpoint is supplied it should fetch the signed
 * t and h params and append them.
 * @param {object} record Pricing record
 * @returns {Promise<string>} Final buylink URL
 */
export async function buildBuylink(record) {
  if (!record || !record.buylinkBase) return '#';
  // TODO: replace with live checkout signing API call:
  //   const { t, h } = await fetchSignedParams(record.sku);
  //   return `${record.buylinkBase}&t=${t}&h=${h}`;
  return record.buylinkBase;
}

/**
 * Format a price with its currency symbol.
 * @param {object} record
 * @param {'yearly'|'monthly'} [term]
 * @returns {string} e.g. "€54.99"
 */
export function formatPrice(record, term = 'yearly') {
  if (!record) return '';
  const currency = record.currency || '';
  const value = term === 'monthly' ? record.monthlySalePrice : record.yearlySalePrice;
  return value ? `${currency}${value}` : '';
}
