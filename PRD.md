# PRD: SF Decktools

**Status:** Draft  
**Author:** Miles Toolin  
**Last updated:** 2026-05-12

---

## Problem

Salesforce SEs, AEs, and field team members spend hours building customer decks in PowerPoint — and still ship decks that are off-brand, structurally inconsistent, and narratively weak. There is no enforced standard for story arc, brand compliance, or deck quality across the team.

## Goal

Drive adoption of Decktools across the Salesforce field team — measured by the number of internal users actively requesting access and building decks.

## Users

| User type | Description | Technical level |
|-----------|-------------|-----------------|
| Solutions Engineers | Primary builders — creating customer-facing technical decks for the sales cycle | Low to mid |
| Account Executives | Need polished customer decks quickly, less technically inclined | Low |
| Field team (general) | Anyone building a Salesforce branded customer presentation | Low |

---

## Scope

**In scope**
- HTML deck generation via `/decktools new` (Quick / Full Tell-Show-Tell / Deep Bowden modes)
- Async feedback widget — per-slide review comments saved to `feedback.md`
- Install guide hosted on Heroku with password gate and Slack-based collaborator request flow

**Out of scope**
- Deck hosting / public sharing (blocked until Salesforce provides Okta-gated hosting)
- Native PowerPoint or Google Slides output
- Public or customer-facing access

---

## Success metrics

- Number of Salesforce employees who have completed the install and built at least one deck
- Number of collaborator access requests received via the install guide form
- Qualitative: decks produced pass brand review without manual correction

---

## Technical approach

**Stack:** Vanilla HTML/CSS/JS (design system) · Node/Express on Heroku (install guide hosting) · Claude Code skill (deck generation) · git.soma/mtoolin_sfemu/decktools (repo)  
**Key integrations:** Slack webhook → #sf-decktools (collaborator requests) · Cloudflare Worker (visit tracking) · Heroku (install guide hosting)  
**Auth model:** Username/password gate on install guide (stopgap) · git.soma access via EIP + manual collaborator invite for repo access

---

## User flows

### Getting access
1. User finds the install guide URL (shared via #sf-decktools or word of mouth)
2. Enters username/password to access the guide
3. Follows EIP steps to provision git.soma access (~24hr wait)
4. Submits collaborator request form — Slack notification fires to #sf-decktools
5. Miles adds them as a collaborator on git.soma repo
6. User runs `claude skills install github.com/mtoolin_sfemu/decktools`

### Building a deck
1. Open Claude Code in `~/claude/decktools`
2. Run `/decktools new`
3. Select narrative mode (Quick / Full / Deep)
4. Answer Claude's interview questions
5. Claude generates a fully branded HTML file
6. Open in Chrome — no build step
7. Iterate with plain English instructions

### Async review
1. Author shares deck URL with reviewer
2. Reviewer opens in Chrome, clicks chat icon, leaves per-slide comments
3. Reviewer clicks End Review — `feedback.md` saved locally
4. Reviewer sends `feedback.md` to author
5. Author drops file in decktools folder, tells Claude to apply changes

---

## Edge cases & error handling

- **User can't find Technology-RnD-Access in EIP:** post in #help-techforce for manual provisioning
- **Contractor access:** may need Aloha - BPO GitSoma AD group in addition to Technology-RnD-Access
- **Non-technical user stuck at CLI:** no workaround currently — blocked on Salesforce providing better internal hosting/auth
- **Content shared externally:** password gate is a social deterrent only, not a technical lock — mitigated by keeping the URL within Salesforce circles

---

## Open questions

| Question | Owner | Due |
|----------|-------|-----|
| Are Quick / Full / Deep the right three narrative modes? Validate with first wave of users. | Miles Toolin | After first 5–10 users onboarded |
| When will Salesforce provide Okta/SSO-gated internal hosting? Would replace the current password gate entirely. | Salesforce platform team | TBD |
| What's the simplest install path for a non-technical user who can't use a terminal? | Miles Toolin | TBD |

---

## Timeline

| Milestone | Target date |
|-----------|-------------|
| Install guide + access flow live (Heroku) | ✅ Done — 2026-05-12 |
| Slack canvas + #sf-decktools channel set up | ✅ Done — 2026-05-12 |
| First wave of internal users onboarded | Organic — no hard deadline |
| Validate / revise narrative modes based on user feedback | After first 5–10 users |
| Replace password gate with Okta SSO | Blocked on Salesforce platform |
