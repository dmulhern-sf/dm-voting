# PRD: Decktools Feedback Widget + Distributable Skill

**Status:** Draft  
**Author:** Matt Toolin  
**Last updated:** 2026-05-08

---

## Problem

Async deck reviews have no structured way to collect and act on feedback — reviewers either screen share live or paste unstructured notes into Slack. There's also no way for the rest of the org to adopt the decktools design system without manually reading style files and copying conventions.

## Goal

Ship a Google Slides-style comment widget into every decktools deck, and package the full decktools kit as a one-command installable Claude skill for org-wide distribution — both delivered today.

## Users

| User type | Description | Technical level |
|-----------|-------------|-----------------|
| Reviewer | Internal teammate or non-technical stakeholder reviewing a deck async | Low–High |
| SE / deck author | Receives feedback.md, opens Claude to interpret and apply changes | High |
| Org member (skill) | SE, PM, SA, or enablement using decktools to build narrative content | Mid–High |

## Scope

**In scope**
- Bottom-right FAB comment widget embedded in all decktools decks
- Per-slide threaded comments (Google Slides style) with reviewer name + timestamp
- Reviewer name captured once on first comment, persisted in localStorage
- All metadata auto-captured: slide number, section title, timestamp, deck filename
- Presenter mode toggle (P button) that hides the widget entirely
- File System Access API writes `feedback.md` silently to disk on each comment (Chrome/Edge only)
- Auto-save on browser unload as safety net
- Explicit "End Review" button: writes final `feedback.md` + shows session summary
- `feedback.md` structured as per-slide sections with threaded comments
- Claude skill: auto-loads STYLE-GUIDE, SLIDE-PRINCIPLES, tokens, components, sf-composer on invocation
- Claude skill: `/decktools new` scaffolds a new deck from sf-composer template
- Version check baked into skill: compares local VERSION to remote, prompts update if newer
- Distribution: public GitHub repo, `claude skills install <url>`

**Out of scope**
- Reply threading on individual comments (flat thread per slide is sufficient)
- Server-side storage or real-time collaboration
- Firefox support (File System Access API not available)
- Comment deletion in this version
- Email or Slack integration

## Success metrics

- Any org member can install the skill with one command and build a compliant deck without reading style files manually
- A reviewer can leave comments on a deck and Claude can read + act on `feedback.md` in the same session
- Zero copy/paste required in the end-to-end review → apply feedback flow

## Technical approach

**Stack:** Vanilla JS (no dependencies), HTML/CSS, File System Access API  
**Key integrations:** File System Access API (browser → disk), Claude skill (markdown + VERSION file)  
**Auth model:** None — public repo, no server, no auth required

## User flows

### Reviewer leaves async feedback
1. Author sends deck URL (e.g. `sf-composer.html`)
2. Reviewer opens in Chrome/Edge — FAB visible bottom-right
3. First comment: prompted for name (stored in localStorage, never asked again)
4. Reviewer navigates slides, clicks FAB to expand panel
5. Panel shows thread for current slide; reviewer types comment, hits Submit
6. Comment appends to thread; `feedback.md` written silently to disk
7. Reviewer clicks "End Review" — session summary shown (N comments, M slides touched)
8. `feedback.md` auto-saved on tab close as safety net

### Author applies feedback with Claude
1. Author opens Claude Code in decktools directory
2. Says "read feedback.md and apply the changes"
3. Claude reads per-slide sections, applies edits to the HTML file

### Presenter mode
1. Author clicks P toggle (bottom-right) before presenting
2. Widget hidden entirely — clean presenter view
3. Click P again to return to review mode

### Org member installs skill
1. `claude skills install github.com/mtoolin/decktools`
2. On first deck-related task, skill loads all style rules automatically
3. On `/decktools new`, skill prompts for customer name + story arc → scaffolds deck from sf-composer template

### Skill version check
1. On invocation, skill reads remote `VERSION` file
2. If local version < remote: Claude prompts "decktools skill v1.x available — run `claude skills install` to update"

## feedback.md structure

```markdown
# Deck Review — sf-composer.html
**Date:** 2026-05-08  
**Slides reviewed:** 12  
**Total comments:** 7

---

## Slide 3 — The Gap

**Matt** (14:32): The compare table row for "Legacy tools" needs a stronger contrast — hard to read on the evening gradient.  
**Sarah** (14:38): Agreed. Also the header copy feels weak — suggest "The Broken State" instead of "The Gap".

## Slide 5 — AI in Action

**Matt** (14:45): Typewriter speed feels slow on the chat demo. Can we make it snappier?
```

## Edge cases & error handling

- **File System Access API denied:** Falls back to clipboard copy of full `feedback.md` content
- **Reviewer closes tab without clicking End Review:** Auto-save on `beforeunload` writes whatever was collected
- **No comments left:** "End Review" shows "No comments recorded" — no file written
- **Slide section not detectable:** Falls back to "Slide N" with no section title
- **localStorage unavailable:** Name field re-prompted each session

## Open questions

| Question | Owner | Due |
|----------|-------|-----|
| What's the GitHub repo URL for `claude skills install`? | Matt | Today |
| Should `feedback.md` be gitignored in decktools? | Matt | Today |

## Timeline

| Milestone | Target date |
|-----------|-------------|
| Feedback widget built + embedded in sf-composer.html | 2026-05-08 |
| feedback.md write flow working end-to-end | 2026-05-08 |
| Presenter mode toggle working | 2026-05-08 |
| Claude skill packaged with VERSION + version check | 2026-05-08 |
| Pushed to GitHub, install command verified | 2026-05-08 |
