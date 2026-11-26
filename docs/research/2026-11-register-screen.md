# Register screen: 0.10.0 rules against pre-2023 human text

Run 2026-11-25 with `node build-registers.mjs` (about 15 minutes) and `node screen-registers.mjs`. The corpora are gitignored because most of the text is copyrighted. Only counts are recorded here.

## Corpora

All text predates ChatGPT's launch on 2022-11-30.

| Register | Docs | Words | Source and dates |
|---|---|---|---|
| review | 300 | 127,809 | ICLR 2018-2020 reviews (Hugging Face mirror; the OpenReview API served a bot challenge) |
| academic | 296 | 50,265 | arXiv abstracts, mixed fields, 2016 to May 2022 |
| pr | 420 | 86,396 | PR descriptions from six large repositories, 2017-2021 |
| commits | 270 | 15,147 | commit messages with a body, same repositories, 2017-2021 |
| code | 153 | 156,821 | source files from six releases tagged 2020-2021 |
| wiki | 160 | 1,180,507 | English Wikipedia articles as of April-May 2021 |
| fiction | 185 | 602,045 | twelve Project Gutenberg novels, 1818-1902 |
| email | 300 | 52,423 | Enron email bodies, 1999-2001 |

No clean pre-2023 source of LinkedIn-style posts was found, so the `social` profile is unscreened.

## Policy

- Always-on words added in 0.10.0 must not fire on human text more often than the established catalogue does. The bar is the 75th percentile of the pre-0.10.0 words, 0.64 hits per 100k words across the human registers plus `corpus/baseline` (2.18M words). A word above the bar stays only if `corpus/samples` shows it at 5 times its human rate or more.
- Always-on phrase rules follow the same comparison of human and model rates per 100k words.
- Profile rules must fire in fewer than 3% of the human documents of their own register.

## Changes made

- Held (always-on words): `unveiled` (2.34 per 100k, 0 in samples), `surpassed` (1.56, 0), `utilized` and `utilizing` (0.87 each), `garnered` (0.69, 0), `ecosystems` (0.83, 0), `akin` (0.74, 1.4) and `revolutionary` (2.85 against 11.5 in samples, under 5x). Kept despite exceeding the bar: `quietly` (3.36 human, mostly fiction and Wikipedia, against 18.8 in samples).
- Dropped as a per-hit warning: the stacked hedge `could potentially` (1.65 per 100k in human text, 0 in samples). It still counts toward the performed-hedge advisory.
- Kept per-hit: the participial tail (1.24 human against 21.6 in samples) and "Not because X. Because Y." (0.23 against 8.7).
- `review` profile: dropped `compelling` (10 of 300 reviews) and "the authors should consider" (2 of 300, and unsourced). `insightful` (6) and `intriguing` (2) stay.
- `fiction` profile: dropped `muttered` (31 of 185 chapters). `flickered` (4) and `unspoken` (1) stay.
- `code` profile: the history-narration rule now skips version and deprecation notes (Sphinx `versionchanged`, "kept for backwards compatibility"), which fired on two human files.
- `pr`, `commits`, `email`, `academic` and `wiki` profile rules fired in 0 to 2 documents and stay. The PR template-heading rule fired on no human PR.

## Observations for later

- The pre-0.10.0 transition and booster words fire heavily on Wikipedia and reviews: `notable`, `additionally`, `notably` and `furthermore` each appear in 30 to 60 of 160 articles. They are labelled weak alone in the catalogue, and the density tier is the better home for them.
- Emoji fired in 43 of 420 human PR descriptions (check marks and symbols), and the bold-density advisory fired on 13 of 41 long PRs. Both are normal in human PR text, so treat them as weak in that register.
- The em-dash appears in 110 of 160 Wikipedia articles and 147 of 185 novel chapters. It stays a FAIL as house style for typed text, not as evidence about edited or typeset prose.
- Abstracts and commit messages are too short for the rate advisories (3 documents each reached 15 sentences).
