/* eslint-disable */
/* global WebImporter */

import heroProductParser from './parsers/hero-product.js';
import cardsPricingParser from './parsers/cards-pricing.js';
import cardsStatsParser from './parsers/cards-stats.js';
import columnsExplainerParser from './parsers/columns-explainer.js';
import cardsFeaturesParser from './parsers/cards-features.js';
import cardsIllustratedParser from './parsers/cards-illustrated.js';
import tableComparisonParser from './parsers/table-comparison.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import carouselArticlesParser from './parsers/carousel-articles.js';

import cleanupTransformer from './transformers/cleanup.js';
import sectionsTransformer from './transformers/sections.js';

const parsers = {
  'hero-product': heroProductParser,
  'cards-pricing': cardsPricingParser,
  'cards-stats': cardsStatsParser,
  'columns-explainer': columnsExplainerParser,
  'cards-features': cardsFeaturesParser,
  'cards-illustrated': cardsIllustratedParser,
  'table-comparison': tableComparisonParser,
  'accordion-faq': accordionFaqParser,
  'carousel-articles': carouselArticlesParser,
};

const PAGE_TEMPLATE = {
  name: 'product-page',
  description: 'AVG product detail page modeled after the AVG AntiTrack desktop layout in Figma frame 3831:297798 - includes hero, pricing cards, feature grid, columns explainers, awards/testimonials, FAQ accordion, cross-promo, and carousel sections.',
  urls: [
    'https://www.avg.com/en-eu/antitrack',
  ],
  blocks: [
    { name: 'hero-product', instances: ['section#top'] },
    {
      name: 'cards-pricing',
      instances: [
        'section#top .actionbox.actionbox-facelift',
        'section#buy .actionbox.actionbox-facelift',
      ],
    },
    { name: 'cards-stats', instances: ['section#scan-facts .features'] },
    { name: 'columns-explainer', instances: ['section#trackers .row'] },
    { name: 'cards-features', instances: ['section#advertisers .container.grey.features'] },
    { name: 'cards-illustrated', instances: ['section#data .cards'] },
    { name: 'table-comparison', instances: ['section#comparison table.table'] },
    { name: 'accordion-faq', instances: ['section#faq .faq-container'] },
    { name: 'carousel-articles', instances: ['div#blogposts .carousel-slider'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero', selector: 'section#top', style: null, blocks: ['hero-product', 'cards-pricing'], defaultContent: ['section#top .money-back'] },
    { id: 'scan-stats', name: 'Free privacy scan + 4-up stats', selector: ['section#scan', 'section#scan-facts'], style: null, blocks: ['cards-stats'], defaultContent: ['section#scan h2', 'section#scan p', 'section#scan a.button'] },
    { id: 'trackers', name: 'Trackers explainer (dark, two-column)', selector: 'section#trackers', style: 'dark', blocks: ['columns-explainer'], defaultContent: [] },
    { id: 'advertisers-data', name: 'Product UI + 4-up + 3-up feature grid', selector: ['section#advertisers', 'section#data'], style: null, blocks: ['cards-features', 'cards-illustrated'], defaultContent: ['section#advertisers > .container > h2', 'section#advertisers > .container > .banner', 'section#data > .container > h2'] },
    { id: 'comparison', name: 'Comparison table', selector: 'section#comparison', style: 'grey', blocks: ['table-comparison'], defaultContent: ['section#comparison .text-center h2', 'section#comparison .text-center p'] },
    { id: 'buy', name: 'Before-footer pricing teaser', selector: 'section#buy', style: null, blocks: ['cards-pricing'], defaultContent: ['section#buy .row.title img', 'section#buy .row.title h2', 'section#buy p.sub', 'section#buy .money-back'] },
    { id: 'requirements', name: 'Product info: Usage + System Requirements', selector: 'section#requirements', style: 'grey', blocks: [], defaultContent: ['section#requirements h3', 'section#requirements p', 'section#requirements ul'] },
    { id: 'faq', name: 'FAQ accordion', selector: 'section#faq', style: 'grey', blocks: ['accordion-faq'], defaultContent: ['section#faq h2.text-center'] },
    { id: 'blogposts', name: 'Article carousel', selector: 'div#blogposts', style: null, blocks: ['carousel-articles'], defaultContent: ['div#blogposts .row.blog h2', 'div#blogposts .row.blog .link-all a'] },
  ],
};

const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };
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
    const { document, url, html, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    pageBlocks.forEach((block) => {
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

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '').replace(/^\/en-eu\/antitrack$/, '/antitrack'),
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
