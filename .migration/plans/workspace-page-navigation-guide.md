# AVG Navigation Dropdown Fix Plan

## Overview

Fix the navigation dropdown to match the Figma design image provided. The dropdown should appear directly connected below the "PC" nav item like a tab panel, with category sections separated by green lines.

---

## Current Issues (from user screenshot vs Figma)

1. **Dropdown is centered** — should be left-aligned to the nav item
2. **Items are center-aligned** — should be left-aligned
3. **No category headers** — "The Best", "Protection", "Performance", "Privacy" should be bold section headers
4. **No green separator lines** — green/teal horizontal lines should separate each category group
5. **Dropdown floats with a gap** — should connect directly to the nav item like a tab
6. **"All PC products"** at bottom should be centered with a top border

---

## Figma Design Specs (from provided image)

- **Dropdown width**: ~280px
- **Position**: directly below nav item, left-aligned to item, no gap
- **Background**: white (#fff)
- **Border**: subtle light grey border on sides and bottom
- **Category headers**: Bold, ~14px, left-aligned with left padding ~24px
- **Green separator**: 2px solid green/teal line (`#008941`) between category sections (full width)
- **Product links**: Normal weight, ~16px, left-aligned, padding ~12px 24px
- **"All PC products"**: centered, separated by a full-width grey top border
- **Active nav item**: has a green underline (3px) connecting to the dropdown panel
- **No box-shadow** visible — clean flat design with border only

---

## CSS Changes Required

1. Remove `transform: translateX(-50%)` — dropdown should align `left: 0` to nav item
2. Remove `box-shadow` — use border only
3. Add green separator via `border-top: 2px solid #008941` on `<li>` elements containing `<strong>` (category headers)
4. First category header should NOT have a green top border
5. Category headers: `font-weight: 700`, `font-size: 14px`, padding-top more than items
6. Link items: `font-size: 16px`, `font-weight: 400`, `padding: 12px 24px`
7. Remove gap between nav item and dropdown (use `top: 100%` with no margin-top)
8. Last item ("All PC products"): `text-align: center`, `border-top: 1px solid #e4e8f0`

---

## Checklist

- [ ] Fix dropdown positioning: `left: 0` (not centered), `top: 100%` (no gap)
- [ ] Remove box-shadow, use only border
- [ ] Style category headers (`<strong>`) with bold 14px and green top border separator
- [ ] Style product links: left-aligned, 16px, normal weight, 12px vertical padding
- [ ] Style "All PC products" last item: centered with grey top border
- [ ] Keep green underline on active nav item
- [ ] Ensure nav HTML has `<strong>` tags for category headers (already done)
- [ ] Push and verify on AEM author

---

*This plan requires Execute mode to implement.*
