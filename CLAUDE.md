# SF Narrative Project — Salesforce Design Kit

Reusable static design system for building Salesforce customer-facing storytelling pages.

## Stack
Vanilla HTML/CSS/JS — no build tool, no framework, no CMS.

## Key files
- `tokens.css` — design tokens (colors, spacing, type) — Salesforce Brand Guidelines 2026
- `components.css` — reusable blocks
- `template.html` — starter page
- `STYLE-GUIDE.md` — brand rules, voice, copy lengths, persuasion guardrails
- `SLIDE-PRINCIPLES.md` — slide-specific design rules, color assignments, icon map, do/don't list
- `gate.js` — visitor gate + localStorage persistence (generic, reads password from `data-password` on body or script tag; optional worker + web3 email config via data attributes)
- `VERSION` — bump whenever SKILL.md, tokens.css, or components.css change (triggers auto-update notice to skill users)
- `assets/` — characters, graphics, icons, logos, screenshots
  - `assets/icons/2d/` — 2D full colour product icons (use in narrative pages)
  - `assets/icons/3d/` — 3D icons (campaigns/events only, NOT in narrative pages)
  - `assets/logos/` — official SVG logos (use these, not legacy JPEGs)
  - `assets/fonts/` — Salesforce Sans (all weights) + Trailhead + Avant Garde For Salesforce Demi (display headings)

## Narrative structure (10 sections)
Nav → Hero → Why Now → The Gap → Stack → Beachheads → Scale → Proof → Roadmap → Closing

## Conventions
- Typeface: Avant Garde For Salesforce Demi (`--font-display`) for all headings; Salesforce Sans (`--font-body`) for body/cards. Both in assets/fonts/. max-width 1200px, 48px padding
- Alternating dark hero + light sections
- One accent color CSS variable override per page — never override primary blues
- Numbered big figures carry narrative; em-dashes for voice
- Gating optional — `data-password` attribute on body
- 80/20 color rule: 80% primary blues, 20% max secondary/accent
- Max font-weight: 700 (Bold) — Salesforce Sans has no 800/900
- 2D icons only in narrative pages — 3D for campaigns/events only

## Verification
Before reporting any task complete:
1. Open the modified HTML file directly in browser — no build step needed
2. Check all sections render: Nav → Hero → Why Now → Gap → Stack → Beachheads → Scale → Proof → Roadmap → Closing
3. Confirm fonts load (Avant Garde display, Salesforce Sans body) — no fallback rendering
4. Confirm 2D icons only — no 3D icons in narrative pages
5. Validate 80/20 color rule — primary blues dominant, accent color ≤20%
