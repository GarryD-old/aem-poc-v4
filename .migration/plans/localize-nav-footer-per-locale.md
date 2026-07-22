# Norton Blog on EDS/DA — Pre-Kickoff Answers & Prep Brief

Answers to the topics raised for the EDS-for-Blogs kickoff, framed so the SEO team and Martin have clear expectations. Grounded in how EDS/Document Authoring actually works (block-based, CDN-served static HTML + client-side JS decoration). Where there's a genuine constraint or a "needs building" item, it's flagged honestly rather than glossed.

> **Framing correction (important):** This is **not a migration** — EDS/DA is being stood up as an **additional, new service running *alongside* the existing traditional blog**, not replacing it. So the answers below are about **capability parity + coexistence**, not "porting off AEM." Wording updated throughout to reflect that.

## 1. SEO best practice — canonicals, metadata, no silent removal

**Reassuring answer.** In EDS/DA, SEO elements are **explicit, author-controlled, and visible** — not hidden framework magic that can silently drop:
- **Metadata** (title, description, canonical, og:*, robots, keywords) is authored per page via a **Metadata block/section** on the page itself, and can also be set in bulk via a **metadata spreadsheet** (`metadata.xlsx`) with path-pattern rules (e.g. defaults for `/blog/**`). Because EDS runs **alongside** the existing blog, nothing on the current site is touched or stripped — the SEO work is ensuring **new EDS pages are authored with the full SEO field set from day one**, matching the standards the current blog already meets.
- **Coexistence caveat (worth raising with SEO):** two services serving blog content means **canonical strategy across both** must be deliberate — decide which URL is canonical for any overlapping content so the new EDS pages don't compete with existing ones in search. That's the real SEO conversation here, not "did we lose a field."
- **Canonicals** are supported directly (metadata `canonical` field or `head.html`). We already set per-page metadata this way on the installation pages (real Title + Description).
- **`head.html`** is a project-level file we control — site-wide `<head>` tags live there, fully auditable in git.

**Implication:** the risk isn't the platform removing SEO elements (the old blog is untouched); it's (a) authoring the new EDS pages to the same SEO completeness, and (b) getting canonical/duplication policy right while both services run in parallel.

## 2. Potential limitations vs current AEM

**Your assumption is partly right, with an important reframe.** EDS is deliberately **simpler at the authoring/component layer** (block-based tables in a doc, not a deep component dialog tree), but it is **not limited in front-end capability** — anything is buildable in the block's JavaScript/CSS. The trade-off is:
- **Simpler authoring model** — fewer dialog options out of the box; behavior lives in code, not author dialogs. Good for consistency, less "author can tweak everything."
- **Interactive/dynamic components are fully possible** — they're just built as block JS rather than configured in AEM. So "more interactive components" for the blog's future is achievable; it's a build effort, not a platform ceiling.
- **Real constraint:** the *authoring surface* is a document/table, so ultra-complex per-instance configuration is less ergonomic than AEM dialogs. That's the honest limitation to set expectations on. Since EDS is additive, teams can also **keep complex pieces on the existing blog** and use EDS where its model fits — it's not all-or-nothing.

The three specific components:

- **List Component (styles + sorting + tags):** ✅ Replicable. EDS pattern = a **query index** (`helix-query.yaml` builds a `query-index.json` of all blog posts + their metadata/tags), and a **List block** that fetches it and renders/sorts/filters client-side (by tag, date, category). Internal-linking use case is well supported. Standard EDS blog territory — needs building but is a known pattern, not a gap.
- **Blog Tables (multi-use-case functionality):** ✅ Buildable as a table block with variants; the range of authoring options becomes block variants + CSS rather than dialog fields. Complex per-cell options need scoping — likely the item that takes the most design work.
- **Sticky Banner (scroll behavior) + TAC on mobile:** ✅ Pure JS behaviors (scroll listeners, viewport rules) — fully doable in block JS. No platform limitation.

## 3. Schema markup (Breadcrumb, Article, Author) — dynamic + crawlable

**Yes, achievable — with one nuance to align on.** Schema can be generated dynamically from page metadata + the query index (so authoring effort/errors stay low, as today). The nuance:
- EDS serves **static HTML from the CDN, then decorates client-side**. JSON-LD injected purely by client JS *can* be missed by some crawlers.
- **Recommended approach:** generate the JSON-LD so it's present in the **served HTML** — via `head.html` logic + metadata, or a build/publish-time injection — rather than only client-side, to match the SSR crawlability the current blog already engineered. This is exactly the "I need to understand what's needed and build it into the page" point you noted — a solvable design task, and worth an explicit kickoff agenda item (which schemas, driven by which metadata fields).

