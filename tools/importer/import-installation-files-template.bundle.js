/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-installation-files-template.js
  var import_installation_files_template_exports = {};
  __export(import_installation_files_template_exports, {
    default: () => import_installation_files_template_default
  });

  // tools/importer/parsers/installation-hero.js
  function parse(element, { document }) {
    const title = element.querySelector("h1, h2");
    const subheading = [...element.querySelectorAll("p")].find((p) => {
      const a = p.querySelector("a");
      return !a && p.textContent.trim();
    });
    if (!title && !subheading) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const withHint = (name, node) => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(` field:${name} `));
      frag.appendChild(node);
      return frag;
    };
    const back = element.querySelector("a[data-hero-back]") || (() => {
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = "Back to [somewhere]";
      return a;
    })();
    const icon = (() => {
      const img = document.createElement("img");
      img.src = "https://static2.avg.com/10004907/web/i/product-icons/antivirus-business-edition-product-icon-90x90.png";
      img.setAttribute("alt", "Page icon");
      return img;
    })();
    const learnMore = (() => {
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = "Learn more";
      return a;
    })();
    const cells = [];
    cells.push([withHint("backLink", back)]);
    cells.push([withHint("icon", icon)]);
    if (title) cells.push([withHint("title", title)]);
    if (subheading) cells.push([withHint("subheading", subheading)]);
    cells.push([withHint("learnMore", learnMore)]);
    const block = WebImporter.Blocks.createBlock(document, { name: "installation-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/nav-tabs.js
  function parse2(element, { document }) {
    const anchors = [...element.querySelectorAll("a")];
    if (!anchors.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const ul = document.createElement("ul");
    anchors.forEach((source) => {
      const label = (source.textContent || "").trim();
      if (!label) return;
      const a = document.createElement("a");
      a.textContent = label;
      let href = source.getAttribute("href");
      if (!href) href = "/en-ww/installation-files-business";
      a.setAttribute("href", href);
      const li = document.createElement("li");
      li.appendChild(a);
      ul.appendChild(li);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "nav-tabs", cells: [[ul]] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/installation-card.js
  function parse3(element, { document }) {
    const NESTED = ".dc-item";
    const belongsToNested = (node) => {
      const owner = node.closest(NESTED);
      return owner && owner !== element;
    };
    const ownMatches = (selector) => [...element.querySelectorAll(selector)].filter((node) => !belongsToNested(node));
    const icon = ownMatches("img").map((img) => img.closest("picture") || img).find((el) => !el.closest("a")) || null;
    const name = ownMatches("h4, h3, h2")[0] || null;
    const learnMore = ownMatches("a").find((a) => /learn more/i.test(a.textContent)) || null;
    const description = ownMatches("p").filter((p) => {
      const a = p.querySelector("a");
      return p.textContent.trim() && (!a || a !== learnMore);
    });
    const ctas = ownMatches("a").filter((a) => a !== learnMore && (a.textContent || "").trim());
    if (!name && !description.length && !ctas.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const withHint = (fieldName, nodes) => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(` field:${fieldName} `));
      nodes.forEach((n) => n && frag.appendChild(n));
      return frag;
    };
    const infoNodes = [];
    if (name) infoNodes.push(name);
    description.forEach((p) => infoNodes.push(p));
    if (learnMore) infoNodes.push(learnMore);
    const cells = [
      [icon ? withHint("icon", [icon]) : ""],
      [withHint("info", infoNodes)],
      [withHint("ctas", ctas)]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "installation-card", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/promo-box.js
  function parse4(element, { document }) {
    const paragraphs = [...element.querySelectorAll("p")];
    const nameP = paragraphs.find((p) => !p.querySelector("a") && p.textContent.trim()) || null;
    const bodyP = paragraphs.find((p) => p !== nameP && !p.querySelector("a") && p.textContent.trim()) || null;
    const cta = element.querySelector("a") || null;
    if (!nameP && !bodyP && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const withHint = (fieldName, node) => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(` field:${fieldName} `));
      frag.appendChild(node);
      return frag;
    };
    const cells = [];
    if (nameP) {
      const span = document.createElement("span");
      span.textContent = nameP.textContent.trim();
      cells.push([withHint("productName", span)]);
    }
    if (bodyP) cells.push([withHint("text", bodyP)]);
    if (cta) {
      const label = (cta.textContent || "").trim();
      const a = document.createElement("a");
      a.setAttribute("href", cta.getAttribute("href") || "#");
      a.textContent = label || "Download";
      cells.push([withHint("cta", a)]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "promo-box", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/avg-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#ensNotifyBanner",
        "#cheqMini",
        "#ensModalWrapper",
        "#smb-cm-channel-utm-map",
        "#smb-cm-channel-cookie-map",
        "#ZN_8ksX2qGJaVxaYw6",
        "#modal-video",
        // hidden video modal (leaves a stray "×" close glyph)
        ".modal"
        // any other hidden bootstrap modals
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#menu",
        // global navigation header (line 3)
        "#footer",
        // global footer (line 515)
        "#language-selector",
        // hidden language modal (line 695)
        "#destination_publishing_iframe_symantec_0",
        // Adobe ID sync iframe (line 854)
        '[id^="batBeacon"]',
        // Bing tracking beacons (line 856)
        "a.sr-only-focusable",
        // skip-to-content/menu links (693-694)
        "iframe",
        "link",
        "noscript",
        "script",
        "source"
      ]);
    }
  }

  // tools/importer/transformers/avg-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const document = element.ownerDocument;
      const sections = payload && payload.template && payload.template.sections || [];
      if (sections.length < 2) return;
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) continue;
        if (section.style) {
          const meta = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(meta);
        }
        if (i > 0 && sectionEl.previousElementSibling) {
          sectionEl.before(document.createElement("hr"));
        }
      }
    }
  }

  // tools/importer/import-installation-files-template.js
  var parsers = {
    "installation-hero": parse,
    "nav-tabs": parse2,
    "installation-card": parse3,
    "promo-box": parse4
  };
  var PAGE_TEMPLATE = {
    name: "installation-files-template",
    description: "AVG installation files / downloads page \u2014 hero with title and subheading, Personal/Business tabs, repeated product installation cards, and a grey promo box for the AVG Clear tool.",
    urls: [
      "https://www.avg.com/en-ww/installation-files-business#pc"
    ],
    blocks: [
      {
        name: "installation-hero",
        instances: ["#body-inner > div.banner.banner-0.padding-xs-top-large"]
      },
      {
        name: "nav-tabs",
        instances: ["#products > div.container.bg-white.products-box > div.row > div.center > div.tabs"]
      },
      {
        name: "installation-card",
        instances: ["#products > div.container.bg-white.products-box > div.row > div.center > div.product-block div.dc-item"]
      },
      {
        name: "promo-box",
        instances: ["#products > div.container.bg-white.products-box > div.row > div.center > div.container"]
      }
    ],
    sections: [
      {
        id: "section-1-hero",
        name: "Hero",
        selector: "#body-inner > div.banner.banner-0.padding-xs-top-large",
        style: null,
        blocks: ["installation-hero"],
        defaultContent: []
      },
      {
        id: "section-2-products",
        name: "Products",
        selector: "#products",
        style: "light-grey",
        blocks: ["nav-tabs", "installation-card", "promo-box"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_installation_files_template_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
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
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_installation_files_template_exports);
})();
