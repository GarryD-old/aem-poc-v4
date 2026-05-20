/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-comparison variant.
 * Variant: table-comparison
 * Base block: table
 * Project type: xwalk
 * Source URL: https://www.avg.com/en-eu/antitrack
 * DOM selector (from page-templates.json instances[]):
 *   - section#comparison table.table
 * Generated: 2026-05-20
 *
 * Block library mapping (xwalk container block):
 *   - Parent model: table-comparison
 *       - field "classes" (multiselect: "no-header") — SKIPPED per hinting rules.
 *   - Item model: table-comparison-row
 *       - column1text (richtext) — feature label / first column
 *       - column2text (richtext) — column 2 status / header
 *       - column3text (richtext) — column 3 status / header
 *       - column4text (richtext) — column 4 status / header
 *       - column5text (richtext) — column 5 status / header
 *
 * Each row of the AEM block = one table-comparison-row item, rendered as 5 cells.
 *   - Row 1 (the FIRST block row after the block name) = column headers:
 *       column1text is empty (label spacer)
 *       column2text..column5text = product icon + product name
 *   - Rows 2..N = feature comparison rows:
 *       column1text = feature label (richtext)
 *       column2text..column5text = status cell (tick image or empty)
 *
 * Field hinting (xwalk):
 *   - Each non-empty cell receives `<!-- field:columnNtext -->` BEFORE its content.
 *   - Empty cells are left without any field hint and without content.
 *
 * Source DOM shape (validated against migration-work/block-context/table-comparison/source.html):
 *   <table class="table">
 *     <thead>
 *       <tr>
 *         <th>&nbsp;</th>                                          <- empty label column
 *         <th class="c-title c-title-01">                          <- 4x product header columns
 *           <img src="..." alt="">
 *           <span class="thead-title">VPN</span>
 *         </th>
 *         ... 3 more product header <th>s ...
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr>                                                       <- 8x feature rows
 *         <th class="txt"><span class="tbody-text">Feature label ...</span></th>
 *         <td class="c2"><img alt="" src="...tick.png"></td>       <- tick image OR
 *         <td class="c2">&nbsp;</td>                               <- empty
 *         ... etc ...
 *       </tr>
 *       <tr class="no-border c-empty-button ..."> ... </tr>        <- footnote/CTA rows: skip
 *     </tbody>
 *   </table>
 *
 * The trailing `<tr class="c-empty-button ...">` rows hold the asterisk footnote and
 * Buy-now buttons that are not part of the comparison data; the authoring analysis
 * lists them as `footnote` (default content) so this parser excludes them.
 */