## 4. Content references (CTAs, Sticky Banners, bulk content management)

**Yes — this maps directly to EDS Fragments.** The **Fragment block** lets you author a CTA / sticky banner / promo **once** and reference it from many posts; edit the fragment → every referencing page updates on next publish. This is the EDS equivalent of AEM content references and the right tool for centrally-managed, reused blocks. A **shared fragment library** (a dedicated folder of these snippets) covers the "manage once, use everywhere" need; the exact folder layout would be designed for the blog, and can be organised to localise cleanly if the blog is multi-locale. For **bulk** management, the fragment library + the metadata spreadsheet cover most "change once, apply widely" needs. (Note: fragments are per-service — the EDS fragment library is separate from the existing blog's references; they won't share a single source automatically.)

## 5. Author pages / components (central author content)

**Yes — same fragment pattern, plus a query index.** Each author gets a **central author fragment/page** (bio, image, expertise) authored once; an **Author block** on each post references it (or looks the author up in an **authors query index** keyed by name/slug). Change the author's page once → reflected everywhere on the EDS side, like the current Author component. This also feeds **Author schema** (point 3) from a single source of truth. Effort = one author fragment/page per author on EDS + wiring posts to reference them. (As with content references, EDS authors are maintained on the EDS service; if authors must stay in sync across both services, that's a separate integration decision.)

## Honest summary for the SEO team

- **Nothing on the existing blog is removed or at risk** — EDS is a **parallel new service**; the current AEM blog keeps its SEO as-is.
- **No SEO capability is lost on the new service** — canonicals, meta, robots, and schema are all supported; the work is (a) authoring EDS pages to full SEO completeness and (b) emitting schema into served HTML for crawlability.
- **The key cross-service item** is **canonical/duplication policy** while both run in parallel — decide the canonical owner for any overlapping content.
- **Component parity is achievable** (List, Tables, Sticky Banner, Author, CTAs) but is **build effort**, delivered as blocks/fragments rather than AEM dialogs.
- **The real change** is the authoring *model* (doc/tables + fragments vs AEM dialogs), not front-end ceiling.

## Checklist (prep before the kickoff)

- [ ] Frame EDS as an **additive, parallel service** (not a migration) in all materials — set that expectation up front
- [ ] Agree the **cross-service canonical / duplicate-content policy** for any content that could exist on both the old blog and EDS
- [ ] Draft an **SEO field checklist** for a sample EDS blog post: every meta/canonical/robots/og value the current blog sets → confirm each has an EDS metadata home (per-page block + `metadata.xlsx` defaults)
- [ ] Confirm the **schema delivery decision**: JSON-LD emitted into served HTML (via `head.html`/publish-time) vs client-side — recommend served-HTML for crawlability; list which schemas (Breadcrumb, Article, Author) + their source metadata fields
- [ ] Spec the **List block**: query-index fields needed (tags, category, date, author), sort/filter options, styles to replicate
- [ ] Scope **Blog Tables**: enumerate current use cases → map to table block variants (flag the most complex as design work)
- [ ] Confirm **Sticky Banner + mobile TAC** scroll behaviors as JS block requirements (no platform blocker)
- [ ] Confirm **Fragments** as the content-reference mechanism (CTAs, sticky banners) + a blog-specific fragment library structure; note it's separate from the existing blog's references
- [ ] Confirm **Author** model: central author fragment/page per author + authors query index feeding Author schema; flag any cross-service author-sync need
- [ ] Bring the honest **limitations framing**: simpler authoring surface, capability via code, and "keep complex bits on the existing blog where it fits" since EDS is additive

> **Note:** This artifact is a briefing/answer doc for your kickoff — plan mode, so no files changed. **Key correction applied:** reframed from "migration" to **"additional new EDS service running alongside the existing blog"** — so the SEO answer is now about authoring new pages to full SEO completeness + a cross-service canonical policy, not about fields being stripped from the current site (which is untouched). If you'd like, in Execute mode I can save this as `.migration/plans/norton-blog-eds-qa.md` to share, or build a List-block + query-index proof-of-concept for the kickoff.
