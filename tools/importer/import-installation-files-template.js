/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import installationHeroParser from './parsers/installation-hero.js';
import navTabsParser from './parsers/nav-tabs.js';
import installationCardParser from './parsers/installation-card.js';
import promoBoxParser from './parsers/promo-box.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/avg-cleanup.js';
import sectionsTransformer from './transformers/avg-sections.js';

// PARSER REGISTRY
const parsers = {
  'installation-hero': installationHeroParser,
  'nav-tabs': navTabsParser,
  'installation-card': installationCardParser,
  'promo-box': promoBoxParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'installation-files-template',
  description: 'AVG installation files / downloads page — hero with title and subheading, Personal/Business tabs, repeated product installation cards, and a grey promo box for the AVG Clear tool.',
  urls: [
    'https://www.avg.com/en-ww/installation-files-business#pc',
  ],
  blocks: [
    {
      name: 'installation-hero',
      instances: ['#body-inner > div.banner.banner-0.padding-xs-top-large'],
    },
    {
      name: 'nav-tabs',
      instances: ['#products > div.container.bg-white.products-box > div.row > div.center > div.tabs'],
    },
    {
      name: 'installation-card',
      instances: ['#products > div.container.bg-white.products-box > div.row > div.center > div.product-block div.dc-item'],
    },
    {
      name: 'promo-box',
      instances: ['#products > div.container.bg-white.products-box > div.row > div.center > div.container'],
    },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero',
      selector: '#body-inner > div.banner.banner-0.padding-xs-top-large',
      style: null,
      blocks: ['installation-hero'],
      defaultContent: [],
    },
    {
      id: 'section-2-products',
      name: 'Products',
      selector: '#products',
      style: 'light-grey',
      blocks: ['nav-tabs', 'installation-card', 'promo-box'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first, sections after (only if 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block. Skip elements already detached by an earlier parser.
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
