/* eslint-disable */
/* global WebImporter */

/**
 * Section-boundary transformer for the AVG product-page template.
 *
 * Inserts AEM Edge Delivery section breaks (<hr>) between the 9 sections
 * defined in tools/importer/page-templates.json (template "product-page")
 * and appends a Section Metadata block table at the end of any section that
 * declares a section style ("dark", "grey").
 *
 * Section selectors (verified in migration-work/cleaned.html):
 *   1. section#top                                   (hero,             no style)
 *   2. section#scan + section#scan-facts (combined)  (scan-stats,       no style)
 *   3. section#trackers                              (trackers,         dark)
 *   4. section#advertisers + section#data (combined) (advertisers-data, no style)
 *   5. section#comparison                            (comparison,       grey)
 *   6. section#buy                                   (buy,              no style)
 *   7. section#requirements                          (requirements,     grey)
 *   8. section#faq                                   (faq,              grey)
 *   9. div#blogposts                                 (blogposts,        no style)
 *
 * Lifecycle: runs in afterTransform only - block parsers must have already
 * produced their AEM Word block tables; this transformer adds boundaries
 * around them and never modifies the block tables themselves.
 *
 * Signature: transform(hookName, element, payload)
 *   - hookName : 'beforeTransform' | 'afterTransform'
 *   - element  : the <main> root being mutated
 *   - payload  : importer payload, may include { template: { sections } }
 *
 * Mutates the DOM in place. Does not return a value.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

// Hard-coded fallback section descriptors that mirror the product-page
// template in tools/importer/page-templates.json. Used when payload.template
// is unavailable (e.g. during isolated transformer validation runs).
const FALLBACK_SECTIONS = [
  { id: 'hero',             selectors: ['section#top'],                          style: null   },
  { id: 'scan-stats',       selectors: ['section#scan', 'section#scan-facts'],   style: null   },
  { id: 'trackers',         selectors: ['section#trackers'],                     style: 'dark' },
  { id: 'advertisers-data', selectors: ['section#advertisers', 'section#data'],  style: null   },
  { id: 'comparison',       selectors: ['section#comparison'],                   style: 'grey' },
  { id: 'buy',              selectors: ['section#buy'],                          style: null   },
  { id: 'requirements',     selectors: ['section#requirements'],                 style: 'grey' },
  { id: 'faq',              selectors: ['section#faq'],                          style: 'grey' },
  { id: 'blogposts',        selectors: ['div#blogposts'],                        style: null   },
];

/**
 * Normalize the sections list from payload.template (whose `selector` field
 * may be a string or string[]) into a flat array of
 * { id, selectors: string[], style: string|null } objects.
 */
function normalizeSections(template) {
  if (!template || !Array.isArray(template.sections) || template.sections.length === 0) {
    return FALLBACK_SECTIONS.slice();
  }
  return template.sections.map((s) => {
    const sel = s.selector;
    const selectors = Array.isArray(sel) ? sel.slice() : (sel ? [sel] : []);
    return {
      id: s.id || s.name || '',
      selectors,
      style: s.style || null,
    };
  });
}

/**
 * Resolve the first existing element under `root` for a section descriptor.
 * Tries each selector in order and returns the first match, or null.
 */
function findSectionAnchor(root, section) {
  for (let i = 0; i < section.selectors.length; i += 1) {
    const sel = section.selectors[i];
    if (!sel) continue;
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

/**
 * Find the last element under `root` for a section descriptor (used so the
 * Section Metadata block is appended at the very end of the section, after
 * any combined sub-sections).
 */
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

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const document = element.ownerDocument;
    const template = (payload && payload.template) ? payload.template : null;
    const sections = normalizeSections(template);

    // Process sections in REVERSE order so insertions before/after one
    // section do not affect the indices of earlier ones.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const anchor = findSectionAnchor(element, section);
      if (!anchor) {
        // Selector did not match in this DOM - skip silently. The validator
        // will surface a discrepancy if the expected count is not met.
        continue;
      }

      // Append Section Metadata block at the tail of the section when a style
      // is defined. Using WebImporter.Blocks.createBlock keeps the markup
      // identical to the AEM Word block tables produced by parsers.
      if (section.style) {
        const tail = findSectionTail(element, section) || anchor;
        const metaBlock = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        // Insert immediately after the tail element so it sits at the end
        // of the section's content but before the next section's <hr>.
        if (tail.parentNode) {
          if (tail.nextSibling) {
            tail.parentNode.insertBefore(metaBlock, tail.nextSibling);
          } else {
            tail.parentNode.appendChild(metaBlock);
          }
        }
      }

      // Insert <hr> before every section EXCEPT the first. We also defend
      // against duplicate <hr> when the previous sibling is already an <hr>.
      if (i > 0) {
        const prev = anchor.previousElementSibling;
        const alreadyHr = !!(prev && prev.tagName && prev.tagName.toLowerCase() === 'hr');
        if (!alreadyHr && anchor.parentNode) {
          const hr = document.createElement('hr');
          anchor.parentNode.insertBefore(hr, anchor);
        }
      }
    }
  }
}
