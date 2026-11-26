# slop-lint

A tiny, zero-dependency linter that flags **AI slop** in prose: the LLM writing tells that make text read like a language model wrote it. It **fails** on the em-dash (as a house-style rule) and on machine artifacts people never type, **warns** on the words, cliches, constructions and layouts that give it away, and prints **advisories** when a document's structure (sentence rhythm, participial tails, three-item lists) falls outside the human range.

It is one file with no dependencies and no required config, and it runs on Node 18+.

```
$ npx github:eric-sabe/slop-lint posts/
posts/launch.md
  3: ✗ em-dash ×1  We built a tool, and honestly, it changed everything
  7: ⚠ word "leverage"
  7: ⚠ "in today's ... world" intro
  9: ⚠ "it's not X, it's Y" negated contrast
  12: ✗ artifact: chatbot referral parameter in a link (utm_source=chatgpt.com)
  ℹ participial clauses at 18 per 100 sentences (> 10); cut ", ensuring/highlighting ..." tails

1 em-dash failure(s), 1 artifact failure(s), 3 warning(s), 1 advisory note(s) across 1 file(s).
FAIL on em-dash and machine artifacts; warnings are prompts to review, not bans; advisories never fail.
```

The repo also ships [`serious-writing`](skills/serious-writing/SKILL.md), a Claude skill that teaches a model to write so this linter finds nothing, plus the craft rules for professional prose that no regex can check. See [The serious-writing skill](#the-serious-writing-skill).

## Why

LLM prose has tells. A few are tokens no person types (chatbot citation markup, `utm_source=chatgpt.com` links). Most are soft: focal words like `delve`, marketing verbs like `leverage`, scene-setting intros, hedge-and-pivot constructions, and structural habits such as uniform sentence length and a participial clause at the end of every other sentence. `slop-lint` separates them:

- Failures (exit code 1): the em-dash and machine artifacts. The em-dash is a house-style rule. As evidence of authorship it is strongest for Claude through Opus 5 and for older OpenAI output; newer models suppress it, so a clean result says nothing about who wrote the text.
- Warnings: words, phrases, constructions, smart quotes, emoji, heading and list layouts. These appear in good human writing too, so the tool flags them for a look and never edits anything.
- Advisories: document-level rates for prose of 15 or more sentences. They never affect the exit code. Structure moves more slowly than vocabulary between model releases, so these age better than word lists.

It is deliberately conservative. The goal is a fast review prompt plus a CI gate on the few tells worth gating on, not an automated style police.

## Usage

No install, straight from npm:

```bash
npx slop-lint .
```

Or as a dev dependency:

```bash
npm i -D slop-lint
npx slop-lint .
```

Or run it straight from GitHub (no npm needed), or copy the single file in:

```bash
npx github:eric-sabe/slop-lint .
# or:
curl -O https://raw.githubusercontent.com/eric-sabe/slop-lint/main/slop-lint.mjs
node slop-lint.mjs .
```

### Examples

```bash
node slop-lint.mjs                      # scan the current directory (recursive)
node slop-lint.mjs README.md docs/      # specific files and/or directories
node slop-lint.mjs --ext .md,.mdx src   # restrict which extensions to walk
node slop-lint.mjs --ignore drafts .    # skip paths containing a substring (repeatable)
node slop-lint.mjs --fail-on-warn .     # strict mode: exit 1 on warnings too
node slop-lint.mjs --quiet .            # only print files that have hits
node slop-lint.mjs --allow tapestry .   # permit a word/phrase for this run (repeatable)
node slop-lint.mjs --config team.json . # read the config from an explicit file
node slop-lint.mjs --profile pr pr.md   # add an opt-in register group (repeatable, or a comma list)
node slop-lint.mjs --code src/          # lint the comments in code files
node slop-lint.mjs --no-rates .         # skip the document-level advisories
git ls-files '*.md' | xargs node slop-lint.mjs   # only tracked markdown
```

### Options

| Flag | Effect |
|---|---|
| `--ext .a,.b` | Extensions to walk in directories (default `.md .markdown .mdx .txt`). |
| `--ignore <substr>` | Skip any path containing this substring. Repeatable. |
| `--fail-on-warn` | Exit 1 on warnings as well as failures. |
| `--quiet` | Only print files that have hits. |
| `--allow <word/phrase>` | Permit a word or phrase for this run. Repeatable; stacks with the config file. |
| `--config <file>` | Read the config from this file instead of `.slop-lint.json`. |
| `--profile <name>` | Enable an opt-in register group (see [Profiles](#profiles)). Repeatable or comma-separated. |
| `--code` | Same as `--profile code`: walk code files too and lint only their comments. |
| `--no-rates` | Skip the document-level rate advisories. |
| `--list` | Print the catalogue grouped by source, with evidence grade, era and profile. |
| `--version` | Print the catalogue version. |
| `--help` | Usage. |

Directories are walked with the extension filter and skip `node_modules .git dist build .next out vendor coverage`. **Files you name explicitly are always linted, regardless of extension.**

Fenced code blocks and inline code spans are skipped by the word, phrase and layout rules, so you can quote a tell in backticks to discuss it. Typography and machine artifacts are checked everywhere.

### Exit codes

- `0` clean (or warnings and advisories only, without `--fail-on-warn`).
- `1` at least one em-dash or machine artifact (or any warning under `--fail-on-warn`).
- `2` bad invocation, an unknown profile, or a broken config file.

## Profiles

Some tells belong to one register and would be false positives elsewhere. Those rules live in opt-in profiles:

| Profile | What it adds |
|---|---|
| `pr` | PR descriptions and commit text: four or more stock template headings, boilerplate test claims, PR-era vocabulary |
| `email` | Stock email openers and closers |
| `social` | LinkedIn-style announcement formulas and engagement-bait closers |
| `fiction` | Creative-writing slop vocabulary and phrases (Antislop) |
| `wiki` | Encyclopedic puffery: notability padding, legacy claims, stock sections |
| `review` | Peer reviews: second-tier praise adjectives, bold tag headers |
| `academic` | Papers: centrality-claim openers, gap formulas, vague "studies have shown", citation clumps |
| `code` | Code files: only comment text is linted, plus comment rules (chat leakage, step narration, history comments, placeholders) |

## Config file

Put a `.slop-lint.json` next to where you run the tool (it is picked up automatically):

```json
{
  "allow": ["tapestry", "robust", "deep dive"],
  "profiles": ["pr"],
  "ignore": ["docs/research"]
}
```

`ignore` works like `--ignore`: directory walks skip any path containing an entry, while files you name explicitly are still linted. This repo's own `.slop-lint.json` ignores `docs/research` and `corpus/`, which hold quoted tells, human baseline text and model samples on purpose.

How `allow` matches: each entry is a word or phrase written as it would appear in prose, and it disables every word/phrase rule that entry triggers, case-insensitively. So you can paste the flagged text from the report verbatim, and an entry like `"rich cultural tapestry"` silences both the phrase pattern and the word inside it. Matching is per catalogue entry: allowing `delve` leaves `delves` and `delving` flagged.

Notes:

- `--config <file>` reads an explicit path instead (the default file is then ignored); `--allow`, `--profile` and `--ignore` add entries on top.
- Typography (em-dash, `--`, smart quotes, emoji) and machine artifacts are never suppressed.
- A missing `.slop-lint.json` is fine (zero-config stays the default); a present-but-broken one stops the run with exit code 2 rather than silently linting without it.

## In CI (GitHub Actions)

```yaml
name: prose
on: [push, pull_request]
jobs:
  slop-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npx github:eric-sabe/slop-lint .
```

## Programmatic use

The file exports its internals, so you can build on it:

```js
import { lintText, readConfig, docRates, WORDS, PHRASES, ARTIFACTS } from "slop-lint";

const { em, artifacts, hits, advisories } = lintText("In today's fast-paced world we leverage synergy.");
// em, artifacts -> failure counts (em-dashes, machine artifacts)
// hits          -> formatted report lines (failures and warnings)
// advisories    -> formatted document-rate notes (never failures)

lintText(text, { allow: ["leverage"], profiles: ["pr"], rates: false });
readConfig(".slop-lint.json");   // -> { allow: [...], profiles?: [...] }, throws if broken
docRates(text);                  // -> raw rates: sentenceCV, participial, tricolon, ...
```

## What it flags

| Kind | What it catches |
|---|---|
| Failures | the em-dash (U+2014), and machine artifacts: ChatGPT citation residue and its Private Use Area delimiters, chatbot `utm_source` and `referrer` parameters on links, Gemini and Grok citation markup, Perplexity upload paths, lenticular source markers, and the chat UI's regenerate-button label. |
| About 225 words | grouped by source, evidence grade and era: the 2023-2024 focal words, their inflections (closed in 0.10.0, since matching is whole-word), the measured PubMed excess vocabulary, peer-review adverbs, marketing buzzwords, and the 2025-2026 staging vocabulary (`load-bearing`, `quietly`, `genuinely`). |
| About 140 phrase and construction rules | intro and closing cliches; assistant leakage (`Certainly!`, knowledge-cutoff disclaimers, `Here is a revised version`); offer-of-help closers, scoped to the last two sentences; puffery (`a poignant reminder`, `despite these challenges`); the 2025-2026 staging moves (`let that sink in`, `here's the kicker`, self-answered fragment questions, `This matters.`, `Full stop.`); the negative-contrast family (`not just X but Y`, `is no longer X. It is Y.`, `Not X. Not Y. Z.`); participial tails; and reply-bot rhetoric (validate-then-restate openers, aphorism molds, corrective anaphora). Constructions split across a soft line break inside a paragraph are caught too. |
| Layout | stock headings ("Key takeaways", "Why it matters"), Title Case on most subheadings, colon-subtitle headings, and runs of three or more bold lead-in bullets. |
| Advisories (documents of 15+ sentences) | uniform sentence length, participial-clause rate, nominalization density, tricolon rate, performed-hedge rate, negative-contrast density, copula avoidance ("serves as a"), bold density, one-sentence-paragraph share, and intensifier density. Each threshold sits at or beyond the most extreme document in the human baseline, set on the repo's own corpus (see `RATE_THRESHOLDS`). |
| Typography warnings | double hyphen as a dash, smart/curly quotes, emoji, and U+202F narrow no-break space. |

The catalogue draws on corpus studies (Kobak et al.'s PubMed excess vocabulary, Liang et al. on peer reviews, Reinhart et al. on grammatical style, Antislop, Geng and Trotta on decline), practitioner catalogues (Wikipedia's "Signs of AI writing", Pangram), and this repo's own corpus discovery and specimen mining. `node slop-lint.mjs --list` prints every group with its provenance. The research behind 0.10.0 is in [`docs/research/`](docs/research/).

## The serious-writing skill

[`skills/serious-writing/`](skills/serious-writing/) is a Claude skill with two jobs: write so this linter reports nothing, and write professional prose a cold expert reader can act on. It has three tiers:

1. Every output (chat, files, commits, PR bodies, code comments): the linter contract, typography, the structural tells no regex sees, functional hedging, and a pre-send procedure that ends with a lint run.
2. Professional deliverables (design docs, reports, proposals, READMEs, papers): twelve commandments, each with a test the writer runs on its own draft, plus rules for checking facts and sources.
3. References: `academic.md` (introductions, related work, scope drift, citations, peer reviews), `registers.md` (email, social, PR, commit, code comments, wiki), and `catalogue.md`.

`references/catalogue.md` is generated from `slop-lint.mjs` by `npm run skill`, and a test fails when it is stale, so the skill's ban list cannot drift from the linter. Another test lints the skill under every profile and requires it to name the current catalogue version, so a catalogue bump forces a skill review.

To install it for Claude Code, link the folder into your skills directory:

```bash
ln -s "$(pwd)/skills/serious-writing" ~/.claude/skills/serious-writing
```

## Keeping the catalogue current

Tells are a moving target: each model family brings new ones, and old ones fade as models are trained against them, or when a vendor edits a system prompt. So the catalogue is **sourced, versioned and labelled**, and there are tools to keep it honest.

- Sourced + versioned + labelled. Every word and phrase group carries a `since` version, a `source`, an `evidence` grade (M1 large study, M2 weaker measurement, P practitioner consensus, A anecdote), and where known an `era`. Fading tells get an era label rather than deletion, because older models stay in use. [`CHANGELOG.md`](CHANGELOG.md) records what changed and when.
- Screened against human prose. A group marked `screened` must have zero hits on `corpus/baseline`, and a test re-runs that screen, so rebuilding the baseline re-screens the catalogue. The baseline keeps paragraph breaks, so line-start, paragraph and heading rules are screened against real structure.
- Find new tells by measuring, not guessing. `--discover` compares word and bigram frequency in model output against a human baseline and ranks the over-represented, not-yet-catalogued tokens. This is how `delve` was found; re-run it against each new model's output.

  ```bash
  slop-lint --discover --samples corpus/samples --baseline corpus/baseline
  ```

  Both `--samples` and `--baseline` take a comma-separated list of folders, so a model can be compared against a human baseline or against the **pool of other models** on the same prompts (that model's signature, with topic held constant). The model-vs-pool comparison is the more reliable one. A `--min-docs` floor (default 3) requires a candidate to recur across multiple answers; frontmatter is ignored.
- Generate the samples instead of pasting them. `generate-samples.mjs` sends a fixed, genre-varied prompt set ([`prompts.json`](prompts.json)) to each model in [`models.json`](models.json) and writes `corpus/samples/<model>/`. This is a local task (it needs API keys, which never touch CI); commit the result and the sweep mines it keyless. Record the client and system prompt with each sample set: in 2026 a maintainer reported that `load-bearing`, a spiking tell, also appears in a coding client's built-in prompt.

  ```bash
  node generate-samples.mjs --dry-run    # what would run, no API calls
  node --env-file-if-exists=.env generate-samples.mjs   # generate for every model whose key is set
  ```

  Set the model versions in `.env` (`XAI_MODEL`, `ANTHROPIC_MODEL`, etc.; copy `.env.example`). See [`corpus/README.md`](corpus/README.md).
- Build the human baseline with `npm run baseline` (`build-baseline.mjs`): modern, permissively licensed prose across three registers, with paragraph breaks kept: US presidential addresses (public domain, oratory), NIH MedlinePlus health summaries (public domain, plain explainer), and Wikinews (CC BY, journalism). The strongest baseline is a large body of your own contemporary typed prose, which would also sharpen the em-dash and email/social rules.
- Grow the structural rules from specimens. Word-frequency discovery cannot see the reply-register tells, so those are collected as specimens in [`corpus/specimens/`](corpus/specimens/) and turned into `PHRASE_GROUPS` rules by hand: draft the narrowest regex that captures the shape, screen it against `corpus/baseline` to zero false positives, and require two independent sightings before it ships. One-sighting molds wait in [`PENDING.md`](corpus/specimens/PENDING.md). `npm run specimens` reports coverage; `npm run specimens -- <harvest.txt>` triages freshly harvested text and flags second sightings of pending molds.
- Measure typography and structure with `npm run stats` (`corpus-stats.mjs`): em-dash, smart-quote, semicolon, ellipsis and bold rates, plus the mean sentence-length variation, participial, nominalization and tricolon rates per corpus folder. This is where a new rate rule gets prototyped before it moves into the linter.
- Screen against registers with `node build-registers.mjs` then `node screen-registers.mjs`: it downloads pre-2023 human reviews, abstracts, PR descriptions, commits, code, Wikipedia, fiction and email into the gitignored `corpus/registers/` and reports every rule hit by register, so a profile rule can be checked against its own register before it ships.
- A monthly sweep does this for you. `.github/workflows/catalogue-refresh.yml` runs `refresh.mjs` on a schedule, with no secrets: it combines corpus discovery with a coverage diff against the public Wikipedia "Signs of AI writing" essay, and files the candidates as a GitHub issue to review.

Accepting a candidate means adding it to `WORD_GROUPS` or `PHRASE_GROUPS` with a source and evidence grade, screening it, noting it in `CHANGELOG.md`, bumping the version, running `npm run skill`, and reviewing the skill. Keep the conservative bias: no tell enters without a source.

## Releasing (maintainer)

Publishing is automated. One-time setup: create an npm **Automation** access token and add it as the repo secret `NPM_TOKEN` (Settings > Secrets and variables > Actions). Then:

```bash
npm version patch   # or minor/major: bumps package.json + creates a git tag
git push --follow-tags
```

The `publish` workflow runs the tests and `npm publish` on the new `v*` tag. To publish the current version without a new tag, run the workflow manually (Actions > publish > Run workflow). The catalogue version in `slop-lint.mjs`, the changelog and the skill are maintained by hand alongside the bump; the tests fail if they disagree.

## Contributing

Issues and PRs welcome, especially new tells with a source, and false positives worth pruning. Keep it dependency-free and a single file.

## License

[MIT](LICENSE).