export default function parse(element, { document }) {
  const cells = [];

  // The `element` resolved by the selector `section#comparison table.table` is the
  // <table> itself. Defensively, also handle the case where a wrapping element
  // is provided by querying for the table within it.
  const table = element.matches && element.matches('table')
    ? element
    : element.querySelector('table.table, table');
  const root = table || element;

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /**
   * Build a richtext cell fragment with a field hint comment in front.
   * Returns a DocumentFragment. If `nodes` is empty (no real content) returns
   * an empty string so the cell renders as truly empty (no field hint).
   */
  const makeCell = (fieldName, nodes) => {
    const valid = (nodes || []).filter((n) => {
      if (!n) return false;
      if (typeof n === 'string') return n.trim().length > 0;
      // Treat empty elements / whitespace-only elements as empty.
      if (n.nodeType === 1) {
        return n.textContent.replace(/ /g, ' ').trim().length > 0
          || n.querySelector('img') !== null;
      }
      if (n.nodeType === 3) return n.textContent.trim().length > 0;
      return true;
    });
    if (valid.length === 0) return '';
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${fieldName} `));
    valid.forEach((n) => {
      if (typeof n === 'string') {
        frag.appendChild(document.createTextNode(n));
      } else {
        frag.appendChild(n);
      }
    });
    return frag;
  };

  // ------------------------------------------------------------------
  // Header row (row 1 of the block)
  // ------------------------------------------------------------------
  // First row = column headers. column1text empty, column2text..5 = icon + name.
  const headerTr = root.querySelector('thead tr');
  if (headerTr) {
    const headerThs = Array.from(headerTr.children); // <th>s in order
    const headerRow = ['', '', '', '', ''];

    // headerThs[0] is the empty spacer (&nbsp;) — column1text stays empty.
    // headerThs[1..4] map to column2text..column5text.
    for (let i = 1; i <= 4 && i < headerThs.length; i += 1) {
      const th = headerThs[i];
      const nodes = [];

      const icon = th.querySelector('img');
      if (icon) nodes.push(icon);

      const titleSpan = th.querySelector('.thead-title');
      if (titleSpan) {
        // Wrap the product name in a <p> so it renders as richtext rather than
        // an inline <span> (richtext fields prefer block-level wrappers).
        const titleP = document.createElement('p');
        // Preserve any inline markup (e.g. <br>) inside the title span.
        Array.from(titleSpan.childNodes).forEach((c) => titleP.appendChild(c.cloneNode(true)));
        nodes.push(titleP);
      }

      headerRow[i] = makeCell(`column${i + 1}text`, nodes);
    }

    cells.push(headerRow);
  }

  // ------------------------------------------------------------------
  // Feature rows (rows 2..N of the block)
  // ------------------------------------------------------------------
  const bodyTrs = Array.from(root.querySelectorAll('tbody > tr'))
    // Exclude footnote / CTA rows (asterisk note + Buy-now buttons).
    // These rows are flagged with `c-empty-button` (and/or `no-border`) in the source.
    .filter((tr) => !tr.classList.contains('c-empty-button')
      && !tr.classList.contains('no-border'));

  bodyTrs.forEach((tr) => {
    const tdLikes = Array.from(tr.children); // first <th class="txt">, then 4 <td class="c2">

    // ---- column1text: feature label (richtext) ----
    const labelCell = tdLikes[0];
    const labelNodes = [];
    if (labelCell) {
      const tbodyText = labelCell.querySelector('.tbody-text');
      if (tbodyText) {
        // Wrap label text in a <p>. The source has nested <span class="tool"> markers
        // for tooltips (e.g. "what's mine") that are visual annotations, not part of
        // the feature label — strip those before exporting.
        const labelP = document.createElement('p');
        Array.from(tbodyText.childNodes).forEach((c) => {
          if (c.nodeType === 1 && c.classList && c.classList.contains('tool')) return;
          labelP.appendChild(c.cloneNode(true));
        });
        // Collapse whitespace.
        labelP.textContent = labelP.textContent.replace(/\s+/g, ' ').trim();
        if (labelP.textContent.length > 0) labelNodes.push(labelP);
      } else {
        const text = (labelCell.textContent || '').replace(/\s+/g, ' ').trim();
        if (text) {
          const p = document.createElement('p');
          p.textContent = text;
          labelNodes.push(p);
        }
      }
    }

    // ---- column2text..column5text: status cells (tick image or empty) ----
    const statusCells = ['', '', '', ''];
    for (let i = 0; i < 4; i += 1) {
      const td = tdLikes[i + 1];
      if (!td) continue;
      const img = td.querySelector('img');
      const asterisk = td.querySelector('.asterixmark');
      const nodes = [];
      if (img) nodes.push(img);
      if (asterisk) {
        // Preserve the asterisk marker inline next to the tick (e.g. "yes*").
        const sup = document.createElement('sup');
        sup.textContent = (asterisk.textContent || '*').trim();
        nodes.push(sup);
      }
      statusCells[i] = makeCell(`column${i + 2}text`, nodes);
    }

    const row = [
      makeCell('column1text', labelNodes),
      statusCells[0],
      statusCells[1],
      statusCells[2],
      statusCells[3],
    ];
    cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'table-comparison',
    cells,
  });

  element.replaceWith(block);
}
