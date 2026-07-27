# AVG EDS Sites & Content Sources (plain-English guide)

This explains, in simple terms, how our AVG Edge Delivery Services (EDS) setup
is wired: **one codebase, several sites, two content sources.** Keep it handy —
it answers "why is there only one GitHub repo?" and "which URL shows my page?".

---

## The 3 building blocks

Think of a website here as **three separate things** that get combined:

| Block | What it is | Where it lives |
|-------|-----------|----------------|
| **Code** | The look & behaviour — blocks, CSS, JavaScript | **GitHub** (one repo: `garryd-old/aem-poc-v4`) |
| **Content** | The actual words, images, pages | A **content source** (either DA.live *or* AEM) |
| **Site config** | A small setting that says "use THIS code + THIS content" | **Adobe's Config Service** (not GitHub) |

EDS takes **code + content** and serves the finished page. A **site config** is
just the recipe that pairs them.

---

## Why there is only ONE GitHub repo

We use a model Adobe calls **"repoless"** = *one codebase, many sites*.

- **Code = 1 GitHub repo** (`aem-poc-v4`). This is the only repo you'll ever see.
- **Sites = many** — each is just a config entry that reuses that same repo's code.

So when you look at GitHub and see only `aem-poc-v4`, that's correct and expected.
The other "sites" are **not** repos — they're config records in Adobe's Config
Service. Creating a new site does **not** create a new GitHub repo.

> One-line version: **A repo is code. A site is a config that reuses code.
> We have 1 repo and several sites.**

---

## Our two sites right now

Both sites run the **exact same code** from the one repo. They differ only in
**where their content comes from**:

| Site name | Content comes from | Used for | Example URL |
|-----------|-------------------|----------|-------------|
| `aem-poc-v4` | **DA.live** (Document Authoring) | Simpler pages (e.g. installation files) | `main--aem-poc-v4--garryd-old.aem.live/avg-installation-files/en-ww/installation-files` |
| `aem-poc-v4-aem` | **AEM** (author instance `e1749225`) | Complex / localized / rollout pages (e.g. AntiTrack) that need MSM rollouts to 52 markets | `main--aem-poc-v4-aem--garryd-old.aem.live/ww/en/products/antitrack` |

Why two? Because a single site can pull content from **only one** source. We want
DA for the easy stuff and AEM for the rollout/localized stuff — so that's two
sites, one shared codebase.

---

## Where the site configs actually live

The sites are **not** on GitHub and **not** on anyone's laptop. Each is a small
JSON record stored in **Adobe's Admin Config Service**, addressed by a URL.

Address pattern: `https://admin.hlx.page/config/<org>/sites/<site-name>.json`
(our org is `garryd-old`).

| What you want to see | URL (open in a browser to view the JSON) |
|----------------------|-------------------------------------------|
| **List of all our sites** | https://admin.hlx.page/config/garryd-old/sites.json |
| **The `aem-poc-v4-aem` config** (AEM-backed) | https://admin.hlx.page/config/garryd-old/sites/aem-poc-v4-aem.json |
| **The `aem-poc-v4` config** (DA-backed) | https://admin.hlx.page/config/garryd-old/sites/aem-poc-v4.json |

What the `aem-poc-v4-aem` entry looks like (trimmed), and how to read it:

```json
{
  "code": {                       // WHERE THE CODE COMES FROM
    "owner": "garryd-old",
    "repo": "aem-poc-v4",         // the ONE shared GitHub repo (reused)
    "source": { "url": "https://github.com/garryd-old/aem-poc-v4" }
  },
  "content": {                    // WHERE THE CONTENT COMES FROM
    "source": {
      "url": "https://author-p149556-e1749225.adobeaemcloud.com/bin/franklin.delivery/GarryD-old/aem-poc-v4/main/content/avg-eds-garry",
      "type": "markup"            // pulled from AEM (not DA)
    }
  },
  "version": 3                    // bumps each time the config is updated
}
```

The two lines that prove the "repoless" model: `code.repo` is the **same repo**
as the other site, while `content.source.url` points at **AEM**. Change code once
in that repo → both sites get it; the only per-site difference is this content URL.

> **Note:** viewing these URLs (GET) is read-only. Creating or changing a site
> config is done by the team via the Admin API (a `POST`/`PUT` to the same URL)
> or Adobe's site-management UI — not by editing anything in this GitHub repo.

---

## Which URL shows my page?

The URL host tells you **which site**; the path tells you **where in the content
tree**. The pattern is:

```
main--<SITE>--garryd-old.aem.live/<path>
```

- **AEM-backed pages (AntiTrack, products, rollouts):**
  `https://main--aem-poc-v4-aem--garryd-old.aem.live/ww/en/products/antitrack`
- **DA-backed pages (installation files, etc.):**
  `https://main--aem-poc-v4--garryd-old.aem.live/avg-installation-files/en-ww/installation-files`

**Common gotcha:** using the wrong host or path gives a 404 even though the page
is fine on the *other* site. If you get a 404, check: right **host** (`-aem` or
not)? right **path**?

### About the path and the "mount point"

A site's content source points at a **folder** in the content tree. Whatever
folder it points at becomes the **root** of the URLs (that folder name disappears
from the front of the URL).

Our `aem-poc-v4-aem` site is currently mounted at the **whole tree**
(`content/avg-eds-garry`), so the country/language stays in the URL:

```
content/avg-eds-garry/ww/en/products/antitrack   →   /ww/en/products/antitrack
```

This is deliberate: keeping `/ww/en/...` in the URL is what lets us test the
**country selector** and multiple markets. (If we'd mounted at `.../ww` instead,
the `ww` would drop off and the URL would be `/en/products/antitrack`.)

---

## Author here → publish → see it live

For a page to appear on EDS it must be **published** (pushed to EDS), not just
authored. Two steps:

1. **Author / roll out** the content in its source:
   - AEM pages: author the English master, then **MSM rollout** to each market
     (e.g. `language-masters/en` → `ww/en`, `us/en`, `fr/fr`, …).
   - DA pages: author in DA.live.
2. **Publish** to EDS (`preview` then `live` via the admin service). Only then
   does the `.aem.live` URL render.

Editing content in AEM author **alone** does nothing on EDS until it's rolled out
(if needed) **and** published.

---

## The 52-market rollout (how it scales)

- Author a product page **once** in the English master (`language-masters/en`).
- **MSM rollout** in AEM copies + translates it into each market tree
  (`ww/en`, `us/en`, `fr/fr`, …).
- **Publish** each market's pages to EDS.
- All markets serve from the **same one site + same one codebase**, each at its
  own `/country/lang/...` path. No new GitHub repos, ever.

If a market later needs its **own domain**, it can become its own site config
(like `aem-poc-v4-aem`) — still reusing this one repo.

---

## Cheat sheet

- **Only one GitHub repo** (`aem-poc-v4`). That's on purpose. ✅
- **Sites live in Adobe's Config Service**, not GitHub. Push code once → every
  site updates.
- **Two sites today:** `aem-poc-v4` (DA content) and `aem-poc-v4-aem` (AEM content).
- **Wrong URL = 404**, even when the page is fine. Check host + path.
- **Authoring ≠ live.** Content must be published to EDS to appear.

---

## Known issue (as of this writing)

Some images on the AEM-backed AntiTrack page fail with **403** because they load
from the AEM **publish** tier (`publish-p149556…/content/dam/…`), which is
auth-gated and won't serve anonymously. Text/layout/nav/footer render fine. Fix
options: enable anonymous read on the AEM publish DAM, or self-host those assets
in the repo (like the `/icons` approach). Not yet done.
