# Email baseline: one writer's sent mail (aggregates only)

Collected 2026-11-25 from one maintainer's Microsoft 365 Sent Items, used with permission. Only aggregate counts are recorded here, and no message text left the local scratchpad. The mailbox's online archive (pre-2023 mail) was not reachable through the Microsoft 365 connector, so every message is from 2026. That means LLM drafting cannot be ruled out, so treat this as a false-positive check for the `email` profile and the typography rules, not as a clean human baseline.

## Corpus

Of 170 sent messages, 54 had at least 15 words of the writer's own text after removing quoted replies, signatures, forwards and calendar responses: 2,827 words, median 29.5 words per message, maximum 513. Only one message reached the 15 sentences the rate advisories need.

## Typography per 1k words

| Feature | Email | corpus/baseline |
|---|---|---|
| em-dash (U+2014) | 0.0 | 4.0 |
| en-dash (U+2013) | 0.7 | |
| spaced hyphen used as a dash | 14.9 (in 32 of 54 messages) | |
| semicolon | 0.7 | 1.9 |
| curly quotes and apostrophes | 17.7 (in 29 of 54 messages) | 1.8 |
| emoji | 1.8 (all one smiley sign-off) | |
| bold | 0.0 | 0.0 |

## What fired

- `email` profile rules: 0 hits.
- Always-on rules: the smart-quote warning (33 hits in 29 messages), emoji (5), two catalogue words used literally (an automotive wiring `harness`, "the `realm` of possibility"), and one advisory (one-sentence paragraphs) on a message made of labelled form fields.

## Conclusions

- The writer never typed an em-dash. Their dash is the spaced hyphen. That supports keeping the em-dash as a FAIL for plain typed text.
- Curly quotes in email come from the composing client. Messages from one client stack had curly apostrophes and messages from another had straight ones, from the same writer. The smart-quote warning is weak evidence in email and in anything pasted from a word processor, so the linter's message now says so.
- The two word hits are the known cost of whole-word matching for literal senses, which is what the allow list is for.
- The email profile produced no false positives on this sample, which is small.
