/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq.
 * Base block: accordion.
 * Source: https://www.avg.com/en-eu/antitrack (section#faq .faq-container)
 *
 * Container block (xwalk model: accordion-faq-item). Each row = one FAQ item:
 *   cell 1 = question text (field: summary)
 *   cell 2 = answer rich-text body (field: text) — preserves inline links
 *
 * Source DOM (validated against migration-work/block-context/accordion-faq/source.html):
 *   .faq-container
 *     .accordion-item
 *       .accordion-title.question.js-question > h4 (question)
 *       .accordion-content.answer > p ... (answer rich text with inline <a> links)
 */
export default function parse(element, { document }) {
  // Find every FAQ item inside the container.
  // Validated selectors: each item is an .accordion-item with a question
  // (.accordion-title / .question) and an answer (.accordion-content / .answer).
  // Fallbacks broaden the selector for variations on other pages.
  const items = Array.from(
    element.querySelectorAll('.accordion-item, [class*="accordion-item"]'),
  ).filter((item) => item.querySelector('.accordion-title, .question, h4, h3, h2')
    && item.querySelector('.accordion-content, .answer'));

  const cells = [];

  items.forEach((item) => {
    // Question cell (field: summary) — plain text taken from the heading
    // inside .accordion-title. Falls back to direct text if heading is absent.
    const titleEl = item.querySelector(
      '.accordion-title h4, .accordion-title h3, .accordion-title h2, .question h4, .question h3, .question h2, .accordion-title, .question',
    );
    let questionText = '';
    if (titleEl) {
      questionText = (titleEl.textContent || '').replace(/\s+/g, ' ').trim();
    }

    const summaryFragment = document.createDocumentFragment();
    summaryFragment.appendChild(document.createComment(' field:summary '));
    summaryFragment.appendChild(document.createTextNode(questionText));

    // Answer cell (field: text) — rich-text body. Reference the actual
    // paragraph/content nodes so inline <a> links, <span>, <br> etc. are
    // preserved as-is in the resulting block table.
    const answerContainer = item.querySelector('.accordion-content, .answer')
      || item.querySelector('[class*="accordion-content"], [class*="answer"]');

    const textFragment = document.createDocumentFragment();
    textFragment.appendChild(document.createComment(' field:text '));

    if (answerContainer) {
      // Prefer block-level children (p, ul, ol, etc.) so the rich-text
      // structure is preserved. If none found, fall back to the whole
      // container so any inline content is still captured.
      const blockChildren = Array.from(
        answerContainer.querySelectorAll(':scope > p, :scope > ul, :scope > ol, :scope > div, :scope > h5, :scope > h6'),
      );
      if (blockChildren.length > 0) {
        blockChildren.forEach((child) => textFragment.appendChild(child));
      } else {
        // No block-level children — append the container itself which
        // carries the inline content (text, <a>, <span>, <br>).
        textFragment.appendChild(answerContainer);
      }
    }

    cells.push([summaryFragment, textFragment]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'accordion-faq',
    cells,
  });
  element.replaceWith(block);
}
