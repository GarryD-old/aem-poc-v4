/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import installationHeroParser from './parsers/installation-hero.js';
import navTabsParser from './parsers/nav-tabs.js';
import installationCardParser from './parsers/installation-card.js';
import promoBoxParser from './parsers/promo-box.js';
import installationFilesParser from './parsers/installation-files.js';
import columnsBaitParser from './parsers/columns-bait.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/avg-cleanup.js';
import sectionsTransformer from './transformers/avg-sections.js';

// PARSER REGISTRY
const parsers = {
  'installation-hero': installationHeroParser,
  'nav-tabs': navTabsParser,
  'installation-card': installationCardParser,
  'promo-box': promoBoxParser,
  'installation-files': installationFilesParser,
  'columns-bait': columnsBaitParser,
};

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'installation-files-template',
  description: 'AVG installation files / downloads page template — hero, Personal/Business tabs, product cards, AVG Clear promo box, installation-files lists (latest / update / release notes / removal tool), and a "Help us improve" media CTA.',
  urls: ['https://www.avg.com/en-ww/installation-files-business#pc'],
  blocks: [
    { name: 'installation-hero', instances: ['#hero-section.hero-src'] },
    { name: 'nav-tabs', instances: ['#products > .tabs'] },
    { name: 'installation-card', instances: ['#products > .product-block > .dc-item'] },
    { name: 'promo-box', instances: ['#products > .promo-src'] },
    { name: 'installation-files', instances: ['#products > .installation-files-src'] },
    { name: 'columns-bait', instances: ['#help-section.cb-block'] },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero',
      selector: '#hero-section',
      style: null,
      blocks: ['installation-hero'],
      defaultContent: [],
    },
    {
      id: 'section-2-products',
      name: 'Products',
      selector: '#products',
      style: 'light-grey',
      blocks: ['nav-tabs', 'installation-card', 'promo-box', 'installation-files'],
      defaultContent: [],
    },
    {
      id: 'section-3-help',
      name: 'Help us improve',
      selector: '#help-section',
      style: null,
      blocks: ['columns-bait'],
      defaultContent: [],
    },
  ],
};

const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

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

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
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

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
