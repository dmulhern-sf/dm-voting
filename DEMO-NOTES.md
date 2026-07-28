# P4 deep dive — what it is and how to talk through it

Notes for explaining the asset to the internal team before deciding whether it
goes in front of Corporate Traveller.

## The one-line version

It takes a single line item from the P4 slide — *"platform onboarding and
activation nudges"* — and follows it end to end for one account, so the pillar
stops being a bullet and becomes something Trevor can argue with.

## Why this one and not the broad walkthrough

The broad walkthrough shows breadth: segmentation, duty of care, next best
action, zero copy. That's the right shape for a first conversation, and the wrong
shape for a workshop, because breadth gives people nothing specific to push on.

Use Case 4 is Trevor's own domain. If we're going to whiteboard it, walking in
with a worked version of the problem does two things: it proves we understand the
mechanics rather than the slogan, and it gives the room something concrete to
redirect. "That's not how Lumina works" is a *good* outcome — it means he's in it.

## The story in one paragraph

Harlow Engineering Group has 5,000 employees and 2,000 have logged into Melon.
40% adoption looks like an engagement problem, so the instinct is to email the
3,000 harder. It isn't an engagement problem. Six systems each hold one piece of
who those people are, and none holds the whole picture. Once Data 360 resolves
them into one profile per employee, the 3,000 breaks into four cohorts that need
four completely different responses — including 700 who should never be contacted
at all, because they don't travel and never will. The most valuable output of the
whole exercise is the suppression list.

## Screen by screen

### 1 · The adoption gap

Sets up the number and immediately undermines it. The dial shows 40%, and three
cards say what Melon on its own cannot tell you: which of the 3,000 travel, who
is already travelling another way, and who should be left alone.

The line to land: **a 40% adoption number is not an engagement problem, it's a
data problem wearing an engagement costume.**

It also carries the continuity note — this is the same Harlow Engineering Group
from the main walkthrough, 90 days after the renewal turned into a global
mandate. Say that out loud if you've shown the other asset, or people will do
the arithmetic on 12 travellers and get distracted.

### 2 · Six systems, six partial answers

Six cards: Workday, Melon, Lumina, Agent Port, Mel, Mosaic. Each lists what it
genuinely knows, and then — in red — the question it cannot answer. Clicking a
card dims the others.

This is the screen that earns the rest. Every system named is one FCTG already
runs, which is deliberate: nothing here depends on buying new source data. The
punchline is that the question *"which employees travel but have never used the
platform?"* cannot be asked of any single one of them. It needs Lumina's bookings
joined to Workday's roster, filtered by Melon's login history.

**That join is the product.** If you only have two minutes, show this screen.

### 3 · Unify and segment

The interactive one. "Resolve and segment" counts 5,000 profiles being resolved,
then reveals the four cohorts as a proportional bar. Clicking any cohort shows
how Data 360 knows, what the treatment is, which channel, why it matters, and
the actual segment criteria as code.

The four cohorts:

| Cohort | Size | Why they matter |
| --- | --- | --- |
| Travelling, booking offline | 1,150 | Already travel, invisible to Melon. The prize. |
| Logged in once, never returned | 700 | Intent was demonstrated once; onboarding failed. |
| Mel app only, never the platform | 450 | Engaged, wrong surface. |
| No travel activity at all | 700 | **Do not contact.** |

Click the 700 suppression cohort deliberately — the verdict pill flips to "Do not
nudge". The line: **the most valuable output is not who to nudge, it's the 700 we
now know to leave alone.** Nudging them costs goodwill and makes the adoption
number lie.

The segment criteria block is there for the technical people in the room. It is
illustrative pseudo-SQL, not a real DMO query — don't claim otherwise if asked.

### 4 · Mosaic + Data 360

Built specifically for the gap Jordan flagged. Three lanes — Data 360, Mosaic,
Activation — and a four-step exchange that plays on a button: unified context out
to Mosaic, a recommendation back, channel and timing decided, outcome returned.

The framing: **Mosaic decides what. Data 360 decides who, where and when.** And
explicitly on screen: Data 360 does not replace Mosaic any more than it replaces
Azure or Melon.

If the Azure objection is going to come up anywhere, it comes up here, and this
screen is the pre-emptive answer to it in a different costume.

### 5 · The nudge sequence

The escalation flow, one person from the 1,150. Aisha Rahman, four trips this
year, every one booked by a consultant over the phone, no Melon login ever.

Trigger is a ticketed booking landing in Lumina with no matching Melon session.
Then Mel push, wait 72 hours, decision. Then an email built from *her own
booking history* — not a feature tour — wait four days, decision. Then a task to
a consultant in Workspace.

**Run "Activates on first nudge" as well.** The sequence cancelling itself is the
part that matters more than the escalation. Nobody gets chased for something they
already did, and that's the difference between orchestration and a mail merge.

### 6 · Internal activation

The Workspace consultant console. Aisha rings in about her Singapore trip, and
Tom Bradley can see the entire picture: her activation status, both nudges that
marketing already sent her and how she responded, Mosaic's recommendation for how
to pitch it, her Agent Port entitlement, her full Lumina trip history, and a
plain-language "why she is in the programme" panel.

"Activate on this call" flips the status, records the first login, and shows the
write-back — one action, three systems updated.

This is Jordan's point made concrete: **the consultant can see every message
marketing sent.** "Activate in every channel" has to include internal users, or
the traveller rings in about an offer the person answering has never heard of.
For the CRM and Workspace audience this screen is the whole pitch.

### 7 · Outcome and reuse

Adoption 40% → 78% over twelve weeks, plus offline bookings down, support
contacts per trip down, and nudges sent *down* from 5,000 to 2,300. That last one
is the honest one — suppression means less noise, not more.

Closes on the pattern being reusable across FCM, Corporate Traveller, Savvi,
Melon and Mel, which is straight off the P4 slide, and then the slide's own
footer line: one trusted data layer, unlimited impact.

## What it is not

Be blunt about this internally, because someone will ask.

- **No org behind it.** Prose in HTML and numbers in a JSON file. Nothing is
  querying anything.
- **Every number is invented.** 1,150 and 78% are illustrative and internally
  consistent, nothing more. They are not benchmarks and not modelled.
- **The consoles are mock-ups.** Workspace looks like Salesforce because it's
  drawn to look like Salesforce.
- **The segment criteria is pseudo-SQL.** Credible in shape, not executable.
- **It is not a scoping document.** The P4 slide says amber, needs scoping, and
  this changes nothing about that. If anything it shows *why* it needs scoping:
  five source systems and an identity resolution strategy.

## Things to be straight about

**The systems have to be right.** Lumina, Agent Port, Mel, Melon and Mosaic are
named the way the account team named them on the prep call. If any of that is
wrong, it's wrong in the most visible possible place, in front of the person who
owns them. Worth 30 seconds of verification before it goes live.

**5,000 employees is a big account.** Harlow was 12 travellers in the main
walkthrough. The global-mandate bridge holds up, but it is a bridge, and it's
the first thing a careful listener will notice.

**The suppression point is the strongest thing here.** If you cut this to one
idea, cut it to that one. Every vendor promises better targeting. Almost nobody
opens with "here are the 700 people we'll tell you not to contact," and that's
the line that sounds like someone who has actually run a programme.

**It may be better as a whiteboard input than a presentation.** The honest use
might not be clicking through all seven screens. It might be showing screens 2
and 3, then putting the marker down and asking Trevor which cohorts he'd
recognise in his own data. The asset's job is to start the workshop, not to
survive being the workshop.
