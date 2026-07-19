# Pending molds

One sighting each; a mold needs two independent sightings (and a clean baseline screen)
to enter the catalogue. Promote with a date and source when the second one lands. The
regexable entries are mirrored in `PENDING_MOLDS` in `specimen-coverage.mjs`, so triage
runs (`npm run specimens -- <harvest>`) flag second sightings automatically.

| Mold | Example (skeleton) | First seen |
|---|---|---|
| "shortens the distance between A and B" | Curiosity shortens the distance between being lost and doing something useful about it. | 2026-07 |
| "worth sitting with" | ...it points to something worth sitting with: ... | 2026-07 |
| "an X problem wearing a Y problem's clothes" | ...that's a habit problem wearing a paperwork problem's clothes. | 2026-07 |
| "whether it actually X, or whether it just Y" | ...whether it actually changes behavior, or whether it just changes who gets blamed. | 2026-07 |
| "the gap X can't close" | That's the gap inspection structurally can't close. | 2026-07 |
| "has never been more important/critical" | ...change management has never been more important. | 2026-07 |
| "is no longer X. It is Y." | The challenge is no longer access to intelligence. It is translating intelligence into execution. | 2026-07 |
| verb-echo staccato pair | Weather changes in hours. Habits change in seasons. | 2026-07 |
| scare-quoted Capitalized Coinages (2+ per comment) | ...the 'Execution Fabric' ... a culture of 'Architectural Governance'... | 2026-07 |
| "where the (real) value actually lives/lies" | ...the seams where the value actually lives. | 2026-07 |

## Promoted

- ", not just a Y one" tail (2026-07) - shipped as the "a tech problem, a change-management
  one" echo rule after a second independent sighting in feed mining.

## Non-regexable observations (kept for the record)

- **Stripped-dash seams.** Specimens show ungrammatical word crashes where an em-dash was
  deleted rather than replaced ("frame it the compost doesn't", "will happen keepers
  treating"). Evidence of tell-scrubbing; detecting it needs a grammar pass, not a regex.
- **Missing final punctuation** on an otherwise polished multi-paragraph reply
  (truncation artifact). Caution: harvested text may also be truncated by the platform's
  "... more" fold, so only trust this tell on fully expanded comments.
- **Extended-metaphor closer**: the last sentence returns to an earlier metaphor for a
  button ending ("It can't force anyone to look up").
- **Uncontracted register density** ("does not", "That is" in casual replies) - a
  document-level statistic, would fit corpus-stats.mjs better than a line rule.
- **Agreement-opener stacking**: in one mined 21-comment thread, ten replies opened with
  an agreement formula (Strong point. / Couldn't agree more / 100%. / Strongly agree. /
  Spot on, Name / completely agree, spot on!). Any one phrase is common human usage, so
  no line rule; the tell is the density across a thread.
