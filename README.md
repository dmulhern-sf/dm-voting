# SF Decktools

Design system for building Salesforce customer-facing storytelling pages. Vanilla HTML/CSS/JS — no build tool, no framework.

## Getting access

You need a Salesforce EMU GitHub account (`_sfemu` suffix). Once you have one, request collaborator access from the repo owner and accept the GitHub invite.

## Install the skill

```
claude skills install github.com/mtoolin_sfemu/decktools
```

## Build a deck

```
/decktools new
```

Claude interviews you — customer name, story angle, products, stats, accent colour — and scaffolds the full HTML file. Takes about 2 minutes.

## What you get

A single self-contained HTML file built on:

- `tokens.css` — Salesforce brand colours, type, spacing
- `components.css` — nav, hero, cards, stats, stack, timeline, closing
- `animation.css` / `animation.js` — scroll-triggered entrance animations
- `animation-interactions.css` — hover and interaction states
- `gate.js` — optional visitor gate (name / company / password before access)
- `feedback-widget.js` — optional presenter feedback collector

## Deck structure

10 sections, in order:

> Nav → Hero → Why Now → The Gap → Stack → Beachheads → Scale → Proof → Roadmap → Closing

Every section is optional — delete what you don't need.

## Brand rules

- **Headings:** Avant Garde For Salesforce Demi (`--font-display`)
- **Body:** Salesforce Sans (`--font-body`), max weight 700
- **80/20 rule:** 80% primary blues, 20% accent max
- **One accent colour per page** — set `--accent` to the customer's brand colour
- **Dark hero, alternating white/off-white sections**
- **2D icons only** in narrative pages (`assets/icons/2d/`) — no 3D

## Examples

See `examples/` for reference decks and component showcases.

## Docs

- `STYLE-GUIDE.md` — page structure, copy lengths, voice, persuasion rules
- `SLIDE-PRINCIPLES.md` — design rules, colour assignments, icon map, do/don't list
