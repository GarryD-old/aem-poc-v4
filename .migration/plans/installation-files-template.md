# AEM Language Masters (19) & Connected Sites — Build Plan

Create a language-master + connected-sites structure under `/content/avg-eds-garry` on AEM author (`author-p149556-e1749225.adobeaemcloud.com`): **19 language masters** + **39 sites**, wired for a **two-tier MSM translation flow**.

> **Status:** v1 package already built, pushed to repo (`tools/packages/avg-eds-garry-langmaster.zip`), and installed/verified by the user — structure is good. **This revision adds the missing tier: EN language master must roll out to all other language masters** (so content authored in EN can be pushed to each locale master and sent for translation).

## The fix — EN rolls out to every other language master

Currently the masters are standalone `cq:Page` skeletons, so EN only cascades to its EN **sites**. To enable translation rollout, the structure becomes **two MSM tiers**:

```
Tier 0 (source):   language-masters/en                      ← authored in English
        │  (rollout / live copy)
        ▼
Tier 1 (locale masters):  language-masters/de_de, es_es, fr_fr, … (18 others)
        │  ← each is a LIVE COPY of en; receives EN rollout, then translated
        ▼
Tier 2 (country sites):   /de/de, /fr/fr, /ca/fr, /be/nl, …  (39 sites)
        ← each is a LIVE COPY of its Tier-1 locale master (already built)
```

**Change required:** the **18 non-EN language masters** each gain a `cq:LiveSyncConfig` on their `jcr:content` pointing at `cq:master = /content/avg-eds-garry/language-masters/en` (with `cq:LiveRelationship`/`cq:LiveSync` mixins + default rollout config). **EN stays a pure source** (no live-sync config). Tier-2 site live copies are unchanged.

> **Design note (flagged):** classic AEM translation more commonly uses **Language Copy** (a plain reference the Translation Projects flow reads) rather than MSM live copies between language masters — because an MSM rollout *overwrites* target content, which can clobber existing translations. Since your existing sites are already MSM live copies and you asked specifically for "EN rolls out to all languages", the plan wires the 18 masters as **MSM live copies of EN** to match. If you'd rather use non-destructive Language Copy (safer once translations exist), say so and I'll switch the master-tier wiring (sites stay MSM).

## Naming (unchanged, Avast convention)

- Masters: `language-masters/<lang>_<country>` (EN bare `en`).
- Sites: `/<siteCode>/<langCode>` (e.g. `/cz/cs`, `/ca/fr`).
- Fixes already applied in v1: **Taiwan `tw/zh`**, **Colombia `co/es`** (no `cn`).

## 19 masters
`en` (source) · `de_de, es_es, fr_fr, nl_nl, pt_pt, pt_br, cs_cz, id_id, it_it, ms_my, no_no, pl_pl, ru_ru, sk_sk, tr_tr, zh_tw, ja_jp, ko_kr` (18 live copies of `en`).

## 39 sites → Tier-1 master (unchanged)
EN→11 (`au, ca/en, dk, eu, gb, in, nz, se, us, ww/en, za`), `es_es`→6, `fr_fr`→4 (`fr, ca/fr, be/fr, ch/fr`), `nl_nl`→2, `de_de`→2, and 1 each for the remaining locale masters.

## Approach (regenerate the vault package)

1. **Update the generator** (`build-package.mjs`): for every master where `node !== 'en'`, emit `jcr:content` with `jcr:mixinTypes=[cq:LiveRelationship,cq:LiveSync]` + child `cq:LiveSyncConfig` (`cq:master=/content/avg-eds-garry/language-masters/en`, `cq:isDeep=true`, `cq:rolloutConfigs=[/libs/msm/wcm/rolloutconfigs/default]`). `en` stays a plain source page.
2. **Rebuild** the tree + `avg-eds-garry-langmaster.zip` (additive `filter.xml`, unchanged roots — site tier untouched).
3. **Deliver:** copy to `tools/packages/`, commit, and push to `main` so it's downloadable (auto-install to author is blocked here — `/crx/packmgr` returns 401; user installs via Package Manager).
4. **Re-install & verify** (user, in browser): EN master's **References → Live Copies** lists all 18 locale masters; each locale master shows source `= en`; a test EN rollout propagates into `de_de` etc.; site-tier rollouts (`fr_fr → /ca/fr`) still work.

## Checklist

- [ ] Confirm MSM-live-copy vs Language-Copy for the EN→masters tier (default: MSM live copy, per request)
- [ ] Update `build-package.mjs` so the 18 non-EN masters are live copies of `language-masters/en` (EN stays source)
- [ ] Rebuild JCR tree + `avg-eds-garry-langmaster.zip` (v2); keep `filter.xml` additive
- [ ] Verify locally: each non-EN master `.content.xml` has `cq:LiveSyncConfig` → `.../language-masters/en`; `en` has none; 39 site live-copies unchanged
- [ ] Copy to `tools/packages/`, commit, push to `main` (download link for the user)
- [ ] User re-installs v2 via CRX Package Manager (Upload → Force → Install)
- [ ] Verify in Sites console: EN → 18 locale masters live-copy links; masters → sites intact
- [ ] Spot-check rollouts: `en → de_de` (translation tier) and `fr_fr → /ca/fr` (site tier)

> **Note:** This plan is the artifact. Updating the generator, rebuilding the zip, and pushing require **Execute mode**. Default wiring = MSM live copies of EN for the 18 masters (matches your request); tell me if you'd prefer non-destructive Language Copy instead.
