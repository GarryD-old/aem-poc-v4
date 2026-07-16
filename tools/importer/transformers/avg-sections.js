/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: AVG section breaks and section metadata.
 * Builds EDS sections from payload.template.sections:
 *  - Inserts an <hr> before each section except the first.
 *  - Appends a Section Metadata block after any section that has a style.
 *
 * Section selectors come from page-templates.json (verified against
 * migration-work/cleaned.html):
 *   section-1-hero     -> #body-inner > div.banner.banner-0.padding-xs-top-large
 *   section-2-products -> #products  (style: light-grey)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const document = element.ownerDocument;
    const sections = (payload && payload.template && payload.template.sections) || [];
    if (sections.length < 2) return;

    // Process in reverse so inserted nodes don't shift earlier lookups.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue;

      // Section Metadata block after the section (only when a style is set).
      if (section.style) {
        const meta = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(meta);
      }

      // Section break before every non-first section that has preceding content.
      if (i > 0 && sectionEl.previousElementSibling) {
        sectionEl.before(document.createElement('hr'));
      }
    }
  }
}
