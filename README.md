# Corporate Traveller · P4 deep dive — platform onboarding & activation nudges

A seven-screen interactive walkthrough of **one** use case from the P4 *Tech &
Product Comms* pillar. Where the main walkthrough
(`../ct-data360-demo`) covers the whole Data 360 story broadly, this one goes
deep on a single question and follows it all the way to an outcome.

**New here?** Read [`DEMO-NOTES.md`](DEMO-NOTES.md) first — it explains what
each screen shows and what point it makes. This README covers how to run and
change it.

## The question it answers

Harlow Engineering Group has 5,000 employees and 2,000 have logged into Melon.
Who are the other 3,000, and which of them actually matter?

The answer is the product: no single system can tell you, and the cohort that
matters most is invisible to the booking platform entirely, because those
people already travel — a consultant just books it for them over the phone.

## Running it

```bash
npm install
npm start          # http://localhost:8100
```

Port 8100 so it can run alongside the main walkthrough on 8000.

Navigation: `←` `→`, click the timeline on the left, swipe, or deep-link to a
screen with `?slide=5`.

## The single-file build

```bash
npm run build
```

Produces `dist/ct-p4-adoption-deep-dive.html` — a ~0.6 MB self-contained file
with fonts, logos, photography and the dataset inlined as data URIs. It opens by
double-click and makes **zero network requests**, so it survives conference wifi,
an air-gapped laptop, or being emailed. This is the format to hand over.

## How it continues from the main walkthrough

The main walkthrough leaves Harlow Engineering Group as a Melbourne managed
programme with 12 active travellers and a renewal secured. This deep dive picks
them up **90 days later**, after that renewal converted into a global mandate —
which is where 5,000 employees come from. Screen 1 states this explicitly, so
the two assets chain rather than contradict. If you show both, show them in that
order.

## Where the content lives

| File | What it holds |
| --- | --- |
| `data/p4.json` | Source systems, cohorts, segment criteria, Mosaic exchange, outcome metrics |
| `index.html` | Screen markup and all the prose |
| `app.js` | Navigation, timeline, animations, comments |
| `styles.css` | Shared shell inherited from the main walkthrough, plus a P4 section at the bottom |

Cohort sizes, criteria and outcome metrics are read from `data/p4.json` and
rendered at runtime — edit them there. Everything on screen 1, 5 and 6 is
authored directly in `index.html`.

The four cohort sizes must add up to the adoption gap. There's a check for it:

```bash
node -e "const d=require('./data/p4.json');
console.log(d.cohorts.reduce((a,c)=>a+c.size,0) === d.account.employees-d.account.loggedIn)"
```

## The systems it references

All six are real FCTG systems, named as the account team names them. Getting
these wrong in front of Trevor would be worse than not showing the demo at all.

- **Workday** — HR system of record, the 5,000 headcount
- **Melon** — the booking platform, the 2,000 logins
- **Lumina** — mid-office / ERP, system of record for bookings that actually happened
- **Agent Port** — traveller profiles, preferences, frequent flyer, policy entitlement
- **Mel** — the digital travel assistant app (distinct from Melon)
- **Mosaic** — FCTG's AI brain built on Anthropic; recommends *what*, not *who or where*

Screen 4 exists specifically to make the Mosaic relationship explicit: Data 360
does not replace it, and the exchange runs both ways.

## Reviewer feedback

Every screen has a comment widget (bottom right). Notes are keyed by screen,
stored in `localStorage`, and collected on screen 7 with a **Copy all** button.
**Presenter mode** in the footer hides all of it for live use.

Storage keys are `ct-p4-*`, separate from the main walkthrough's `ct-data360-*`,
so feedback on the two assets never mixes.

## What this is not

Hardcoded prose and JSON with no Salesforce org behind it. Every number is
illustrative. It shows what the capability would look like, not measured
results. See `DEMO-NOTES.md` for the full list of things to be straight about.

## Deploying it

Heroku config is included (`Procfile`, `app.json`, `engines` in
`package.json`). For anything else, the single-file build is a static asset —
drop it on Netlify, Vercel, S3 or a shared drive.
