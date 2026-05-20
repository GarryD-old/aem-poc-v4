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

  // tools/importer/import-product-page.js
  var import_product_page_exports = {};
  __export(import_product_page_exports, {
    default: () => import_product_page_default
  });

  // tools/importer/parsers/hero-product.js
  function parse(element, { document }) {
    let image = null;
    const directMedia = element.querySelector(
      ":scope > img, :scope > picture, :scope > .container > img, :scope > .container > picture, :scope > div > img, :scope > div > picture"
    );
    if (directMedia) {
      image = directMedia;
    } else {
      const candidateImages = element.querySelectorAll("img, picture");
      for (const img of candidateImages) {
        if (img.closest(".platforms")) continue;
        if (img.closest(".actionbox")) continue;
        if (img.closest(".money-back")) continue;
        if (img.closest(".trustpilot-widget")) continue;
        image = img;
        break;
      }
    }
    if (!image) {
      const bgCandidates = [
        element,
        ...element.querySelectorAll(':scope > div, :scope > .container, :scope > .hero, :scope > [class*="hero"], :scope > [class*="banner"]')
      ];
      const extractBgUrl = (el) => {
        const inline = el.getAttribute && el.getAttribute("style") || "";
        let match = inline.match(/background(?:-image)?\s*:\s*url\(["']?([^"')]+)["']?\)/i);
        if (match) return match[1];
        try {
          const view = el.ownerDocument && el.ownerDocument.defaultView || (typeof window !== "undefined" ? window : null);
          if (view && typeof view.getComputedStyle === "function") {
            const computed = view.getComputedStyle(el).backgroundImage;
            if (computed && computed !== "none") {
              const m = computed.match(/url\(["']?([^"')]+)["']?\)/i);
              if (m) return m[1];
            }
          }
        } catch (e) {
        }
        return null;
      };
      for (const el of bgCandidates) {
        const url = extractBgUrl(el);
        if (url) {
          const synthesised = document.createElement("img");
          synthesised.src = url;
          synthesised.alt = "";
          image = synthesised;
          break;
        }
      }
    }
    const heading = element.querySelector("h1, h2, h3");
    const subheading = element.querySelector("p.sub-h1, .sub-h1, p");
    const trust = element.querySelector(".trustpilot-widget");
    const cells = [];
    if (image) {
      const imgFrag = document.createDocumentFragment();
      imgFrag.appendChild(document.createComment(" field:image "));
      imgFrag.appendChild(image);
      cells.push([imgFrag]);
    } else {
      cells.push([""]);
    }
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(" field:text "));
    if (heading) textFrag.appendChild(heading);
    if (subheading && subheading !== heading) textFrag.appendChild(subheading);
    if (trust) {
      const trustLine = document.createElement("p");
      trustLine.textContent = "Customer rating powered by Trustpilot";
      textFrag.appendChild(trustLine);
    }
    cells.push([textFrag]);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "hero-product",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-pricing.js
  function parse2(element, { document }) {
    const cells = [];
    const cards = Array.from(element.querySelectorAll(":scope > .center, :scope .center.col-xs-12"));
    cards.forEach((card) => {
      const platforms = card.querySelector(".platforms");
      const imageFragment = document.createDocumentFragment();
      imageFragment.appendChild(document.createComment(" field:image "));
      if (platforms) {
        const icons = Array.from(platforms.querySelectorAll("img"));
        icons.forEach((img) => imageFragment.appendChild(img));
      }
      const bodyFragment = document.createDocumentFragment();
      bodyFragment.appendChild(document.createComment(" field:text "));
      let planName = "";
      const activeOption = card.querySelector("select.actionbox-buy-filter option.active");
      if (activeOption) {
        planName = activeOption.textContent.trim();
      } else {
        const togglerOption = card.querySelector(".toggler-option, .js-toggler");
        if (togglerOption) planName = togglerOption.textContent.trim();
      }
      if (planName) {
        const planHeading = document.createElement("h3");
        planHeading.textContent = planName;
        bodyFragment.appendChild(planHeading);
      }
      const priceMain = card.querySelector(".actionbox-price-main");
      if (priceMain) {
        const integer = priceMain.querySelector(".price-wrapper .integer");
        let decimalText = "";
        const decimals = priceMain.querySelectorAll(".decimal");
        for (const d of decimals) {
          const t = d.textContent.trim();
          if (t) {
            decimalText = t;
            break;
          }
        }
        const currency = priceMain.querySelector(".currency");
        const period = priceMain.querySelector(".row-long .period, .period");
        const priceParts = [];
        if (integer) {
          let num = integer.textContent.trim();
          if (decimalText && !/[.,]/.test(num)) {
            num = `${num}${decimalText.startsWith(",") || decimalText.startsWith(".") ? decimalText : `.${decimalText}`}`;
          }
          priceParts.push(num);
        }
        if (currency) priceParts.push(currency.textContent.replace(/\s+/g, " ").trim());
        if (period) priceParts.push(period.textContent.trim());
        if (priceParts.length) {
          const priceP = document.createElement("p");
          const strong = document.createElement("strong");
          const numAndCur = [priceParts[0], priceParts[1]].filter(Boolean).join(" ");
          const periodPart = priceParts[2] ? priceParts[2] : "";
          strong.textContent = `${numAndCur}${periodPart}`.trim();
          priceP.appendChild(strong);
          bodyFragment.appendChild(priceP);
        }
      }
      const monthPrice = card.querySelector(".month-price");
      if (monthPrice) {
        const monthP = document.createElement("p");
        monthP.textContent = monthPrice.textContent.replace(/\s+/g, " ").trim();
        bodyFragment.appendChild(monthP);
      }
      const ctaAnchor = card.querySelector("a.actionbox-button, a.bi-cart-link");
      if (ctaAnchor) {
        const ctaP = document.createElement("p");
        const newAnchor = document.createElement("a");
        newAnchor.href = ctaAnchor.getAttribute("href") || "#";
        const ctaSpan = ctaAnchor.querySelector("span");
        newAnchor.textContent = (ctaSpan ? ctaSpan.textContent : ctaAnchor.textContent).replace(/\s+/g, " ").trim();
        ctaP.appendChild(newAnchor);
        bodyFragment.appendChild(ctaP);
      }
      cells.push([imageFragment, bodyFragment]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-pricing",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stats.js
  function parse3(element, { document }) {
    const cells = [];
    const items = Array.from(
      element.querySelectorAll(":scope > .feature-item, :scope > div")
    ).filter((node) => node.querySelector("img") && node.querySelector("p"));
    items.forEach((item) => {
      const img = item.querySelector("img");
      const imageCell = document.createDocumentFragment();
      if (img) {
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(img);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      const valueParagraph = item.querySelector('p.values, p[class*="value"]');
      if (valueParagraph) {
        const h3 = document.createElement("h3");
        h3.textContent = valueParagraph.textContent.trim();
        textCell.appendChild(h3);
      }
      const captionParagraphs = Array.from(item.querySelectorAll("p")).filter(
        (p) => p !== valueParagraph
      );
      captionParagraphs.forEach((p) => {
        textCell.appendChild(p);
      });
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-stats",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-explainer.js
  function parse4(element, { document }) {
    const allSpan6 = Array.from(element.querySelectorAll(".span6"));
    let rightCol = allSpan6.find(
      (c) => !c.classList.contains("finger") && c.querySelector("h1, h2, h3")
    );
    if (!rightCol) {
      rightCol = element.querySelector(".span6:not(.finger)") || element.querySelector("h1, h2, h3") && element.querySelector("h1, h2, h3").parentElement || element;
    }
    const leftCol = element.querySelector(".span6.finger, .finger, .finger-desktop, .img-fingerprint") || rightCol && rightCol.previousElementSibling;
    const column1 = [];
    let leftImg = null;
    if (leftCol) {
      const candidates = Array.from(leftCol.querySelectorAll("img"));
      leftImg = candidates.find((i) => {
        const src = i.getAttribute("src") || "";
        return src && !src.startsWith("data:");
      }) || null;
    }
    if (!leftImg) {
      const pageDoc = element.ownerDocument || document;
      const referenced = Array.from(pageDoc.querySelectorAll("img")).map((i) => i.getAttribute("src") || "").find((src) => src && !src.startsWith("data:") && /fingerprint/i.test(src));
      if (referenced) {
        leftImg = document.createElement("img");
        leftImg.setAttribute("src", referenced);
        leftImg.setAttribute("alt", "Digital fingerprint illustration");
      }
    }
    if (!leftImg && leftCol) {
      const svg = leftCol.querySelector("svg");
      if (svg && typeof XMLSerializer !== "undefined") {
        if (!svg.getAttribute("xmlns")) {
          svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        }
        try {
          const xml = new XMLSerializer().serializeToString(svg);
          const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`;
          leftImg = document.createElement("img");
          leftImg.setAttribute("src", dataUrl);
          leftImg.setAttribute("alt", "Digital fingerprint illustration");
        } catch (e) {
        }
      }
    }
    if (leftImg) {
      if (!leftImg.getAttribute("alt")) {
        leftImg.setAttribute("alt", "Digital fingerprint illustration");
      }
      column1.push(leftImg);
    }
    const column2 = [];
    const heading = rightCol.querySelector("h1, h2, h3");
    if (heading) column2.push(heading);
    const trackerWrap = rightCol.querySelector(".trackers");
    const paragraphs = Array.from(rightCol.querySelectorAll("p")).filter(
      (p) => !trackerWrap || !trackerWrap.contains(p)
    );
    paragraphs.forEach((p) => column2.push(p));
    const trackerList = rightCol.querySelector(
      'ul.tracker-list, .trackers ul, ul[class*="tracker"], ul'
    );
    if (trackerList) {
      const cleanList = document.createElement("ul");
      Array.from(trackerList.querySelectorAll(":scope > li")).forEach((li) => {
        const label = li.querySelector('.tracker-list-text, [class*="text"]');
        const text = (label ? label.textContent : li.textContent || "").trim();
        if (text) {
          const newLi = document.createElement("li");
          newLi.textContent = text;
          cleanList.appendChild(newLi);
        }
      });
      if (cleanList.children.length > 0) {
        column2.push(cleanList);
      }
    }
    const cells = [
      [column1, column2]
    ];
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns-explainer",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-features.js
  function parse5(element, { document }) {
    const cards = Array.from(
      element.querySelectorAll('.card, .span6.card, [class*="card"]')
    ).filter((card) => card.querySelector('.ico, [class*="ico"], img') && card.querySelector('.text, [class*="text"], h3, h4, p'));
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector('.ico img, [class*="ico"] img, img');
      const imageFragment = document.createDocumentFragment();
      if (img) {
        imageFragment.appendChild(document.createComment(" field:image "));
        imageFragment.appendChild(img);
      }
      const textContainer = card.querySelector('.text, [class*="text"]') || card;
      const heading = textContainer.querySelector('h3, h2, h4, [class*="like-h"]');
      const paragraphs = Array.from(textContainer.querySelectorAll("p"));
      const textFragment = document.createDocumentFragment();
      textFragment.appendChild(document.createComment(" field:text "));
      if (heading) textFragment.appendChild(heading);
      paragraphs.forEach((p) => textFragment.appendChild(p));
      cells.push([imageFragment, textFragment]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-features",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-illustrated.js
  function parse6(element, { document }) {
    const cards = Array.from(
      element.querySelectorAll(':scope > .card, :scope > [class*="card"]')
    ).filter((card) => card.querySelector("img") && card.querySelector('h2, h3, h4, [class*="like-h"], p'));
    const cells = [];
    cards.forEach((card) => {
      const img = card.querySelector(":scope > img, img");
      const imageFragment = document.createDocumentFragment();
      if (img) {
        imageFragment.appendChild(document.createComment(" field:image "));
        imageFragment.appendChild(img);
      }
      const heading = card.querySelector('h3, h2, h4, [class*="like-h"]');
      const paragraphs = Array.from(card.querySelectorAll("p"));
      const textFragment = document.createDocumentFragment();
      textFragment.appendChild(document.createComment(" field:text "));
      if (heading) textFragment.appendChild(heading);
      paragraphs.forEach((p) => textFragment.appendChild(p));
      cells.push([imageFragment, textFragment]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "cards-illustrated",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-comparison.js
  function parse7(element, { document }) {
    const cells = [];
    const table = element.matches && element.matches("table") ? element : element.querySelector("table.table, table");
    const root = table || element;
    const makeCell = (fieldName, nodes) => {
      const valid = (nodes || []).filter((n) => {
        if (!n) return false;
        if (typeof n === "string") return n.trim().length > 0;
        if (n.nodeType === 1) {
          return n.textContent.replace(/ /g, " ").trim().length > 0 || n.querySelector("img") !== null;
        }
        if (n.nodeType === 3) return n.textContent.trim().length > 0;
        return true;
      });
      if (valid.length === 0) return "";
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(` field:${fieldName} `));
      valid.forEach((n) => {
        if (typeof n === "string") {
          frag.appendChild(document.createTextNode(n));
        } else {
          frag.appendChild(n);
        }
      });
      return frag;
    };
    const headerTr = root.querySelector("thead tr");
    if (headerTr) {
      const headerThs = Array.from(headerTr.children);
      const headerRow = ["", "", "", "", ""];
      for (let i = 1; i <= 4 && i < headerThs.length; i += 1) {
        const th = headerThs[i];
        const nodes = [];
        const icon = th.querySelector("img");
        if (icon) nodes.push(icon);
        const titleSpan = th.querySelector(".thead-title");
        if (titleSpan) {
          const titleP = document.createElement("p");
          Array.from(titleSpan.childNodes).forEach((c) => titleP.appendChild(c.cloneNode(true)));
          nodes.push(titleP);
        }
        headerRow[i] = makeCell(`column${i + 1}text`, nodes);
      }
      cells.push(headerRow);
    }
    const bodyTrs = Array.from(root.querySelectorAll("tbody > tr")).filter((tr) => !tr.classList.contains("c-empty-button") && !tr.classList.contains("no-border"));
    bodyTrs.forEach((tr) => {
      const tdLikes = Array.from(tr.children);
      const labelCell = tdLikes[0];
      const labelNodes = [];
      if (labelCell) {
        const tbodyText = labelCell.querySelector(".tbody-text");
        if (tbodyText) {
          const labelP = document.createElement("p");
          Array.from(tbodyText.childNodes).forEach((c) => {
            if (c.nodeType === 1 && c.classList && c.classList.contains("tool")) return;
            labelP.appendChild(c.cloneNode(true));
          });
          labelP.textContent = labelP.textContent.replace(/\s+/g, " ").trim();
          if (labelP.textContent.length > 0) labelNodes.push(labelP);
        } else {
          const text = (labelCell.textContent || "").replace(/\s+/g, " ").trim();
          if (text) {
            const p = document.createElement("p");
            p.textContent = text;
            labelNodes.push(p);
          }
        }
      }
      const statusCells = ["", "", "", ""];
      for (let i = 0; i < 4; i += 1) {
        const td = tdLikes[i + 1];
        if (!td) continue;
        const img = td.querySelector("img");
        const asterisk = td.querySelector(".asterixmark");
        const nodes = [];
        if (img) nodes.push(img);
        if (asterisk) {
          const sup = document.createElement("sup");
          sup.textContent = (asterisk.textContent || "*").trim();
          nodes.push(sup);
        }
        statusCells[i] = makeCell(`column${i + 2}text`, nodes);
      }
      const row = [
        makeCell("column1text", labelNodes),
        statusCells[0],
        statusCells[1],
        statusCells[2],
        statusCells[3]
      ];
      cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "table-comparison",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function parse8(element, { document }) {
    const items = Array.from(
      element.querySelectorAll('.accordion-item, [class*="accordion-item"]')
    ).filter((item) => item.querySelector(".accordion-title, .question, h4, h3, h2") && item.querySelector(".accordion-content, .answer"));
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(
        ".accordion-title h4, .accordion-title h3, .accordion-title h2, .question h4, .question h3, .question h2, .accordion-title, .question"
      );
      let questionText = "";
      if (titleEl) {
        questionText = (titleEl.textContent || "").replace(/\s+/g, " ").trim();
      }
      const summaryFragment = document.createDocumentFragment();
      summaryFragment.appendChild(document.createComment(" field:summary "));
      summaryFragment.appendChild(document.createTextNode(questionText));
      const answerContainer = item.querySelector(".accordion-content, .answer") || item.querySelector('[class*="accordion-content"], [class*="answer"]');
      const textFragment = document.createDocumentFragment();
      textFragment.appendChild(document.createComment(" field:text "));
      if (answerContainer) {
        const blockChildren = Array.from(
          answerContainer.querySelectorAll(":scope > p, :scope > ul, :scope > ol, :scope > div, :scope > h5, :scope > h6")
        );
        if (blockChildren.length > 0) {
          blockChildren.forEach((child) => textFragment.appendChild(child));
        } else {
          textFragment.appendChild(answerContainer);
        }
      }
      cells.push([summaryFragment, textFragment]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "accordion-faq",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-articles.js
  function parse9(element, { document }) {
    const cells = [];
    const slideAnchors = Array.from(
      element.querySelectorAll('a.tns-item, .tns-slider > a, .tiny-slider a[id*="item"]')
    ).filter((a) => a.querySelector(".blog-title, h4"));
    slideAnchors.forEach((slide) => {
      const img = slide.querySelector("img");
      const imageFragment = document.createDocumentFragment();
      imageFragment.appendChild(document.createComment(" field:media_image "));
      if (img) imageFragment.appendChild(img);
      const textFragment = document.createDocumentFragment();
      textFragment.appendChild(document.createComment(" field:content_text "));
      const title = slide.querySelector('h4.blog-title, h4, [class*="blog-title"]');
      if (title) textFragment.appendChild(title);
      const perex = slide.querySelector('p.blog-perex, p[class*="perex"], p');
      if (perex) textFragment.appendChild(perex);
      const articleHref = slide.getAttribute("href") || "#";
      const readMoreSpan = slide.querySelector('span.button, [class*="button"]');
      const readMoreLabel = readMoreSpan ? readMoreSpan.textContent.replace(/\s+/g, " ").trim() : "Read More";
      const readMoreP = document.createElement("p");
      const readMoreLink = document.createElement("a");
      readMoreLink.href = articleHref;
      readMoreLink.textContent = readMoreLabel || "Read More";
      readMoreP.appendChild(readMoreLink);
      textFragment.appendChild(readMoreP);
      cells.push([imageFragment, textFragment]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "carousel-articles",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  var BEFORE_REMOVE_SELECTORS = [
    // Page header / navigation chrome
    "nav#menu",
    "nav.global-navigation",
    "nav.navigation",
    "header",
    ".header",
    "#header",
    // Page footer
    "#footer",
    "footer",
    ".footer",
    ".copyright-row",
    // Language switcher modal
    ".language-selector",
    "#language-selector",
    // Scan popup modal
    ".js-scan-popup",
    ".scan-popup",
    // Trustpilot iframe widget cannot be migrated
    ".trustpilot-widget",
    // Bi-visibility tracking helpers
    '[class*="bi-visibility-"]',
    // Cookie consent and geo banners
    "#onetrust-banner-sdk",
    ".onetrust-pc-dark-filter",
    ".cookie-banner",
    ".geo-banner",
    ".bi-cookie-banner",
    "#cheq__cookie-preferences",
    // Pre-content nav rows (top utility bar with Log in / Blog / language flag)
    ".navigation-top",
    ".navigation-header",
    ".bg-image-sni-0",
    // Sticky platform-detect bar (logo + Download free trial + Buy Now)
    "#sticky-bar-platform-detect",
    ".sticky-bar",
    // Header parsys placeholder
    ".header-parsys",
    // Inline assets that are never authorable
    "script",
    "style",
    "noscript",
    'link[rel="stylesheet"]',
    // All iframes
    "iframe"
  ];
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, BEFORE_REMOVE_SELECTORS);
      const hiddenBuyVariants = element.querySelectorAll(
        ".actionbox .js-mac, .actionbox .js-android, .actionbox .js-ios"
      );
      hiddenBuyVariants.forEach((node) => {
        if (node && node.parentNode) node.remove();
      });
      element.querySelectorAll('img[src^="data:"]').forEach((img) => {
        img.setAttribute("src", "");
      });
      const removeEmptyComments = (root) => {
        const walker = root.ownerDocument.createTreeWalker(
          root,
          // NodeFilter.SHOW_COMMENT === 128
          128,
          null,
          false
        );
        const comments = [];
        let current = walker.nextNode();
        while (current) {
          comments.push(current);
          current = walker.nextNode();
        }
        comments.forEach((c) => {
          if (!c.nodeValue || c.nodeValue.trim() === "") {
            if (c.parentNode) c.parentNode.removeChild(c);
          }
        });
      };
      removeEmptyComments(element);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "nav#menu",
        "header",
        "#footer",
        ".language-selector",
        "#language-selector",
        "iframe",
        "noscript",
        'link[rel="stylesheet"]',
        '[class*="bi-visibility-"]'
      ]);
      let removedThisPass;
      do {
        removedThisPass = 0;
        element.querySelectorAll("div").forEach((div) => {
          if (div.children.length === 0 && (!div.textContent || div.textContent.trim() === "")) {
            if (div.id && div.id.length > 0) return;
            if (div.parentNode) {
              div.parentNode.removeChild(div);
              removedThisPass += 1;
            }
          }
        });
      } while (removedThisPass > 0);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("class");
        el.removeAttribute("style");
        el.removeAttribute("onclick");
        el.removeAttribute("data-track");
        el.removeAttribute("data-analytics");
      });
    }
  }

  // tools/importer/transformers/sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  var FALLBACK_SECTIONS = [
    { id: "hero", selectors: ["section#top"], style: null },
    { id: "scan-stats", selectors: ["section#scan", "section#scan-facts"], style: null },
    { id: "trackers", selectors: ["section#trackers"], style: "dark" },
    { id: "advertisers-data", selectors: ["section#advertisers", "section#data"], style: null },
    { id: "comparison", selectors: ["section#comparison"], style: "grey" },
    { id: "buy", selectors: ["section#buy"], style: null },
    { id: "requirements", selectors: ["section#requirements"], style: "grey" },
    { id: "faq", selectors: ["section#faq"], style: "grey" },
    { id: "blogposts", selectors: ["div#blogposts"], style: null }
  ];
  function normalizeSections(template) {
    if (!template || !Array.isArray(template.sections) || template.sections.length === 0) {
      return FALLBACK_SECTIONS.slice();
    }
    return template.sections.map((s) => {
      const sel = s.selector;
      const selectors = Array.isArray(sel) ? sel.slice() : sel ? [sel] : [];
      return {
        id: s.id || s.name || "",
        selectors,
        style: s.style || null
      };
    });
  }
  function findSectionAnchor(root, section) {
    for (let i = 0; i < section.selectors.length; i += 1) {
      const sel = section.selectors[i];
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function findSectionTail(root, section) {
    let last = null;
    for (let i = 0; i < section.selectors.length; i += 1) {
      const sel = section.selectors[i];
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) last = el;
    }
    return last;
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const document = element.ownerDocument;
      const template = payload && payload.template ? payload.template : null;
      const sections = normalizeSections(template);
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const anchor = findSectionAnchor(element, section);
        if (!anchor) {
          continue;
        }
        if (section.style) {
          const tail = findSectionTail(element, section) || anchor;
          const metaBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          if (tail.parentNode) {
            if (tail.nextSibling) {
              tail.parentNode.insertBefore(metaBlock, tail.nextSibling);
            } else {
              tail.parentNode.appendChild(metaBlock);
            }
          }
        }
        if (i > 0) {
          const prev = anchor.previousElementSibling;
          const alreadyHr = !!(prev && prev.tagName && prev.tagName.toLowerCase() === "hr");
          if (!alreadyHr && anchor.parentNode) {
            const hr = document.createElement("hr");
            anchor.parentNode.insertBefore(hr, anchor);
          }
        }
      }
    }
  }

  // tools/importer/import-product-page.js
  var parsers = {
    "hero-product": parse,
    "cards-pricing": parse2,
    "cards-stats": parse3,
    "columns-explainer": parse4,
    "cards-features": parse5,
    "cards-illustrated": parse6,
    "table-comparison": parse7,
    "accordion-faq": parse8,
    "carousel-articles": parse9
  };
  var PAGE_TEMPLATE = {
    name: "product-page",
    description: "AVG product detail page modeled after the AVG AntiTrack desktop layout in Figma frame 3831:297798 - includes hero, pricing cards, feature grid, columns explainers, awards/testimonials, FAQ accordion, cross-promo, and carousel sections.",
    urls: [
      "https://www.avg.com/en-eu/antitrack"
    ],
    blocks: [
      { name: "hero-product", instances: ["section#top"] },
      {
        name: "cards-pricing",
        instances: [
          "section#top .actionbox.actionbox-facelift",
          "section#buy .actionbox.actionbox-facelift"
        ]
      },
      { name: "cards-stats", instances: ["section#scan-facts .features"] },
      { name: "columns-explainer", instances: ["section#trackers .row"] },
      { name: "cards-features", instances: ["section#advertisers .container.grey.features"] },
      { name: "cards-illustrated", instances: ["section#data .cards"] },
      { name: "table-comparison", instances: ["section#comparison table.table"] },
      { name: "accordion-faq", instances: ["section#faq .faq-container"] },
      { name: "carousel-articles", instances: ["div#blogposts .carousel-slider"] }
    ],
    sections: [
      { id: "hero", name: "Hero", selector: "section#top", style: null, blocks: ["hero-product", "cards-pricing"], defaultContent: ["section#top .money-back"] },
      { id: "scan-stats", name: "Free privacy scan + 4-up stats", selector: ["section#scan", "section#scan-facts"], style: null, blocks: ["cards-stats"], defaultContent: ["section#scan h2", "section#scan p", "section#scan a.button"] },
      { id: "trackers", name: "Trackers explainer (dark, two-column)", selector: "section#trackers", style: "dark", blocks: ["columns-explainer"], defaultContent: [] },
      { id: "advertisers-data", name: "Product UI + 4-up + 3-up feature grid", selector: ["section#advertisers", "section#data"], style: null, blocks: ["cards-features", "cards-illustrated"], defaultContent: ["section#advertisers > .container > h2", "section#advertisers > .container > .banner", "section#data > .container > h2"] },
      { id: "comparison", name: "Comparison table", selector: "section#comparison", style: "grey", blocks: ["table-comparison"], defaultContent: ["section#comparison .text-center h2", "section#comparison .text-center p"] },
      { id: "buy", name: "Before-footer pricing teaser", selector: "section#buy", style: null, blocks: ["cards-pricing"], defaultContent: ["section#buy .row.title img", "section#buy .row.title h2", "section#buy p.sub", "section#buy .money-back"] },
      { id: "requirements", name: "Product info: Usage + System Requirements", selector: "section#requirements", style: "grey", blocks: [], defaultContent: ["section#requirements h3", "section#requirements p", "section#requirements ul"] },
      { id: "faq", name: "FAQ accordion", selector: "section#faq", style: "grey", blocks: ["accordion-faq"], defaultContent: ["section#faq h2.text-center"] },
      { id: "blogposts", name: "Article carousel", selector: "div#blogposts", style: null, blocks: ["carousel-articles"], defaultContent: ["div#blogposts .row.blog h2", "div#blogposts .row.blog .link-all a"] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
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
  var import_product_page_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "").replace(/^\/en-eu\/antitrack$/, "/antitrack")
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
  return __toCommonJS(import_product_page_exports);
})();
