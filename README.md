# Salesforce Narrative Design Kit

Shared design system for building Salesforce customer-facing storytelling pages.
Based on **Salesforce Brand Guidelines 2026**. Drop this folder into any static site
and build a narrative page in under an hour — no build tool, no framework, no CMS.

## What's in the box

```
design-kit/
├── tokens.css            ← colours, fonts, radii, shadows
├── components.css        ← every reusable block (nav, hero, cards, stack…)
├── template.html         ← blank starter — edit copy, swap logo, done
├── gate.js               ← password gate + visitor tracking
├── cloudflare-worker.js  ← backs gate.js — logs visitors to GitHub
├── apps-script.gs        ← optional: email alerts on each visit
├── STYLE-GUIDE.md        ← how to structure a page
└── assets/
    ├── logos/            ← sf-logo.jpeg, sf-logo-cloud.png
    ├── icons/            ← agentforce, data360, marketing, platform,
    │                        sales-revenue, slack, einstein, personalisation,
    │                        real-time orchestration, data cloud
    ├── characters/       ← astro + einstein mascots, gold star
    ├── graphics/         ← moments.svg (light + dark), anatomy-decisioning
    └── screenshots/      ← product UI screenshots for reference
```

## Quick start

1. Copy `design-kit/` into your new project (or clone this folder).
2. Open `template.html`, save as `your-page.html`.
3. Replace the placeholder strings:
   - `{{Customer}}`, `{{Story Title}}`, `{{Subtitle}}`, `{{Page Name Here}}`
   - Swap `REPLACE-customer-logo.png` with the customer's logo
   - Update `--accent` in the inline `<style>` block to the customer's brand colour
4. Fill in the sections. Delete the ones you don't need — every block is optional.
5. (Optional) Keep the `<script src="gate.js">` tag if you want the page gated + tracked. Remove it for public pages.

## Brand rules (2026)

- **Typeface:** Salesforce Sans — loaded from `assets/fonts/`. Max weight: **700 (Bold)**. No 800/900.
- **Grid:** 1200px max width, 48px horizontal padding.
- **80/20 colour rule:** 80% primary blues, 20% accent max. Never override primary blues.
- **One accent per page** — set `--accent` in the inline `<style>` block to the customer's colour.
- **Icons:** 2D only in narrative pages (`assets/icons/2d/`). 3D icons for campaigns/events only.
- **Dark hero, light sections.** Alternates white ↔ `--off-white` for rhythm.
- **Numbers are the hero.** Big figures carry the narrative — let data speak.

## Claude prompt for team members

Copy this prompt into Claude Code to build a new narrative page from scratch:

```
I'm building a Salesforce customer narrative page using the sf-narrative-project design kit.

Context:
- Location: ~/claude/sf-narrative-project/
- Stack: vanilla HTML/CSS/JS, no build tool, Salesforce Brand Guidelines 2026
- Key files: tokens.css (design tokens), components.css (components), template.html (starter), gate.js (visitor gate)
- Assets: assets/fonts/ (Salesforce Sans), assets/logos/ (SF SVGs), assets/icons/2d/ (product icons), assets/characters/ (Astro)

Brand rules:
- Salesforce Sans only, max font-weight 700
- 80/20 rule: 80% primary blues, 20% accent max
- 2D icons only in narrative pages (no 3D)
- Dark hero, light alternating sections
- One --accent CSS variable override per page

Narrative structure (10 sections):
Nav → Hero → Why Now → The Gap → Stack → Beachheads → Scale → Proof → Roadmap → Closing

My page: [CUSTOMER NAME] — [STORY TITLE]
Accent colour: [HEX CODE]
Products/clouds featured: [LIST]
Key proof stats: [NUMBERS]

Create the HTML file by copying template.html and customising for this customer. Follow STYLE-GUIDE.md and SLIDE-PRINCIPLES.md strictly. Add data-password="[PASSWORD]" to <body> and include gate.js if gating is needed.
```

See `STYLE-GUIDE.md` for the full page-structure playbook and `SLIDE-PRINCIPLES.md` for design rules.


## Gating a page (optional)

`gate.js` is a self-contained visitor gate. One line at the bottom of any page:

```html
<script src="gate.js" data-page="Your Page Name"></script>
```

It:
- Blocks access until the user enters name / company / role / password
- Remembers them in `localStorage` so repeat visits are silent
- POSTs visit metadata (IP, geo, UA) to a Cloudflare Worker
- The Worker appends the visit to `tracking.json` in your repo
- Optionally emails you via web3forms on first visit

### Setup for your own tracking endpoint

1. Deploy `cloudflare-worker.js` to Cloudflare Workers (free tier).
2. Add a GitHub fine-grained PAT as the `GITHUB_TOKEN` secret on the Worker.
3. Update `GITHUB_REPO` at the top of the Worker to point at your repo.
4. Copy the Worker URL into `gate.js` → `C.workerUrl`.
5. Change the password in `gate.js` → `C.password` (default: `SFNBA2026!`).
6. (Optional) Replace `C.web3Key` with your own web3forms access key for email alerts.
   `apps-script.gs` is an older alternative using Google Apps Script if you prefer.

## License / use

Internal Salesforce use. Customer logos are owned by their respective companies —
swap them out per deal. Astro and Einstein characters are Salesforce-owned; don't
ship them to customer-branded deliverables without checking.
