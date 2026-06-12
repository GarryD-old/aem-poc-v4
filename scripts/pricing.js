/*
 * Pricing module (POC)
 * Single source of truth for product PRICES in EDS.
 *
 * Price records are governed in AEM (Content Fragments under
 * /language-masters/{locale}/pricing) and published as a sheet JSON feed.
 * Each record is just { sku, currency, yearly, monthly }. Everything else
 * (titles, buylinks, formats) stays authored on the page. Pages reference a
 * SKU and this module injects the matching price numbers.
 */

const DEFAULT_FEED = '/language-masters/en/pricing.json';

/**
 * Load and cache the pricing feed for a locale.
 * @param {string} [feedPath] Path to the published pricing sheet JSON
 * @returns {Promise<Map<string, object>>} SKU -> price record
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
 * Look up a single price record by SKU.
 * @param {string} sku
 * @param {string} [feedPath]
 * @returns {Promise<object|null>} { sku, currency, yearly, monthly }
 */
export async function getPriceBySku(sku, feedPath = DEFAULT_FEED) {
  if (!sku) return null;
  const map = await loadPricing(feedPath);
  return map.get(sku.toLowerCase()) || null;
}
