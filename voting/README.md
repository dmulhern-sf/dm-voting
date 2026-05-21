# Voting

Live audience voting for Decktools slides. QR code on the slide → mobile vote page → results stream back via WebSockets and update bars in place.

## Add a vote to a slide

1. Edit `voting/topics.json` and add a topic:

   ```json
   { "id": "audience-mood", "title": "How are we feeling?", "options": ["Energised", "Curious", "Skeptical"] }
   ```

2. In any deck HTML, drop the widget where you want it and load the script:

   ```html
   <div data-vote-topic="audience-mood"></div>
   <script src="/voting/static/voting-widget.js"></script>
   ```

3. Restart the server. The widget renders the QR + tally; the QR points at `/vote/audience-mood` for phones.

## Standalone vote slide

If you'd rather a full-screen page, see `voting-demo.html` at the repo root for a copyable template.

## Configuration

| Env var | Purpose |
|---|---|
| `PUBLIC_BASE_URL` | Public URL the QR codes should point to. Default: derived from request. Set this on Heroku. |
| `REDIS_URL` | Optional. If set, tallies and voter dedupe go in Redis (survives restart, scales to multiple dynos). Otherwise in-memory. |

## How dedupe works

The vote page generates a `voterId` in `localStorage` on first load. Each subsequent vote replaces the prior one for the same `(topicId, voterId)` rather than double-counting. Clearing browser storage lets a user vote again — fine for a workshop, not binding.

## Files

- `index.js` — Express + Socket.IO setup, REST + realtime endpoints
- `store.js` — pluggable tally store (memory / Redis)
- `topics.json` — topic definitions
- `vote.html` + `vote.js` — mobile vote page
- `voting-widget.js` + `voting-widget.css` — embeddable slide widget

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/voting/topics` | List of topics with counts, vote URL, QR data URL |
| GET | `/api/voting/topic/:id` | Single topic detail |
| POST | `/api/voting/vote` | `{ topicId, option, voterId }` |
| GET | `/vote/:id` | Mobile vote page |
| WS | `/voting/socket.io` | `voting:snapshot` on connect, `voting:tally` on each vote |
