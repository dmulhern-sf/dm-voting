# PRD: SF Narrative — Interactive Animation Patterns

**Status:** Draft  
**Author:** mtoolin  
**Last updated:** 2026-05-08

---

## Problem

The sf-narrative design system has slide entrance animations (fade-up, scale-in) but no reusable patterns for interactive, triggered animations — things like typewriter chat sequences, animated data flows, decision tree reveals, and live count-ups. These patterns exist in the newscorp deck but are coupled to that project's visual design. Future decks currently have nowhere to pull them from.

## Goal

Extract all interactive animation behaviors from the newscorp deck, re-wire them to sf-narrative tokens, and land them in the decktools as a reference library — so any future deck can add a ▶ Simulate button in under 30 minutes without starting from scratch.

## Users

| User type | Description | Technical level |
|-----------|-------------|-----------------|
| Deck author (self) | Building narrative/demo decks in decktools | High — comfortable with vanilla HTML/CSS/JS |

## Scope

**In scope**
- All animation behaviors from newscorp: typewriter chat, flow/decision tree, pipe packet travel, count-up number, progress fill bar, score ring fill, scrolling event stream, pulse/active node states
- CSS: keyframes, state classes (`.revealed`, `.active`, `.flowing`, `.sending`, `.anim-in`, `.pulse`) — re-mapped to sf-narrative tokens only
- JS: utility functions merged into the existing `animation.js` — `wait()`, `typeInto()`, `countUp()`, `fillBar()`, `makeSequence()`, abort/guard pattern
- `animation-interactions.css` alongside `animation.css` for the new state classes + keyframes
- `animation-demo.html` — one section per pattern, each with ▶ Play and Reset buttons, using sf-narrative components.css for layout

**Out of scope**
- Any visual styles from newscorp (colors, card shapes, glassmorphism, gradients) — zero crossover
- The newscorp-specific data (Anthony Lopez, offers.json, specific copy)
- Routing, server-side code, build tools
- Gate/password protection on the demo page

## Success metrics

- Any sf-narrative deck can use `typeInto()`, `countUp()`, `playSequence()` by linking `animation.js` and `animation-interactions.css` — no other files needed
- `animation-demo.html` opens in browser with no build step and every pattern plays correctly
- Zero visual regressions in existing decks (cw-deck.html, sf-composer.html) — entrance animations still work

## Technical approach

**Stack:** Vanilla HTML/CSS/JS — no build tool, no framework  
**Key integrations:** `tokens.css` (color vars), `components.css` (layout), `animation.css` (extended, not replaced)  
**JS namespace:** Global functions on `window` — `typeInto()`, `countUp()`, `fillBar()`, `wait()`, `makeSequence()`  
**Abort pattern:** Every async sequence accepts an abort signal (`let abort = false`) — sequences check it on every `wait()` call so Play → Play mid-sequence resets cleanly  

## File plan

| File | Action | Purpose |
|------|--------|---------|
| `animation.js` | Extend (merge) | Add utility functions below existing entrance animation code |
| `animation-interactions.css` | Create new | State classes + keyframes for interactive patterns |
| `animation-demo.html` | Create new | Live visual reference — one card per pattern, Play/Reset |

## Patterns to implement

| Pattern | CSS classes | JS function |
|---------|------------|-------------|
| Typewriter chat | `.chat-msg`, `.chat-msg.show`, `.caret` | `typeInto(el, text, speed)` |
| Flow node reveal | `.flow-node`, `.flow-node.revealed`, `.flow-node.sending` | `makeSequence([steps])` |
| Flow arrow | `.flow-arrow`, `.flow-arrow.flowing` | — (part of sequence) |
| Branch decision | `.branch.active`, `.branch.inactive` | — (part of sequence) |
| Pipe packet | `.pipe-line`, `.pipe-packet`, `.pipe-packet.flowing` | — (CSS keyframe, triggered by class) |
| Node pulse | `.node-pulse` (keyframe) | — (add/remove class) |
| Count-up number | — | `countUp(el, target, duration)` |
| Progress fill bar | — | `fillBar(el, pct, duration)` |
| Scrolling event stream | `.stream-item`, `.stream-item.show` | `streamItem(listEl, content)` |
| Score ring fill | — | `fillRing(svgCircleEl, pct, duration)` |

## Demo page structure

Each pattern gets a card (`components.css .card`) with:
- Pattern name as eyebrow
- Live demo area showing the HTML structure
- `▶ Play` and `Reset` buttons using sf-narrative button styles
- Code comment in source showing the minimal JS call needed

## Open questions

| Question | Owner | Due |
|----------|-------|-----|
| Should `animation-demo.html` be added to CLAUDE.md key files list? | mtoolin | When files land |
| Any patterns needed beyond what's in newscorp? | mtoolin | TBD |

## Timeline

| Milestone | Target date |
|-----------|-------------|
| animation-interactions.css | This session |
| animation.js extended | This session |
| animation-demo.html | This session |
