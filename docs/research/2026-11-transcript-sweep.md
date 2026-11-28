# Transcript sweep, 2026-11-28

`mine-transcripts.mjs` measured catalogue 0.10.0 on one user's Claude Code sessions from 2026-08-17 to 2026-11-25. This file holds counts and rates only. The full local report, which can contain project vocabulary, stays in the gitignored `corpus/transcripts/`.

## Sample

The source is the assistant text in `~/.claude/projects`, about 810k words after cleaning. Sessions on this repository were skipped, because work on slop-lint quotes the tells. Most of the text comes from one product codebase and from agent-fleet tooling, so the register is technical chat: status reports, plans, reviews and explanations.

| model | dates | words | sessions with a writing skill |
|---|---|---:|---:|
| claude-opus-4-8 | 08-17 to 11-04 | 405,572 | 0 of 84 |
| claude-fable-5 | 08-17 to 08-30 | 69,367 | 0 of 46 |
| claude-sonnet-5 | 08-17 to 08-29 | 39,829 | 0 of 60 |
| claude-opus-5-5 | 10-20 to 10-29 | 27,065 | 0 of 18 |
| claude-opus-5-5 +skill | 10-10 to 11-18 | 231,711 | 88 of 88 |

A session counts as "+skill" when its transcript names no-ai-tells, serious-writing or serious-academic, usually because the skill was listed as available. Those sessions measure the model plus the user's rules. Smaller samples (Opus 5, Fable 5.1, Sonnet 5.5, Haiku 4.5) are in the local report and left out here.

Cleaning dropped 24 Opus 4.8 messages from one session that hit an output loop: 32,000 words each, one token every other line. They were 66% of that model's raw text.

## Findings

Rates are hits per 10k words unless marked.

| measure | Opus 4.8 | Fable 5 | Sonnet 5 | Opus 5.5 | Opus 5.5 +skill |
|---|---:|---:|---:|---:|---:|
| em-dashes | 246 | 225 | 168 | 3.7 | 0.8 |
| bold lead-in bullet runs (3+) | 6.9 | 8.8 | 1.5 | 22 | 20 |
| tricolons per 100 prose sentences | 2.2 | 4.1 | 2.5 | 9.0 | 7.6 |
| bold spans | 231 | 152 | 73 | 186 | 178 |
| emoji and arrows | 61 | 32 | 9.3 | 1.5 | 4.2 |
| "actionable" | 5.7 | 0.1 | 0.3 | 0.0 | 0.0 |
| "genuinely" | 4.9 | 2.2 | 1.5 | 0.4 | 0.2 |
| "load-bearing" | 1.2 | 1.0 | 0.5 | 0.0 | 0.0 |

1. Opus 5.5 dropped the em-dash without help: 3.7 per 10k words with no writing skill, against 246 for Opus 4.8. The skill took it from 3.7 to 0.8. This agrees with Bennett (2026).
2. Bold lead-in bullet runs tripled from Opus 4.8 to Opus 5.5, and no-ai-tells barely moved them (22 without, 20 with). It had a bold-density rule but no rule for the runs. Catalogue 0.10.0 and serious-writing T4 target them, so the next sweep should show whether that works.
3. Tricolons rose about fourfold in Opus 5.5. The skill-free sample has only 930 prose sentences, so the direction is more reliable than the size.
4. "actionable", "genuinely", "load-bearing" and "notably" nearly vanished in Opus 5.5, with or without the skill. These are prune candidates once Opus 4.8, Fable 5 and Sonnet 5 fall out of use. They still produce them.
5. The rightwards arrow (U+2192) accounts for most "emoji" hits: 3,066 of the Opus 4.8 hits. The rule counts arrows on purpose, but they are a separate habit from pictographs.
6. "harness" was a false positive here. Nearly all of its uses were the engineering noun ("test harness", "eval harness"). The next release flags only the verb ("harness the", "to harness"). After the change, the rule found no hits in this sample.
7. Word discovery against older models and against pre-2023 human prose returned only project vocabulary, because what the work was about changed between August and November. Discovery is therefore off by default (`--discover`).

## Limits

The sample comes from one person's working sessions: one register, mostly one codebase. Model and time are confounded, since each model did different work in a different month, and the skill split separates the user's rules from the model while leaving task differences in place. Read the comparisons as a record of which catalogue rules fire in real use. A general claim about how a model writes needs the fixed-prompt sweep.
