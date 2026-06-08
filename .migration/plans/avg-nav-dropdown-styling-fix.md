# AVG Navigation Dropdown Fix — Iteration 2

## Current State vs Figma

### What's Wrong (from author screenshot)

| Issue | Current | Figma Target |
|-------|---------|--------------|
| **Background** | Transparent/semi-transparent — dark hero bleeds through between items | Solid white continuous panel, fully opaque |
| **Layout** | Each `<li>` has its own white box with gaps between them | One continuous white dropdown panel, no gaps |
| **Text alignment** | Centered | Left-aligned |
| **Green separator** | Shows as a floating line between separated white boxes | Full-width green line within the single white panel, separating category sections |
| **Category headers** | Correct bold text but floating in separate white pill | Inline within the panel, bold, with green line above (full width) |
| **Overall structure** | Looks like stacked individual white cards/pills | Single connected white rectangle dropping from the nav item |

### Root Cause Analysis

The dropdown `<ul>` container has `display: flex; flex-direction: column` but each `<li>` has individual `background-color: #fff` which creates separated white boxes when there's any gap or margin between them. The dark page content bleeds through between items.

The fix: the **parent `<ul>`** needs `background-color: #fff` to be the single white panel, and individual `<li>` items should NOT have their own background. Remove any gap/margin between `<li>` elements.

---

## Fix Plan

### CSS Changes

1. **Keep `background-color: #fff` on the `<ul>` dropdown container** (already there)
2. **Remove `background-color: #fff` from individual `<li>` items** — the parent container provides the white background
3. **Ensure `gap: 0`** on the flex container (already there) — verify no margin on `<li>` elements
4. **Text alignment**: ensure `text-align: left` on all items
5. **Green separator on `<strong>`**: change from `border-top` on the strong element to `border-top` on the `<li>` that contains the strong — this makes the green line span the full width of the dropdown panel
6. **Remove any padding/margin** that creates visual gaps between items
7. **Ensure the dropdown `<ul>` has `overflow: hidden`** to clip content within the border radius

### Specific CSS Rules to Write

```css
/* Dropdown panel */
header nav .nav-sections .default-content-wrapper > ul > li > ul {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  padding: 8px 0;
  margin: 0;
  background-color: #fff;
  border-right: 1px solid #e4e8f0;
  border-bottom: 1px solid #e4e8f0;
  border-left: 1px solid #e4e8f0;
  min-width: 280px;
  z-index: 9999;
  flex-direction: column;
  gap: 0;
  text-align: left;
  list-style: none;
}

/* Dropdown items — NO individual background */
header nav .nav-sections .default-content-wrapper > ul > li > ul > li {
  padding: 10px 24px;
  font-size: 16px;
  font-weight: 400;
  color: #1c222e;
  white-space: nowrap;
  text-align: left;
  margin: 0;
}

/* Category headers via strong — green top border on the LI */
header nav .nav-sections .default-content-wrapper > ul > li > ul > li strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #1c222e;
}

/* LI containing strong gets the green top border (full width) */
/* Use a class added by JS, or style strong's parent via padding-top + border */
/* Since we can't use :has(), put the border-top on the li and detect via strong presence in JS */
```

### JS Enhancement (header.js)

Add a small decoration step: after the nav is built, find all `<li>` in dropdowns that contain a `<strong>` and add a class like `nav-category` to them. This avoids needing `:has()`.

```js
// In decorate(), after nav is built:
nav.querySelectorAll('.nav-sections ul ul li').forEach((li) => {
  if (li.querySelector('strong')) {
    li.classList.add('nav-category');
  }
});
```

Then in CSS:
```css
header nav .nav-sections li.nav-category {
  border-top: 2px solid #008941;
  padding-top: 16px;
  margin-top: 8px;
}

header nav .nav-sections li.nav-category:first-child {
  border-top: none;
  margin-top: 0;
}
```

---

## Checklist

- [ ] Remove `background-color: #fff` from individual dropdown `<li>` items
- [ ] Ensure dropdown `<ul>` has solid white background as the single panel
- [ ] Add `padding: 8px 0` to dropdown `<ul>` for top/bottom internal spacing
- [ ] Remove `border-top` from `strong` element styling
- [ ] Add JS in `header.js` to add `.nav-category` class to `<li>` elements containing `<strong>`
- [ ] Style `.nav-category` with `border-top: 2px solid #008941` and extra top padding
- [ ] First `.nav-category` gets no top border
- [ ] Ensure `text-align: left` on all dropdown items
- [ ] Last item ("All PC products") gets `border-top: 1px solid #e4e8f0` and `text-align: center`
- [ ] Push and verify on AEM author

---

*This plan requires Execute mode to implement.*
