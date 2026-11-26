# Changelog

Notable changes to the slop-lint tool and its tell catalogue. Format roughly follows
[Keep a Changelog](https://keepachangelog.com/); the package version and the catalogue
version move together.

## [Unreleased]

### Changed

- **The monthly refresh issue lists only new items.** `refresh.mjs` expands Wikipedia's
  template wording ("...in the provided/available sources...") before testing it
  against the catalogue, and skips items recorded in the new
  `corpus/refresh-reviewed.json` (34 decisions from the 0.10.0 review). The workflow
  files an issue only when something is new and closes the previous one. Against
  0.10.0, 8 of 92 Wikipedia items are new, down from 46.
- **Corpus discovery is opt-in** (`node refresh.mjs --corpus`) and keeps only words found
  in at least a quarter of the sample prompts. The corpus is static, so the monthly
  table repeated the same prompt-topic words ("coffee", "jazz", "silk road") each month.

## [0.10.0]

Sourced from a five-track research pass (2026-11-25) over corpus studies, stylometry,
academic-register studies, practitioner catalogues and writing-craft sources. The report
and its notes are in `docs/research/`. The theme: vocabulary and typography change within
a release cycle, while structure moves slowly, so this release spends most of its effort
on scopes and rates.

### Added

- **Machine-artifact failures.** A new `ARTIFACTS` group fails the run (exit 1) and is
  never suppressible: ChatGPT citation residue (content-reference and search-turn markers,
  `attributableIndex`, the Private Use Area delimiters U+E200-E202 and U+EA01-EA02, run-together image markers), chatbot referral
  parameters on links (`utm_source=chatgpt.com` and kin, `referrer=grok.com`), Gemini cite
  and span markers, Grok citation cards, Perplexity upload paths, lenticular source
  markers, and the chat UI's regenerate-button label. The bar is one documented sighting
  plus zero baseline hits, because these are tokens nobody types, not style.
- **110 words.** Inflections of catalogued stems that whole-word matching missed (25 are
  on Kobak et al.'s excess-word list by name, such as `delved`, `underscored`, `fostering`,
  `harnessing`, and are graded M1; the rest are graded like their stems; `elevated` is on
  the list but held as routine clinical wording); measured excess vocabulary (`elucidate`,
  `unveil`, `burgeoning`, `interplay`, `nuanced`, peer-review adverbs such as `aptly` and
  `methodically`); the 2025-2026 staging vocabulary (`load-bearing`, 0.5 to 12.0 hits per
  10k words across one user's Opus 4.6 and 4.7 sessions; `quietly`; `genuinely`); and opt-in groups
  for reviews, PR text and fiction.
- **75 phrase rules** (43 always on, 32 in profiles): assistant leakage and openers
  (`Certainly!`, knowledge-cutoff and capability disclaimers, "Here is a revised
  version"); offer-of-help closers scoped to the last two sentences; puffery ("a poignant reminder", "the complex interplay", "faced numerous challenges":
  Pangram's February 2025 post puts five such phrases at 21,000x to 49,000x the human
  rate, with no stated corpus; the "despite these challenges" and "focal point" forms
  rest on Wikipedia); the 2025-2026 staging moves ("let that sink in",
  "read that again", "here's the kicker", self-answered fragment questions, "Honestly?",
  "earns its keep", "doing a lot of work", "This matters.", "that's the whole point",
  "Full stop."); the rest of the negative-contrast family ("Not because X. Because Y.",
  "Not X. Not Y. Z.", "The question isn't X. The question is Y.", "is no longer X. It is
  Y." promoted from PENDING, "You're not X. You're Y."); the participial tail; stacked
  hedges; and "experts argue" attribution.
- **Wikipedia words-to-watch rules, contributed by @malcollmhollmes in #9** (issue #8):
  advice disclaimers ("I cannot offer medical advice"), retrieval leakage ("in the
  provided sources"), "based on available information", "while specific details are
  limited", "not widely documented", "marks a broader shift", the "up to my last
  training cutoff" form of the knowledge-cutoff rule, and "does not by itself establish"
  in the `wiki` profile only (it stays held elsewhere; see below).
  Screened here against the 2.3M-word register corpora; "not widely available" and
  "does not necessarily establish" were dropped as ordinary English.
- **Profiles** (`--profile`, or `"profiles"` in `.slop-lint.json`): `pr`, `email`,
  `social`, `fiction`, `wiki`, `review`, `academic`, `code`. Register-bound tells live
  there so they cost nothing elsewhere. "studies have shown" ships in `academic` only,
  because MedlinePlus says it.
- **Code-comment mode** (`--code` = `--profile code`): walks code files, lints only their
  comment text (string literals are skipped), and adds comment rules for chat leakage,
  step narration, history narration and placeholders.
- **Layout rules**: stock headings, Title Case on 60%+ of 3+ subheadings, colon-subtitle
  headings on 40%+, runs of 3+ bold lead-in bullets, and (with `pr`) 4+ PR template
  headings.
- **Cross-line matching**: phrase rules also run on each paragraph joined across soft line
  breaks, reported once with "(across lines)". The uncontracted "A isn't the X. It is the
  Y." rule now anchors at any sentence start inside a paragraph, not only at line start.
- **Rate advisories** (`ℹ`, documents of 15+ sentences, never failing; `--no-rates` turns
  them off): sentence-length variation, participial clauses, nominalization density,
  tricolons, performed hedges, negative-contrast density, copula avoidance, bold density,
  one-sentence-paragraph share and intensifier density. Thresholds were calibrated on 53
  human baseline documents against 96 model answers so each sits at or beyond the human
  extreme. On that corpus the advisories fire 3 times on human documents and 203 times on
  model answers. `docRates()` and `RATE_THRESHOLDS` are exported; `npm run stats` now
  prints the structural means.
- **Metadata**: every group carries an evidence grade (M1, M2, P, A), and many carry an
  era. `--list` prints them. Older tells are labelled, not deleted.
- **The serious-writing skill** (`skills/serious-writing/`), which replaces the separate
  no-ai-tells and serious-academic skills. Its `references/catalogue.md` is generated by
  `npm run skill` (`build-skill.mjs`), and tests fail when it is stale, when the skill does
  not name the current catalogue version, or when any skill file lints dirty.
- U+202F narrow no-break space warning.
- `"ignore"` in `.slop-lint.json`: path substrings skipped on directory walks, like
  `--ignore`. The repo's own config ignores `docs/research` and `corpus/` (quoted tells and test
  data), so `slop-lint .` at the repo root passes.

### Changed

- **Em-dash rationale.** The FAIL stays, as house style. The claim that it is the "one
  near-decisive tell" is gone: Wikipedia now files it under historical indicators, and
  The Economist (July 2026) found only Claude still uses more em-dashes than human
  writers. The repo corpus agrees (Claude 7.4 and Grok 7.1 per 1k words, GPT 2.1, human
  baseline 4.0).
- **Fenced code blocks and inline code spans are skipped** by word, phrase and layout
  rules, so a tell can be quoted in backticks. Typography and artifacts are still checked
  everywhere.
- **Baseline keeps paragraphs.** `build-baseline.mjs` writes blank-line-separated
  paragraphs (speeches had been flattened to one line per file), so line-start,
  paragraph and heading rules are screened against real structure. Groups marked
  `screened` must have zero baseline hits, and a test enforces it.
- `lintText` also returns `artifacts` and `advisories`; `WORDS` is now the always-on list
  and `ALL_WORDS` includes profile groups. `PHRASES` remains a flat list, derived from
  the new `PHRASE_GROUPS`.
- `corpus-stats.mjs` no longer calls semicolons a generator signal: three of four model
  samples use fewer than the human baseline.

### Notes

- Every 0.10.0 source was checked against its primary source after drafting
  (`docs/research/2026-11-verification-*.md`: 88 verified, 32 partly right, 2
  contradicted, 1 not found). The fixes are in this release: wider artifact and
  revision-leakage regexes, the inflection group split by evidence, "frankly",
  "commendably", "is the currency of" and a fiction phrase dropped for want of a
  source, the review-profile group downgraded to anecdote, and corrected numbers in the
  skill (the 4.85x overgeneralization figure compares against expert summaries, the
  rebuttal-chain finding reverses in one of its two corpora).
- A register screen against 2.4M words of pre-2023 human text (reviews, abstracts, PRs,
  commits, code, Wikipedia, fiction, email; `build-registers.mjs`, `screen-registers.mjs`,
  results in `docs/research/2026-11-register-screen.md`) held seven words that fire on
  human text more than the established catalogue does, dropped the stacked-hedge warning,
  trimmed the review and fiction profiles, and taught the code history rule to skip
  version and deprecation notes. A rule may carry an `unless` pattern for such cases.
- An email check against one maintainer's 2026 sent mail (aggregates only,
  `docs/research/2026-11-email-baseline.md`) found no em-dashes, no email-profile hits,
  and curly quotes that track the mail client, so the smart-quote warning now says it is
  weak alone.
- Held, with reasons in `corpus/specimens/PENDING.md`: bare "honestly", "frankly", "potent",
  "amidst" and "unprecedented" (baseline hits), the GPT-5.6-era "does not by itself
  establish" disclaimers outside `wiki` (they conflict with careful academic claim sizing), unlabelled
  PR-corpus jargon, and five new one-source molds now mirrored in `PENDING_MOLDS`.
- Measured evidence for 2025-2026 models is thin and mostly M2. No study retired any
  entry, so nothing was deleted.

## [0.9.1]

### Fixed

- **CLI now runs under `npx` and any `bin` symlink.** The direct-invocation guard
  compared `import.meta.url` against `process.argv[1]` verbatim. When Node launches the
  tool through a symlink - which is how `npx slop-lint`, `npx github:eric-sabe/slop-lint`,
  and a package `bin` install (`node_modules/.bin/slop-lint`) all run it - `argv[1]` is
  the symlink path, so the comparison failed, `main` never ran, and the process printed
  nothing and exited 0 (a file with an em-dash passed). The guard now resolves `argv[1]`
  with `realpathSync` before comparing, so the CLI runs whether invoked directly or
  through a link. A test invokes the CLI through a symlink on a temp file with an em-dash
  and asserts exit code 1. The `exports`-based `import` path is unaffected.
- **Reconciled the package version with the catalogue version.** `package.json` was still
  `0.8.0` while the CLI reported `0.9.0`; both now move together at `0.9.1`.

## [0.9.0]

### Added

- **Allow-list config file.** Some content legitimately needs a catalogued word or phrase
  (a product named Tapestry, docs that must say "robust"). A `.slop-lint.json` in the
  working directory - `{ "allow": ["tapestry", "robust", "deep dive"] }` - is read
  automatically; `--config <file>` reads an explicit path instead, and a repeatable
  `--allow <entry>` flag adds one-offs on top. Each entry is written as it would appear
  in prose and disables every word/phrase rule its text triggers (case-insensitive), so
  flagged text can be pasted verbatim. Matching is per catalogue entry: allowing "delve"
  leaves "delves"/"delving" flagged. The typographic tells (em-dash, `--`, smart quotes,
  emoji) are never suppressed. A broken config stops the run with exit code 2; a missing
  one is fine, so zero-config stays the default. Programmatic: `lintText(text, { allow })`
  and a new `readConfig(path)` export.
- **23 structural phrase rules for AI comment-reply rhetoric.** Sourced from reply-bot
  specimens collected off social comment threads (two passes: pasted specimens, then a
  live feed-mining session), where the tells are constructions, not vocabulary.
  Validate-then-restate openers ("That is/That's the distinction.", "what you're
  describing / what you described", "you're right that", the "a sharp addition/point"
  compliment-open); contrast machinery (the uncontracted negated contrast "The danger
  isn't the X. It is the Y.", the noun-subject "X isn't the A, it's B", "doesn't X, it
  just Y", the "can X ... can't X" modal antithesis with a verb-echo backreference,
  "the real question/test" pivot, the "a tech problem, a change-management one" echo);
  aphorism molds ("is what keeps A from becoming B", "is measured by how", "as a
  hypothesis, not a promise", "lowers X without lowering Y", "True X requires/lies in",
  "the most important form of", "the uncomfortable question/truth", "will be those who"
  superlative prediction, "as an X rather than a Y" reframe); plus the "Which
  means/might" fragment opener, clause-initial "worth noting", and corrective anaphora
  with a verb echo ("nobody polices X, they police Y" / "don't mark X, they mark Y").
  Also widened 0.1.0's "not just X, but Y" to the "don't/doesn't just" forms, and added
  the words "resonated"/"resonating" (the "this really resonated" validate-open;
  inflection completion of 0.1.0's "resonate").
- **The specimen corpus and mold workflow.** New `corpus/specimens/` holds the
  reply-register specimens (as content-swapped skeletons: structure kept word-for-word,
  topic nouns replaced), `npm run specimens` (`specimen-coverage.mjs`) reports which lines
  the catalogue trips on and which are uncaught, and one-sighting molds wait in
  `corpus/specimens/PENDING.md` behind a two-independent-sightings bar (the
  document-frequency floor, applied by hand). Triage mode
  (`npm run specimens -- <harvest.txt>`) is the mining step: point it at freshly
  harvested comment text and it reports catalogue hits, pending-mold second sightings
  (via the `PENDING_MOLDS` mirror of PENDING.md), and uncaught candidate lines. In its
  first live run over a 21-comment feed thread it caught 11 of 28 lines and confirmed
  three shipped rules against unseen data ("you're describing" fired on its third
  independent thread). Every rule was screened against
  `corpus/baseline` to 0 false positives across ~60k words of oratory/explainer/
  journalism; the screen earned its keep twice - a loose negated-contrast draft fired on
  presidential speeches at the same rate as on model output (fixed by requiring an
  article after the negation, which also spares docs prose like "this field is not
  required. It is optional"), and a loose can/can't draft hit a MedlinePlus conditional
  ("If you cannot get...", fixed by excluding subordinators). Two rules are corroborated
  in `corpus/samples` ("Kyoto is not just a checklist of temples. It is a place...";
  "That's the promise we pour into every cup."). Specimen coverage: 15 of 16 lines
  flagged; a coverage-floor test guards against rule regressions.

## [0.8.0]

### Changed

- **Baseline is now three modern registers**, not just oratory (Perplexity-scouted, then
  endpoint-verified). `build-baseline.mjs` pulls: US presidential addresses (public domain,
  oratory), **NIH MedlinePlus** health summaries (public domain, plain-language explainer),
  and **Wikinews** (CC BY, journalism). All keyless and modern (~60k words).
- The plain explainer + journalism registers lowered the baseline's curly-quote rate to
  ~1.9 per 1k words, so GPT/Grok (~9) stand out ~4.7x - the smart-quote tell is now robustly
  validated. Claude/Grok also em-dash above this human baseline (7.x vs 4.2).

### Notes

- Sources evaluated and rejected: Federal Register (keyless, but jargon-dense regulatory
  boilerplate full of model numbers - bad prose); Voice of America (public domain, but no
  clean keyless API); SCOTUS (full text unreliable via free APIs). The honest constraint
  stands: genuinely casual modern prose is almost all copyrighted, so the best baseline you
  can add is your own contemporary writing.
- Even against the broader baseline, the vs-human word pass surfaced no new tells (only
  common words like "modern"/"rather"), so no catalogue change. The linter is unchanged.

## [0.7.0]

### Changed

- **Baseline is now modern public-domain US-government prose.** `build-baseline.mjs` pulls
  presidential State of the Union and Inaugural addresses (Ford..Biden, ~70k words) from
  Wikisource - public domain and contemporary, replacing the dated literary / CC-BY mix.
  This fixes the dated-vocabulary problem: the vs-human word comparison no longer throws up
  artifacts (e.g. "create" at 206x), and it sharpened the smart-quote signal - against the
  modern baseline (3.4 curly quotes per 1k words) GPT and Grok clearly stand out at ~9.

### Notes

- Supreme Court opinions were attempted (the request included them) but dropped: full text
  is unreliable via the free APIs (CourtListener lacks ingested text for many opinions;
  Wikisource transcludes opinions into subpages the extract API misses), and legalese is
  citation-noisy for a prose baseline. Speeches give a cleaner modern reference.
- Even with the modern baseline, the vs-human word pass surfaced no strong uncatalogued
  tells (only low-ratio common words like "often"/"modern"), confirming the catalogue
  already covers the obvious word tells. The em-dash stays ~5/1k even in oratory, so it
  remains a tell of plain typed text. Cross-model remains the most reliable signal.

## [0.6.0]

### Added

- **Smart/curly-quote warning.** Curly quotes and apostrophes (`“” ‘’`) are flagged as a
  generator/word-processor tell. Found empirically: three of four frontier models emit them
  in markdown output (GPT and Grok ~9 per 1k words) while one uses straight quotes.
- **`build-baseline.mjs`** (`npm run baseline`): assembles a human reference corpus for
  `--discover` from permissive sources - English Wikinews (CC BY 2.5) and public-domain
  Project Gutenberg books - with a `corpus/baseline/SOURCES.md` attribution file. Replaces
  the toy placeholder baseline (~43k words across 19 files).
- **`corpus-stats.mjs`** (`npm run stats`): punctuation/structure rates per corpus folder
  (em-dash, smart quotes, semicolons, ellipses, bold), surfacing typographic tells that
  the word-based `--discover` cannot see (e.g. GPT and Grok emit ~9 curly quotes per 1k
  words; Claude emits none).

### Notes

- Measuring punctuation against the baseline corrected an assumption: literary/typeset
  human prose (our Gutenberg baseline) uses the em-dash, curly quotes, and semicolons
  *heavily* too (~7, ~33, ~4 per 1k). So the em-dash is a tell of **plain modern typed
  text** (posts, email, markdown) - slop-lint's target - not of prose in general. The
  hard-fail stands for that target; the corpus does not "prove" it against literary prose.
- With a real (but partly dated, partly literary) baseline, the vs-human word comparison
  improved yet remains register-dominated (older prose under-uses modern words like
  "create"), so the reliable signal is still cross-model. A larger contemporary,
  plain-prose, genre-matched baseline would sharpen vs-human further.

## [0.5.0]

### Added

- **`incredibly`** to the catalogue, the first add sourced from this repo's own corpus
  discovery: one frontier model over-used it (in 7 of 24 answers) vs its peers on identical
  prompts. Source tagged `empirical: cross-model corpus discovery`.
- A real generated corpus under `corpus/samples/<model>/` (four current frontier models,
  24 prompts each) replaces the toy sample as the discovery input.

### Changed

- `--discover` is hardened against two artifacts the first real run exposed:
  - **Frontmatter is stripped** before tokenizing, so YAML keys (`model`, `prompt_id`)
    no longer rank as tells.
  - **Document-frequency floor** (`--min-docs`, default 3): a token must appear across
    multiple sample documents, which drops one-off artifacts (e.g. an invented product
    name repeated within a single answer) and keeps recurring style tells. The candidate
    report now shows a `docs` column.

### Notes

- Cross-model comparison (each model vs the pool of the others on the same prompts) is the
  reliable signal today, because topic is held constant. The vs-human comparison needs a
  larger, genre-matched human baseline to be trustworthy; the committed `corpus/baseline`
  is still a small placeholder.

## [0.4.1]

### Changed

- Model versions are now read from env vars (`ANTHROPIC_MODEL`, `OPENAI_MODEL`,
  `GEMINI_MODEL`, `XAI_MODEL`), so you bump a model version in `.env` without editing
  `models.json` or any code. `models.json` keeps the env-var name (`modelEnv`) and a
  fallback default. Added `.env.example` with the key and model vars.
- OpenAI adapter uses `max_completion_tokens` (required by gpt-5.x), and the default token
  budget is raised to 4000 so reasoning models leave room for a full-length answer.

## [0.4.0]

### Added

- **Sample generation harness.** `generate-samples.mjs` sends a fixed, genre-varied prompt
  set (`prompts.json`) to each model in `models.json` (Anthropic, OpenAI, Google, xAI; raw
  `fetch`, zero-dependency) and writes `corpus/samples/<model>/`. Key-gated and local-only
  (a model whose key env var is unset is skipped), so API keys never touch CI. Supports
  `--dry-run`, `--only`, and `--max`.
- **Per-model corpus + model-vs-pool comparison.** Samples live under
  `corpus/samples/<model>/`, and `--discover` now accepts a comma-separated list of folders
  for `--samples` / `--baseline`. Since every model answers the same prompts, a model can be
  compared against the pool of other models with topic held constant (its style signature),
  in addition to the model-vs-human comparison.

### Notes

- The committed `corpus/samples/example-llm` and `corpus/baseline` are illustrative only;
  generate real samples (and use a genre-matched human baseline) for real signal.

## [0.3.0]

### Added

- First reviewed pass from the catalogue-refresh sweep (sources: the Wikipedia "Signs of
  AI writing" essay plus practitioner blacklists). New words: bolster(s/ed/ing),
  groundbreaking, renowned, exemplifies, encompassing, enhance(s/d/ing), innovative,
  streamline(s/d) / streamlining, actionable, nestled. New phrases: "as an AI/large
  language model" and "I hope this helps" (assistant leakage), "in the heart of",
  "a diverse array of", "valuable insights", "stands/serves as a testament", "setting
  the stage for", "indelible mark", "deeply rooted in", "rich cultural heritage/tapestry".

### Changed

- `refresh.mjs` coverage check now also considers existing phrase rules, so candidates
  already covered by a `PHRASES` pattern (e.g. "in conclusion") are no longer reported.

### Rejected (kept out to avoid false positives)

- Words too common in ordinary writing to gate on: crucial, such as, overall, rich,
  featuring, align with, commitment to, ensuring, refers to.

## [0.2.0]

### Added

- **Sourced catalogue.** Words are grouped in `WORD_GROUPS`, each carrying a `since`
  version and a `source`, so entries can be pruned with confidence as tells fade.
  `slop-lint --list` prints the catalogue with its sources.
- **`--discover` mode.** Frequency analysis (words and bigrams) of model-output samples
  against a human baseline corpus; ranks over-represented, not-yet-catalogued tokens as
  candidate new tells. This is how the original "delve" tell was found, and it re-runs
  against each new model's output. Example corpus under `corpus/`.
- **`--version` flag** and an exported `VERSION` constant.
- **Self-contained monthly catalogue refresh.** `refresh.mjs` assembles candidates from
  corpus discovery plus the public Wikipedia "Signs of AI writing" essay (coverage diff),
  and `.github/workflows/catalogue-refresh.yml` files the report as a GitHub issue for
  human review. No secrets or external services.

### Notes

- Catalogue content is unchanged from 0.1.0; this release adds provenance and the tooling
  to keep the list current as models evolve.

## [0.1.0]

### Added

- Initial release. Em-dash hard-fail (exit 1) plus warnings on ~60 focal/marketing words,
  ~35 cliche phrases and constructions, double-hyphen em-dash substitutes, and emoji.
  Single-file zero-dependency CLI, importable exports (`lintText`, `walkFiles`, `WORDS`,
  `PHRASES`), tests, and CI.
