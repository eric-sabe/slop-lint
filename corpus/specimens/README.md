# Specimens: the reply-register corpus

`corpus/samples` holds long-form model output for `--discover`. This folder holds the
other register: **AI-generated social comment replies** ("reply bots"), where the tells
are structural, not lexical. Word-frequency discovery cannot see these; they are
constructions - validate-then-restate openers, standalone aphorism molds, modal
antitheses - so they are collected as specimens and turned into `PHRASES` rules by hand.

## Format and provenance

One specimen per line (blank lines separate them), collected from observed reply threads.
Specimens are committed as **content-swapped skeletons**: the sentence structure is kept
word-for-word, but topic nouns/verbs are replaced (leadership-speak becomes cooking or
beekeeping). Two reasons: the original comments are other people's posts, and swapping the
content words is itself the test - a structural rule that stops matching after a noun swap
was matching content, not structure. Typographic artifacts observed in the originals
(curly-quote paste seams, missing final punctuation, the word-crash seams left by
stripping em-dashes) are preserved, since those are tells in their own right.

## How a mold becomes a rule

The workflow, mirroring `--discover`'s empirical bias:

1. **Collect.** Add new specimens here (as skeletons, per above). Run `npm run specimens`
   to see which lines the current catalogue already trips on and which are uncaught.
2. **Draft.** For an uncaught line, write the narrowest regex that captures the *shape*:
   anchor on function words (articles, modals, "nobody ... they"), demand the echo with a
   backreference where the mold repeats a verb, and anchor `^` for reply-position openers.
   Content words in a rule are a smell.
3. **Screen.** Run the rule over `corpus/baseline` - the target is **0 false positives**.
   The baseline's oratory register is a deliberately hard test: presidential speeches are
   professional antithesis, and they have already killed one loose draft. Also run it over
   `corpus/samples`; a hit there is corroboration in a second register, worth noting in
   the rule's group comment.
4. **Recur or wait.** A mold needs **two independent sightings** before it enters the
   catalogue (the document-frequency floor, applied by hand). One sighting goes to
   [PENDING.md](PENDING.md) with its date; promote it when it shows up again.
5. **Ship.** Add the rule to `PHRASES` under a sourced group comment, add a positive and a
   negative test, note it in `CHANGELOG.md`. The `test/` suite enforces a coverage floor
   over this folder, so a rule regression shows up as a failing test.

Aphorism molds are an open set; chasing every one-off epigram would bloat the catalogue
with dead rules. The recurrence bar keeps the pace honest, and the coverage report keeps
the misses visible instead of forgotten.
