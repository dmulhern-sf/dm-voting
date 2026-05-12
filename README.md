# SF Decktools

Shared design system for building Salesforce customer-facing storytelling pages and slides.
Based on **Salesforce Brand Guidelines 2026**. Drop this folder into any static site
and build a narrative page in under an hour — no build tool, no framework, no CMS.

## What's in the box

```
decktools/
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

1. Copy `decktools/` into your new project (or clone this repo).
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

## Using with Claude Code

The fastest way to build a new deck is the `/decktools new` skill — it interviews you about the customer and story, then scaffolds the full HTML file automatically.

**Prerequisites:** install the skill from `github.com/mtoolin_sfemu/decktools` (requires collaborator access).

Once installed, just type:
```
/decktools new
```

Claude will ask you for customer name, story angle, accent colour, products, and key stats — then build the page.

### Manual prompt (no skill)

If you're not using the skill, copy this into Claude Code:

```
I'm building a Salesforce customer deck using the SF Decktools design system.

Location: ~/claude/decktools/
Stack: vanilla HTML/CSS/JS, no build tool, Salesforce Brand Guidelines 2026

Key files:
- tokens.css — design tokens (colours, spacing, type)
- components.css — all reusable blocks
- template.html — blank starter
- gate.js — optional visitor gate
- STYLE-GUIDE.md — page structure and copy rules
- SLIDE-PRINCIPLES.md — design rules, colour assignments, icon map

Assets:
- assets/fonts/ — Avant Garde For Salesforce Demi (headings), Salesforce Sans (body)
- assets/logos/ — official SF SVGs
- assets/icons/2d/ — 2D product icons (narrative pages only — no 3D)
- assets/characters/ — Astro, Einstein

Brand rules:
- Headings: Avant Garde For Salesforce Demi (--font-display)
- Body: Salesforce Sans (--font-body), max-weight 700
- 80/20 rule: 80% primary blues, 20% accent max
- One --accent CSS variable per page (customer brand colour)
- Dark hero, alternating white/off-white sections
- 2D icons only in narrative pages

Deck structure (10 sections):
Nav → Hero → Why Now → The Gap → Stack → Beachheads → Scale → Proof → Roadmap → Closing

Customer: [NAME]
Story title: [TITLE]
Accent colour: [HEX]
Products featured: [LIST]
Key proof stats: [NUMBERS]
Gate needed: yes/no — password: [PASSWORD]

Read STYLE-GUIDE.md and SLIDE-PRINCIPLES.md before writing any HTML.
```


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
