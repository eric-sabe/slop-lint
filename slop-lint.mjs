#!/usr/bin/env node
/**
 * slop-lint - guard prose against LLM tells ("AI slop"). Portable, zero-dependency,
 * single file.
 *
 * Drop this into any project (copy it to scripts/ or tools/) and run it on your
 * text. No install, no config required - only Node 18+.
 *
 *   node slop-lint.mjs                      # scan the current directory (recursive)
 *   node slop-lint.mjs README.md docs/      # lint specific files / directories
 *   node slop-lint.mjs --ext .md,.mdx src   # restrict which extensions to walk
 *   node slop-lint.mjs --ignore drafts      # skip paths containing a substring (repeatable)
 *   node slop-lint.mjs --fail-on-warn .     # exit 1 on warnings too (strict CI mode)
 *   node slop-lint.mjs --quiet .            # only print files that have hits
 *   node slop-lint.mjs --allow tapestry .   # permit a word/phrase for this run (repeatable)
 *   node slop-lint.mjs --config team.json . # read the allow list from an explicit file
 *   node slop-lint.mjs --profile pr body.md # add an opt-in register group (repeatable)
 *   node slop-lint.mjs --code src/          # lint comments in code files (= --profile code)
 *   node slop-lint.mjs --no-rates .         # skip the document-level rate advisories
 *   node slop-lint.mjs --version            # print the catalogue version
 *   node slop-lint.mjs --list               # print the catalogue with its sources
 *   git ls-files '*.md' | xargs node slop-lint.mjs     # lint tracked markdown
 *
 * Tells fade as models train against them and new ones appear with each release, so
 * the catalogue is sourced, versioned, and labelled by era and evidence (see
 * CHANGELOG.md). Find candidate new tells empirically with --discover (see below).
 *
 * Allow list (optional): some content legitimately needs a catalogued word or phrase
 * (a product named Tapestry, a doc that must say "robust"). Put those in a
 * `.slop-lint.json` next to where you run the tool:
 *   { "allow": ["tapestry", "robust"], "profiles": ["pr"] }
 * Each allow entry disables every word/phrase rule its text triggers, so you can paste
 * the flagged text verbatim. Typographic tells (em-dash, "--", smart quotes, emoji) and
 * machine artifacts are never suppressed.
 *
 * Severity, deliberately conservative (most of these words and shapes also appear in
 * good human writing, so false positives are the main risk):
 *   FAIL (exit 1): the em-dash (U+2014), as a house-style rule. As an authorship signal
 *                  it is strongest for Claude through Opus 5 and for older OpenAI output;
 *                  newer models suppress it, so a clean result says nothing about
 *                  authorship. Also FAIL: machine artifacts that people never type
 *                  (chatbot citation residue, chatbot utm_source links, UI leakage).
 *   WARN:          words, phrases, constructions, layout rules. Flagged for a look,
 *                  never auto-removed.
 *   ADVISORY (i):  document-level rates (sentence rhythm, participial tails,
 *                  nominalizations, tricolons, ...) for prose of 15+ sentences. Printed,
 *                  never counted toward the exit code. Structure moves slower than
 *                  vocabulary between model releases, so these age better than word lists.
 *
 * Fenced code blocks and inline code spans are skipped by the word, phrase and layout
 * rules (quote a tell in backticks to discuss it); typography and artifacts are
 * checked everywhere.
 */

import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from "node:fs";
import { join, sep, extname } from "node:path";
import { pathToFileURL } from "node:url";

export const VERSION = "0.10.0";

// Opt-in register groups. A WORD_GROUPS / PHRASE_GROUPS entry with a `profile` only
// runs when that profile is enabled (--profile, or "profiles" in .slop-lint.json).
export const PROFILES = {
  pr: "pull-request descriptions and commit text: template headings, boilerplate test claims, PR-era vocabulary",
  email: "email: stock openers and closers",
  social: "social posts (LinkedIn-style): announcement and engagement-bait formulas",
  fiction: "fiction: creative-writing slop vocabulary (Antislop)",
  wiki: "encyclopedic prose: notability padding, legacy puffery, stock sections",
  review: "peer reviews: second-tier praise adjectives, bold tag headers",
  academic: "papers: centrality-claim openers, gap formulas, citation clumps",
  code: "code files: lint comments only, plus code-comment rules (chat leakage, step narration, history comments, placeholders)",
};

// Catalogue, grouped by provenance. Each group carries the version it was added in,
// its source, an evidence grade, and (where the record shows one) the era in which the
// tell peaked, so the list can be pruned or demoted with confidence as tells fade.
// Evidence: M1 = large corpus or controlled study; M2 = measured but weaker (one corpus,
// vendor counts, unlabelled clusters); P = independent practitioner reports; A = anecdote.
// `screened` records the date a group last passed the false-positive screen (zero hits on
// corpus/baseline/**/*.txt); a test re-runs it, so a baseline rebuild re-screens them.
// Edit a group, record the change in CHANGELOG.md, and bump the version.
export const WORD_GROUPS = [
  {
    since: "0.1.0",
    source: "FSU 'delve' focal-word study; PubMed 135-term analysis",
    evidence: "M1",
    era: "GPT-3.5/4 (peak 2023-2024; declining on arXiv since spring 2024, Geng & Trotta)",
    words: [
      "delve", "delves", "delving", "intricate", "intricately", "commendable",
      "meticulous", "meticulously", "underscore", "underscores", "underscoring",
      "pivotal", "paramount", "unwavering", "surpass", "surpasses", "showcase",
      "showcases", "showcasing", "boast", "boasts", "tapestry", "realm", "resonate",
      "resonates", "testament", "profound", "noteworthy", "notable", "versatile",
      "invaluable", "elevate", "foster", "garner",
    ],
  },
  {
    since: "0.1.0",
    source: "Pangram / Grammarly / practitioner marketing-buzzword blacklists",
    evidence: "P",
    era: "GPT-4 (2023-2025; the GPT-4-era PR cluster fell from 11.4% to 1.5% of PR descriptions by Nov 2026)",
    words: [
      "leverage", "leveraging", "synergy", "robust", "seamless", "seamlessly",
      "transformative", "scalable", "cutting-edge", "game-changer", "game changer",
      "paradigm", "holistic", "empower", "harness", "unleash", "unlock", "utilize",
      "utilise", "supercharge", "state-of-the-art", "best-in-class", "vibrant",
      "multifaceted", "revolutionize", "ever-evolving", "fast-paced", "comprehensive",
    ],
  },
  {
    since: "0.1.0",
    source: "practitioner blacklists (vague metaphors / meta-discourse nouns)",
    evidence: "P",
    words: [
      "landscape", "journey", "roadmap", "ecosystem", "beacon", "symphony", "myriad",
      "plethora", "facet", "illuminate", "navigate", "navigating",
    ],
  },
  {
    since: "0.1.0",
    source: "practitioner blacklists (booster adverbs / filler transitions)",
    evidence: "P",
    note: "weak alone: Wikipedia lists transitions as an ineffective indicator, though 'additionally' and 'notably' are in Kobak's estimator",
    words: [
      "furthermore", "moreover", "additionally", "nonetheless", "nevertheless",
      "undoubtedly", "notably", "strategically",
    ],
  },
  {
    // Reviewed pass from the catalogue-refresh sweep. Common words that flood false
    // positives (crucial, such as, overall, rich, featuring, align with) were rejected.
    since: "0.3.0",
    source: "Wikipedia: Signs of AI writing (Words to watch) + practitioner blacklists",
    evidence: "P",
    era: "promotional words ('boasts', 'nestled') are 'historical (2023-2025)' on Wikipedia",
    words: [
      "bolster", "bolsters", "bolstered", "bolstering", "groundbreaking", "renowned",
      "exemplifies", "encompassing", "enhance", "enhances", "enhancing", "enhanced",
      "innovative", "streamline", "streamlines", "streamlined", "streamlining",
      "actionable", "nestled",
    ],
  },
  {
    // First catalogue add sourced from this repo's own corpus discovery: "incredibly"
    // was heavily over-used by one frontier model (in 7 of 24 answers) vs its peers on
    // identical prompts. A booster adverb in the same family as the 0.1.0 set.
    since: "0.5.0",
    source: "empirical: cross-model corpus discovery (--discover)",
    evidence: "M2",
    words: ["incredibly"],
  },
  {
    // Inflection completion: 0.1.0 has resonate/resonates, but the reply-register
    // validate-open is past tense ("this really resonated").
    since: "0.9.0",
    source: "empirical: reply-bot specimens (validate-open 'this really resonated')",
    evidence: "P",
    words: ["resonated", "resonating"],
  },
  {
    // Matching is whole-word, so inflections of catalogued stems passed until now.
    // These forms are on the Kobak et al. excess-word list by name (berenslab
    // llm-excess-vocab, results/excess_words.csv). Held despite being on the list:
    // "elevated" (routine clinical wording) and "garnered", "surpassed", "utilized",
    // "utilizing" (each above 0.64 per 100k words in pre-2023 human registers, the 75th
    // percentile of the established catalogue, with no excess in corpus/samples).
    since: "0.10.0",
    source: "Kobak et al. 2025 (Science Advances) excess-vocabulary list: inflections of catalogued stems",
    evidence: "M1",
    era: "GPT-3.5/4 (2023-2025)",
    words: [
      "delved", "showcased", "underscored", "fosters", "fostering", "garnering",
      "leverages", "harnesses", "harnessing", "empowers", "unlocking", "revolutionizing",
      "realms", "encompass", "encompasses", "encompassed", "surpassing", "illuminates",
      "illuminating", "utilizes", "intricacies",
    ],
  },
  {
    // Inflection completion for stems in the practitioner groups; graded like the stem.
    since: "0.10.0",
    source: "inflection completion of catalogued stems (graded by the stem's group)",
    evidence: "P",
    words: [
      "fostered", "garners", "leveraged", "harnessed", "empowering", "empowered",
      "unlocks", "unleashing", "unleashed", "unleashes", "revolutionized", "utilization",
      "boasting", "boasted", "exemplify", "exemplified", "exemplifying", "navigates",
      "navigated", "testaments", "facets", "tapestries", "journeys", "landscapes",
      "supercharged", "supercharging",
    ],
  },
  {
    // Screened to zero hits on corpus/baseline (2026-11-25). "potent", "amidst" and
    // "unprecedented" hit human oratory/journalism and are held; "unveiled", "akin" and
    // "revolutionary" are held after the pre-2023 register screen (screen-registers.mjs).
    since: "0.10.0",
    source: "Kobak et al. 2025 excess style words (Fig. S6); Liang et al. 2024 peer-review adverbs; Yakura et al. 2024; Batalo et al. 2025 hype annotation ('unparalleled')",
    screened: "2026-11-25",
    evidence: "M1",
    words: [
      "elucidate", "elucidates", "elucidating", "unveil", "unveils", "unveiling", "burgeoning", "unparalleled", "uncharted", "underexplored",
      "surmount", "interconnectedness", "interplay", "nuanced", "poised",
      "adept", "pinpoint", "groundwork", "juxtaposed", "emphasizing", "lucidly",
      "aptly", "methodically", "innovatively", "compellingly", "impressively",
      "excellently",
    ],
  },
  {
    // The 2025-2026 "staging" vocabulary. load-bearing: one user measured 0.5 -> 12.0
    // hits per 10k words across three Opus 4.6/4.7 sessions (claude-code #53454; a
    // separate method put Opus 5 near 2 per 10k, so not one trend). Lifts in the
    // Abraham PR-description corpus (544,271 docs, fit of 2026-11-25; it refits daily):
    // load-bearing 12.3, quietly 7.5, genuinely 7.2. "quietly" is also on Wikipedia's
    // GPT-6 list. Not screened: the baseline has one human "quietly" (oratory).
    // "frankly" (one practitioner list plus a secondhand Arena figure) is held, and bare
    // "honestly" hits human oratory, so only the "Honestly?" fragment ships.
    since: "0.10.0",
    source: "claude-code #53454; Abraham PR-description corpus (2025-2026); Wikipedia GPT-6 list ('quietly'); practitioner lists",
    evidence: "M2",
    era: "Claude Opus 4.7-5.x, GPT-5.x/6 (2025-2026)",
    words: ["load-bearing", "quietly", "genuinely"],
  },
  {
    // Creative-writing slop that leaks into general prose (GPT-4o "camaraderie" 162x,
    // "palpable" 95x vs human, Reinhart et al. Table 1). Screened to zero baseline hits.
    since: "0.10.0",
    source: "Reinhart et al. 2025 (PNAS), Table 1, GPT-4o",
    screened: "2026-11-25",
    evidence: "M1",
    words: ["camaraderie", "palpable"],
  },
  // -- opt-in register groups --------------------------------------------------
  {
    since: "0.10.0",
    profile: "review",
    source: "Liang et al. 2024 (ICLR/NeurIPS review vocabulary, top-100 appendix)",
    evidence: "M1",
    words: ["laudable", "cogent", "ingenious", "admirable", "refreshing", "intriguing", "insightful"],
  },
  {
    since: "0.10.0",
    profile: "pr",
    source: "Abraham PR-description corpus, rising 2025-2026 clusters (unlabelled; attribution inferred)",
    evidence: "M2",
    era: "2025-2026",
    note: "testing jargon overlaps ('vacuous truth', 'fail loudly'); run --discover on your own PR text before trusting",
    words: [
      "plainly", "vacuous", "vacuously", "provably", "wedged", "chokepoint", "tripwire",
      "carve-out", "backstop", "papered", "structurally", "loudly",
    ],
  },
  {
    since: "0.10.0",
    profile: "pr",
    source: "Abraham PR-description corpus, GPT-4-era cluster (fell from 11.4% to 1.5% of descriptions)",
    evidence: "M2",
    era: "2023-2025",
    words: ["enterprise-grade", "production-ready", "ai-powered"],
  },
  {
    since: "0.10.0",
    profile: "fiction",
    source: "Antislop / slop-score (Paech 2025: 'flickered' in the top list of 98.5% of 67 models)",
    evidence: "M1",
    words: ["flickered", "shimmered", "unease", "newfound", "unspoken", "etched", "unsettlingly", "elara", "kael"],
  },
];

// Flat list of the always-on words (derived from the sourced groups above).
export const WORDS = WORD_GROUPS.filter((g) => !g.profile).flatMap((g) => g.words);
// Every word including opt-in profile groups.
export const ALL_WORDS = WORD_GROUPS.flatMap((g) => g.words);

// Phrases and constructions, grouped like the words. Rule fields:
//   re        the pattern (tested per line, and across the lines of a paragraph)
//   msg       what the report prints
//   lineOnly  ^ means "start of the line" (in social text, the start of a reply), so
//             the rule is not re-run on joined paragraphs
//   position  "first" = first sentence of the prose only; "last" = last two sentences
//   family    "contrast" rules also feed the negative-contrast density advisory
//   unless    skip the rule when the line (or joined paragraph) also matches this
//   anchor    "sentence": ^ means "start of a sentence"; on joined paragraphs the rule
//             is tried from each sentence start, so the two-sentence shape is caught
//             when a soft line break splits it
export const PHRASE_GROUPS = [
  {
    since: "0.1.0",
    source: "Wikipedia 'Signs of AI writing' essay; practitioner blacklists",
    evidence: "P",
    rules: [
      // intro / scene-setting cliches
      { re: /\bin today'?s (fast[- ]paced )?(world|digital age|digital landscape)\b/i, msg: '"in today\'s ... world" intro' },
      { re: /\bin the (ever[- ]evolving|dynamic) (landscape|world) of\b/i, msg: '"ever-evolving landscape" intro' },
      { re: /\bas the world continues to evolve\b/i, msg: '"as the world continues to evolve"' },
      { re: /\bimagine a world where\b/i, msg: '"imagine a world where"' },
      { re: /\bat its core\b/i, msg: '"at its core"' },
      // expository cliches
      { re: /\bplays? an? (crucial|important|key|vital|pivotal|significant) role\b/i, msg: '"plays a crucial role"' },
      { re: /\bis a testament to\b/i, msg: '"is a testament to"' },
      { re: /\bserves? as a (powerful|valuable|vital) tool\b/i, msg: '"serves as a powerful tool"' },
      { re: /\bcannot be overstated\b/i, msg: '"cannot be overstated"' },
      { re: /\bhas become increasingly (important|popular|common)\b/i, msg: '"has become increasingly ..."' },
      // reader framing
      { re: /\bwhen it comes to\b/i, msg: '"when it comes to"' },
      { re: /\bwhether you'?re (a |an )?.+ or (a |an )?.+/i, msg: '"whether you\'re X or Y" framing' },
      { re: /\bno matter where you are (on|in) your journey\b/i, msg: '"no matter where you are on your journey"' },
      { re: /\bif you'?re looking to\b/i, msg: '"if you\'re looking to"' },
      // vague filler
      { re: /\bat the end of the day\b/i, msg: '"at the end of the day"' },
      { re: /\bfor all intents and purposes\b/i, msg: '"for all intents and purposes"' },
      { re: /\bwith that in mind\b/i, msg: '"with that in mind"' },
      { re: /\bthe fact of the matter is\b/i, msg: '"the fact of the matter is"' },
      { re: /\bin a nutshell\b/i, msg: '"in a nutshell"' },
      { re: /\bneedless to say\b/i, msg: '"needless to say"' },
      { re: /\bthat being said\b/i, msg: '"that being said"' },
      { re: /\bdeep dive\b/i, msg: '"deep dive"' },
      // hedging / throat-clearing
      { re: /\bit'?s (important|worth|essential) (to note|noting|to consider|considering|to recognize) that\b/i, msg: "hedge: \"it's worth noting that ...\"", family: "hedge" },
      { re: /\bwhile it is true that\b/i, msg: '"while it is true that"', family: "hedge" },
      { re: /\bit could be argued that\b/i, msg: '"it could be argued that"', family: "hedge" },
      { re: /\bgenerally speaking\b/i, msg: '"generally speaking"', family: "hedge" },
      // meta-structure
      { re: /\bthis (article|post|paper|piece) will (explore|examine|cover|delve into|look at)\b/i, msg: '"this article will explore"' },
      { re: /\blet'?s (take a closer look|dive in|explore|unpack)\b/i, msg: '"let\'s dive in / take a closer look"' },
      { re: /\bhere'?s (the thing|why)\b/i, msg: '"here\'s the thing/why"' },
      // closing tics
      { re: /\b(in conclusion|in summary|to sum up|to wrap up|to conclude)\b/i, msg: "conclusion ritual" },
      { re: /\bthe possibilities are endless\b/i, msg: '"the possibilities are endless"' },
      { re: /\bthe future (is|looks) (bright|promising)\b/i, msg: '"the future is bright"' },
      { re: /\bonly time will tell\b/i, msg: '"only time will tell"' },
      { re: /\bthe journey (is just beginning|doesn'?t end here)\b/i, msg: '"the journey is just beginning"' },
      // syntactic constructions
      { re: /\b(not|don'?t|doesn'?t|didn'?t) (just|only)\b[^.?!]{0,60}\b(but|it'?s|they'?re|its)\b/i, msg: '"not just X, but Y"', family: "contrast" },
      { re: /\b(it'?s|we'?re|they'?re)\s+(not|never)(\s+just)?\b[^.?!]{1,80}?\b(it'?s|we'?re|they'?re)\b/i, msg: '"it\'s not X, it\'s Y" negated contrast', family: "contrast" },
    ],
  },
  {
    since: "0.3.0",
    source: "Wikipedia: Signs of AI writing (assistant leakage + high-signal cliches)",
    evidence: "P",
    rules: [
      { re: /\bas an? (ai|large) language model\b/i, msg: '"as an AI/large language model" (assistant leakage)' },
      { re: /\bi hope this helps\b/i, msg: '"I hope this helps" (assistant sign-off)' },
      { re: /\bin the heart of\b/i, msg: '"in the heart of"' },
      { re: /\ba diverse array of\b/i, msg: '"a diverse array of"' },
      { re: /\bvaluable insights\b/i, msg: '"valuable insights"' },
      { re: /\b(stands|serves) as a testament\b/i, msg: '"stands/serves as a testament"' },
      { re: /\bsetting the stage for\b/i, msg: '"setting the stage for"' },
      { re: /\bindelible mark\b/i, msg: '"indelible mark"' },
      { re: /\bdeeply rooted in\b/i, msg: '"deeply rooted in"' },
      { re: /\brich (cultural )?(tapestry|heritage)\b/i, msg: '"rich cultural heritage/tapestry"' },
    ],
  },
  {
    // AI comment-reply rhetoric, sourced from reply-bot specimens collected off social
    // threads. The reply register favors validate-then-restate openers and standalone
    // aphorism molds that long-form corpus discovery can't see. Every rule was
    // FP-screened against corpus/baseline (0 hits); the uncontracted negated contrast is
    // also corroborated in corpus/samples. The ^ anchors mean "starts the line", which
    // in social text is the start of the reply.
    since: "0.9.0",
    source: "empirical: reply-bot specimens (corpus/specimens), two independent sightings each",
    screened: "2026-11-25",
    evidence: "P",
    rules: [
      { re: /^\s*that('?s| is) the [^.?!]{1,40}\.(\s|$)/i, msg: 'validate-then-restate opener ("That is/That\'s the ...")', lineOnly: true },
      { re: /\b(you'?re describing|what you (just )?described)\b/i, msg: 'validate-then-restate ("what you\'re describing")' },
      { re: /\byou'?re (absolutely right|right that)\b/i, msg: 'concessive validation ("you\'re right that ...")' },
      { re: /\b(such )?a sharp (addition|point|observation|framing|distinction|question|way)\b/i, msg: '"a sharp addition/point" compliment-open' },
      { re: /^[^.?!]{1,45}\b(isn'?t|is not|aren'?t|are not) (the|an?|about|just)\b[^.?!]{1,100}[.?!]\s+it(?:'?s| is)\b/i, msg: '"A isn\'t the X. It is the Y." negated contrast (uncontracted)', anchor: "sentence", family: "contrast" },
      { re: /\b(doesn'?t|does not) [^.?!]{1,60}, it (just|only|simply|actually)\b/i, msg: '"doesn\'t X, it just Y" contrast', family: "contrast" },
      { re: /\bcan (\w{3,})\b[^.?!]{0,80}[.?!]\s+(?!if |when |unless )(?:\w+ ){0,2}can(?:'t|not)\b (?:\w+ )?\1\b/i, msg: '"can X ... can\'t X" modal antithesis (verb echo)', family: "contrast" },
      { re: /\bthe real (open )?(question|test) (of|is|isn'?t|will be)\b/i, msg: '"the real question/test" pivot' },
      { re: /^\s*which (means|might|may|is why|is where|is what)\b/i, msg: '"Which means/might ..." fragment opener', lineOnly: true },
      { re: /(^|[.?!]\s+)worth noting\b/i, msg: 'hedge: "worth noting ..." (clause-initial)', family: "hedge" },
      { re: /\bthe (uncomfortable|deeper|harder|honest|quiet) (question|truth|answer|reality|tension)\b/i, msg: '"the uncomfortable question/truth" framing' },
      { re: /\bthe most (important|powerful|dangerous) form of\b/i, msg: '"the most important form of X" hedged superlative' },
      { re: /\bis what keeps [^.?!]{1,50}from (becoming|turning into)\b/i, msg: '"X is what keeps A from becoming B" aphorism mold' },
      { re: /\bis measured by how\b/i, msg: '"is measured by how" aphorism mold' },
      { re: /\b(\w{3,}?)e?s\b[^.?!]{1,50}\bwithout \1ing\b/i, msg: '"lowers X without lowering Y" parallel antithesis', family: "contrast" },
      { re: /\bas an? \w+, not an? \w+[.!]/i, msg: '"as a hypothesis, not a promise" antithesis close', family: "contrast" },
      { re: /\bnobody (\w{3,}?)e?s\b[^.?!]{1,60}\bthey \1/i, msg: 'corrective anaphora ("nobody polices X, they police Y")', family: "contrast" },
    ],
  },
  {
    // Second collection pass (feed mining, 2026-07): same screen, two independent
    // sightings each. "as ... rather than" is also corroborated in corpus/samples.
    since: "0.9.0",
    source: "empirical: reply-bot feed mining (2026-07), two independent sightings each",
    screened: "2026-11-25",
    evidence: "P",
    rules: [
      { re: /\b\w+ isn'?t (really )?(the|an?) [^.?!]{1,60}, it'?s\b/i, msg: '"X isn\'t the A, it\'s B" negated contrast (noun subject)', family: "contrast" },
      { re: /\b(will|are going to) be (those|the ones) who\b/i, msg: '"will be those who ..." superlative prediction' },
      { re: /\bas an? [\w-]+( [\w-]+){0,3} rather than an?\b/i, msg: '"as an X rather than a Y" reframe', family: "contrast" },
      { re: /\ban? [\w-]+( [\w-]+)? (problem|failure|issue|question)\b[^.?!]{0,40}\ban? [\w-]+( [\w-]+)? one\b/i, msg: '"a tech problem, a change-management one" echo', family: "contrast" },
      { re: /\btrue \w+ (requires|lies in|demands|means)\b/i, msg: '"True X requires/lies in ..." aphorism open' },
      { re: /\b(don'?t|doesn'?t) (\w{3,})\b[^.?!]{1,60},\s*(they|it|we) \2/i, msg: 'corrective anaphora ("don\'t mark X, they mark Y")', family: "contrast" },
    ],
  },
  // -- 0.10.0 additions. Every always-on rule below was screened to zero hits on the
  // paragraph-preserving corpus/baseline (2026-11-25); a test re-runs the screen. --
  {
    since: "0.10.0",
    source: "Pangram phrase rates; Sun et al. 2025 (Idiosyncrasies in LLMs); Academ-AI (768 cases); Wikipedia",
    screened: "2026-11-25",
    evidence: "M2",
    rules: [
      { re: /^\s*(certainly|absolutely|of course|sure)!/i, msg: 'assistant opener ("Certainly!")', lineOnly: true },
      { re: /\bcertainly,? here (is|are)\b/i, msg: 'assistant leakage ("Certainly, here is")' },
      { re: /(^|[.!?]\s+)(great|good|excellent) (question|point|catch)[!.]/i, msg: 'praise-before-answer ("Great question!")' },
      { re: /\bi'?d be (more than )?happy to (help|assist)\b|\bi am happy to (help|assist)\b/i, msg: 'assistant voice ("I\'d be happy to help")' },
      { re: /\b(let me know if you('d| would)? (like|want|need)|would you like me to|is there anything else (i|we) can)\b/i, msg: 'offer-of-help close ("let me know if you\'d like")', position: "last" },
      { re: /\b(happy to (help|walk you through|go deeper|dig (in|deeper)|elaborate|expand)|feel free to (ask|reach out|let me know))\b/i, msg: 'offer-of-help close ("Happy to ...", "feel free to ask")', position: "last" },
      { re: /\bas of my (last|latest) (knowledge|training)( (update|cutoff|cut-off))?\b|\bmy knowledge cut-?off\b/i, msg: 'knowledge-cutoff disclaimer (assistant leakage)' },
      { re: /\bi (don'?t|do not) have (access to real-time|real-time|personal (opinions|experiences|feelings))\b/i, msg: 'capability disclaimer (assistant leakage)' },
      { re: /\bhere is (a|the) revised version\b|\bimproved (the )?(clarity|readability|flow)(,? (and )?(clarity|readability|flow|structure|consistency|concision))+\b|\bpreserv(ed|ing) (the )?existing (behaviou?r|structure|formatting|content|wording)\b/i, msg: 'revision-request leakage ("Here is a revised version", "improved clarity and flow")' },
    ],
  },
  {
    since: "0.10.0",
    source: "Pangram phrase ratios (21,000x-49,000x); Wikipedia AILEGACY / FACESCHALLENGES; slop-score",
    screened: "2026-11-25",
    evidence: "M2",
    rules: [
      { re: /\bas a (poignant|powerful|stark|sobering) reminder\b|\breminder of the (enduring|potential)\b/i, msg: 'puffery ("a poignant reminder")' },
      { re: /\bfaced numerous challenges\b|\bdespite these challenges\b|\bfaces (several|numerous|significant) challenges\b/i, msg: '"despite these challenges" formula' },
      { re: /\bthe (complex|intricate|delicate) interplay\b/i, msg: '"the complex interplay"' },
      { re: /\b(newfound|renewed) sense of (purpose|hope|belonging)\b/i, msg: '"a newfound sense of purpose"' },
      { re: /\bbec(ome|ame|omes|oming) a focal point\b/i, msg: '"become a focal point"' },
      { re: /\bexperts (argue|say|agree|note)\b|\bobservers (note|say)\b|\ba growing body of (research|literature|evidence)\b/i, msg: 'vague attribution ("experts argue"): name the source' },
    ],
  },
  {
    // The 2025-2026 staging register: salience flags, gotcha signposts, verdict
    // intensifiers, mannered metaphors. Practitioner consensus with 2-10+ independent
    // sightings each; Bennett (Arize, 2026) gives per-1k rates for several in Opus 5.
    since: "0.10.0",
    source: "Bennett/Arize Opus 5 vs 5.5 study; Anthropic Fable 5.1 prompting guide (platform.claude.com); Wikipedia GPT-6 list; tropes.fyi; deslop; humanizer; practitioner lists",
    screened: "2026-11-25",
    evidence: "P",
    era: "2025-2026",
    rules: [
      { re: /\blet (that|this|it) sink in\b/i, msg: 'staging: "let that sink in"' },
      { re: /\bread (that|this|it) again\b|\bfor (the people|those) in the back\b|\bsay it louder\b/i, msg: 'staging: "read that again"' },
      { re: /\bhere'?s (the kicker|the twist|the catch|the deal|the best part|the part|where it gets|what (nobody|no one))\b/i, msg: 'staging: "here\'s the kicker"' },
      { re: /(^|[.!?]\s+)[Tt]he (result|catch|kicker|twist|best part|reason|answer|problem|truth|secret)\?\s+[A-Z]/, msg: 'staging: self-answered fragment question ("The result? ...")' },
      { re: /(^|[.!?]\s+)honestly\?/i, msg: 'staging: "Honestly?" fragment' },
      { re: /\bearn(s|ed|ing)? (its|their|his|her) (keep|place|spot|seat)\b/i, msg: 'mannered prose: "earns its keep"' },
      { re: /\b(is |are )?doing a lot of (the )?(work|heavy lifting)\b|\bdoes (the |a lot of the )?heavy lifting\b|\bdoes real work\b/i, msg: 'mannered prose: "doing a lot of work"' },
      { re: /(^|[.!?]\s+)(this|that|it) (really |still |genuinely )?matters\.(\s|$)/i, msg: 'salience flag: "This matters."' },
      { re: /\b(that'?s|that is|which is) (exactly |precisely )?the (whole )?point\b|\b(that|this)( i|')s not an accident\b|\bthis is not an accident\b/i, msg: 'verdict intensifier ("that\'s the whole point")' },
      { re: /(^|[.!?]\s+)full stop\.(\s|$)/i, msg: 'verdict intensifier: "Full stop."' },
      { re: /\blet'?s (break (this|it) down|be real|be honest|get real)\b/i, msg: '"let\'s break this down / be real"' },
      { re: /\bthe real (unlock|story|issue|win|work|problem|risk|cost|lesson)\b|\bthe tension is real\b/i, msg: '"the real unlock/story" pivot' },
      { re: /\bthe (hard|tricky|surprising|interesting) part is\b|\bthe part (nobody|no one)\b/i, msg: 'signpost: "the hard part is"' },
      { re: /\bi'?m not saying [^.?!]{1,60}, but\b|\ba tempting (approach|answer|move) would be\b/i, msg: 'arguing with no one ("I\'m not saying X, but")' },
      { re: /\ba (dial|knob|lever) worth (turning|pulling)\b/i, msg: 'stock metaphor: "a dial worth turning"' },
    ],
  },
  {
    since: "0.10.0",
    source: "Antislop 2025 ('It's not X, it's Y' ~6.3x human in some models' creative writing); tropes.fyi; remove-ai-slop; Wikipedia; PENDING.md specimen",
    screened: "2026-11-25",
    evidence: "P",
    rules: [
      { re: /\bnot because\b[^.?!]{1,60}[.,]\s+(but )?because\b/i, msg: '"Not because X. Because Y." contrast', family: "contrast" },
      { re: /(^|[.!?]\s+)(Not|No) [^.?!,]{1,30}\.\s+(Not|No) [^.?!,]{1,30}\.\s+(Just |Only )?[A-Z]/, msg: 'countdown "Not X. Not Y. Z."', family: "contrast" },
      { re: /\bno [^.?!,]{1,25}, no [^.?!,]{1,25}, (just|only)\b/i, msg: 'countdown "no X, no Y, just Z"', family: "contrast" },
      { re: /\bthe (question|problem|issue|answer) (isn'?t|is not) [^.?!]{1,60}[.?!]\s+the \1 is\b/i, msg: 'noun-echo contrast ("The question isn\'t X. The question is Y.")', family: "contrast" },
      { re: /\bis no longer (a|an|the|about|just) [^.?!]{1,60}[.?!]\s+it(?:'s| is)\b/i, msg: '"is no longer X. It is Y." contrast', family: "contrast" },
      { re: /\byou'?re not [^.?!]{1,60}[.?!,]\s+you'?re\b/i, msg: '"You\'re not X. You\'re Y." contrast', family: "contrast" },
      { re: /,\s+(ensuring|highlighting|reflecting|underscoring|emphasizing|showcasing|fostering|paving)\b[^.?!]{3,}[.!]/i, msg: 'participial tail (", ensuring ...")' },
    ],
  },
  // -- opt-in register groups --------------------------------------------------
  {
    since: "0.10.0",
    profile: "pr",
    source: "ACM agentic-PR study (boilerplate in 18.8% of high-inconsistency PRs); HN; practitioner reports",
    evidence: "P",
    rules: [
      { re: /\b(comprehensive|extensive|thorough) (unit |integration )?tests?( coverage| suite)?\b[^.?!]{0,60}\bto ensure\b/i, msg: 'boilerplate test claim ("comprehensive tests ... to ensure")' },
      { re: /\bto ensure (correct|proper|expected) (functionality|behaviou?r)\b/i, msg: 'boilerplate: "to ensure correct functionality"' },
    ],
  },
  {
    since: "0.10.0",
    profile: "email",
    source: "Presend; TextSight; Iro (detector-vendor guides, 1-5 sightings each; 'don't hesitate to reach out' has 1)",
    evidence: "P",
    rules: [
      { re: /\bi hope (this|my) (email|message|note) finds you well\b/i, msg: 'email opener: "I hope this email finds you well"' },
      { re: /\bi wanted to reach out\b|\bi am writing to (provide|inform|follow up)\b/i, msg: 'email opener: "I wanted to reach out"' },
      { re: /\bdon'?t hesitate to (reach out|contact)\b/i, msg: 'email closer: "don\'t hesitate to reach out"' },
      { re: /\bi came across your profile\b/i, msg: 'cold-email opener: "I came across your profile"' },
      { re: /\bquick \d+[- ]minute (call|chat)\b/i, msg: 'cold-email ask: "quick 15-minute call"' },
      { re: /\bi look forward to hearing from you\b/i, msg: 'email closer: "I look forward to hearing from you"' },
    ],
  },
  {
    since: "0.10.0",
    profile: "social",
    source: "newsreel; Taplio; plain-language-editor (LinkedIn slop lists)",
    evidence: "P",
    rules: [
      { re: /\bi'?m (thrilled|humbled|excited|honored) to (announce|share)\b/i, msg: 'announcement formula ("I\'m thrilled to announce")' },
      { re: /\bunpopular opinion:|\bhot take:/i, msg: '"Unpopular opinion:" / "Hot take:"' },
      { re: /(^|[.!?]\s+)(agree|thoughts|what do you think)\?\s*$/i, msg: 'engagement-bait closer ("Agree?")', position: "last" },
      { re: /\brepost if\b|\bfollow (me )?for more\b/i, msg: 'engagement bait ("repost if", "follow for more")' },
    ],
  },
  {
    since: "0.10.0",
    profile: "fiction",
    source: "Antislop / slop-score phrase lists",
    evidence: "M1",
    rules: [
      { re: /\bvoice (barely|little more than) (above )?a whisper\b/i, msg: 'fiction slop: "voice barely above a whisper"' },
      { re: /\bheart (hammered|pounded) (against )?(his|her|their|my) ribs\b/i, msg: 'fiction slop: "heart hammered against her ribs"' },
    ],
  },
  {
    since: "0.10.0",
    profile: "wiki",
    source: "Wikipedia: Signs of AI writing (AILEGACY, ITSHAPESDISCUSSIONS, AIATTR, AIIDENTIFY), 2026 examples",
    evidence: "P",
    rules: [
      { re: /\b(marks?|represents?) a (pivotal|significant|major) (shift|turning point|moment|milestone)\b/i, msg: 'significance inflation ("marks a pivotal shift")' },
      { re: /\breflects the (broader|growing|wider)\b|\bforms part of the (wider|broader)\b|\benduring legacy\b/i, msg: 'legacy puffery ("reflects the broader ...")' },
      { re: /\bhas (shaped|sparked|fueled|informed) (broader )?(discussions|debates|conversations) (about|on|around)\b/i, msg: '"has shaped discussions about"' },
      { re: /\bmaintains an active (online|digital|social media) presence\b|\bholds the distinction of\b/i, msg: 'notability padding ("maintains an active online presence")' },
      { re: /\bhas been (featured|profiled|documented) (in|by)\b|\bindependent coverage\b/i, msg: 'notability padding ("has been featured in")' },
      { re: /\b(his|her|their) (personal |official )?website (identifies|describes) (him|her|them) as\b/i, msg: '"his website identifies him as"' },
    ],
  },
  {
    since: "0.10.0",
    profile: "academic",
    source: "CARS introduction study (arXiv 2610.01353: centrality openers 58-84% models vs 46% humans); Pangram; serious-writing S7/S16",
    evidence: "M2",
    rules: [
      { re: /\bin recent (years|decades),? [^.?!]{1,60}\b(has|have) (garnered|attracted|received|gained|drawn) (significant|increasing|growing|considerable|much) (attention|interest)\b/i, msg: 'centrality-claim opener ("In recent years, X has attracted increasing attention")' },
      { re: /\b(provides?|offers?|yields?) (new|novel|valuable|deeper) insights? into\b/i, msg: '"provides new insights into"' },
      { re: /\bto (address|fill|bridge) (this|the|these) gaps?\b/i, msg: 'gap formula ("To address this gap")' },
      // general prose fails the screen here (MedlinePlus: "some research has shown"), so academic only
      { re: /\b(studies|research) (have|has) (shown|demonstrated|found)\b/i, msg: 'vague attribution ("studies have shown"): name the study' },
      { re: /\[\d+\s*[-\u2013]\s*\d+\]/, msg: 'citation clump ("[3-9]"): name the two or three studies that matter' },
    ],
  },
  {
    since: "0.10.0",
    profile: "review",
    source: "practitioner reports of AI-written reviews (bold tag headers)",
    evidence: "A",
    rules: [
      { re: /^\s*(\*\*|__)[A-Z][\w-]*( [\w-]+){0,2}:?(\*\*|__):?\s/, msg: 'bold tag header ("**Strengths:**")', lineOnly: true },
    ],
  },
  {
    // Only run on comment text in code files (--code / --profile code).
    since: "0.10.0",
    profile: "code",
    codeOnly: true,
    source: "JCarterJohnson Reddit mining (11,906 posts, 11,306 comments); AI-SIGNALS; SynthScan; agent-failure-modes",
    evidence: "P",
    rules: [
      { re: /\b(here'?s the (updated|revised|modified|corrected|fixed)|as (you )?requested|i'?ve (added|updated|modified|changed|fixed|refactored|implemented))\b/i, msg: "code comment: chat leakage (\"Here's the updated ...\", \"I've added\")" },
      { re: /^\s*(step \d+[:.)]|now we\b|first,? we\b|next,? we\b|finally,? we\b)/i, msg: 'code comment: step narration ("Step 1:", "Now we")', lineOnly: true },
      { re: /\bthis (function|method|class|component|module|code|file|helper) (was|has been|is now) (added|changed|updated|modified|refactored|introduced|moved|renamed)\b|\b(was|were) (added|changed|updated|modified|refactored) (to|in order to) (replace|fix|support|handle|address)\b|^\s*(added|updated|changed|fixed|removed|new):\s/i, msg: "code comment: history narration (describe the code, not its change; that belongs in the commit)", unless: /versionchanged|versionadded|deprecat|backwards?[- ]compat|for compatibility/i },
      { re: /\b(rest of (your|the) (code|implementation|logic)|(your|existing) (code|logic|implementation) goes here|implementation goes here|add your [\w ]{1,30} here)\b/i, msg: 'code comment: placeholder ("rest of your code here")' },
      { re: /^\s*this (function|method|class|component|module|helper) (handles|is responsible for|serves to|ensures|provides a (way|mechanism))\b/i, msg: 'code comment: "This function handles ..." (name what it does)', lineOnly: true },
    ],
  },
];

// Flat list of every phrase rule, each tagged with its group's profile (if any).
export const PHRASES = PHRASE_GROUPS.flatMap((g) => g.rules.map((r) => ({ ...r, profile: g.profile, codeOnly: g.codeOnly, since: g.since })));

// Machine artifacts: residue that people never type (chatbot citation markup, chatbot
// referral parameters, UI text pasted along with an answer). FAIL, never suppressible.
// One documented sighting plus zero baseline hits is the bar here, not two: these are
// tokens, not style. A utm_source hit proves a chatbot found the link, not that it
// wrote the prose.
export const ARTIFACTS = [
  // search/image/news/file are documented (Wikipedia Markup subpage); view, forecast,
  // finance and sports are inferred variants. The image form runs together ("i" then
  // repeated turnNimageN), so no word boundaries between markers.
  { re: /contentReference\[oaicite:\d+\]|\boai_citation\b|(?<![A-Za-z])(cite|i)?(turn\d+(search|image|news|file|view|forecast|finance|sports)\d+)+(?![A-Za-z])|"attributableIndex"/, msg: "ChatGPT citation residue (oaicite / turn0search0)" },
  { re: /[\uE200-\uE202\uEA01\uEA02]/, msg: "ChatGPT citation delimiter (Private Use Area U+E200-E202, U+EA01-EA02)" },
  { re: /[?&](utm_source=(chatgpt\.com|openai|copilot\.com|perplexity|claude\.ai|gemini)|referrer=grok\.com)\b/, msg: "chatbot referral parameter in a link (utm_source=chatgpt.com)" },
  { re: /\[cite:\s*\d+(,\s*\d+)*\]|\[span_\d+\]\((start|end)_span\)/, msg: "Gemini citation residue ([cite: N] / start_span)" },
  { re: /\bgrok[-_](card|render_citation_card_json)\b/, msg: "Grok citation-card residue" },
  { re: /\bppl-ai-file-upload\b/, msg: "Perplexity upload residue" },
  { re: /\u3010[^\u3011]{0,40}\u2020[^\u3011]{0,40}\u3011/, msg: "chatbot source marker (\u3010N\u2020source\u3011)" },
  { re: /\bregenerate response\b/i, msg: '"Regenerate response" (chat UI text pasted along with an answer)' },
];

export const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;
const DOUBLEDASH = /(^|\s)--(\s|$)|\w--\w/; // em-dash approximation
const SMARTQUOTE = /[\u201C\u201D\u2018\u2019]/; // curly quotes/apostrophes: a generator/word-processor tell in plaintext or markdown
const NNBSP = /\u202F/; // narrow no-break space: documented in o3/o4-mini output (Apr 2025)
const reWord = (w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

const DEFAULT_EXTS = [".md", ".markdown", ".mdx", ".txt"];
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "out", "vendor", "coverage"]);
const DEFAULT_CONFIG = ".slop-lint.json";

// Code files for --code: extension -> comment syntax.
const C_STYLE = { line: ["//"], block: [["/*", "*/"]] };
const HASH = { line: ["#"], block: [] };
const PY = { line: ["#"], block: [['"""', '"""'], ["'''", "'''"]] };
const DASH = { line: ["--"], block: [] };
export const CODE_EXTS = {
  ".js": C_STYLE, ".mjs": C_STYLE, ".cjs": C_STYLE, ".ts": C_STYLE, ".tsx": C_STYLE, ".jsx": C_STYLE,
  ".java": C_STYLE, ".kt": C_STYLE, ".swift": C_STYLE, ".go": C_STYLE, ".rs": C_STYLE, ".c": C_STYLE,
  ".h": C_STYLE, ".cc": C_STYLE, ".cpp": C_STYLE, ".hpp": C_STYLE, ".cs": C_STYLE, ".scala": C_STYLE,
  ".php": C_STYLE, ".dart": C_STYLE, ".bicep": C_STYLE,
  ".py": PY, ".rb": HASH, ".sh": HASH, ".bash": HASH, ".zsh": HASH, ".yaml": HASH, ".yml": HASH,
  ".toml": HASH, ".r": HASH, ".ps1": HASH, ".sql": DASH, ".lua": DASH,
};

// Read a config file: { "allow": ["word or phrase", ...], "profiles": ["pr", ...],
// "ignore": ["path substring", ...] }. "ignore" works like --ignore: directory walks skip
// any path containing an entry (files named explicitly are still linted).
// Throws (with the path in the message) on unreadable, unparsable, or malformed content;
// a broken config should stop the run, not silently lint without it.
export function readConfig(path) {
  let raw;
  try { raw = readFileSync(path, "utf8"); } catch (e) { throw new Error(`config ${path}: ${e.message}`); }
  let cfg;
  try { cfg = JSON.parse(raw); } catch (e) { throw new Error(`config ${path}: invalid JSON (${e.message})`); }
  const allow = cfg.allow ?? [];
  if (!Array.isArray(allow) || allow.some((a) => typeof a !== "string" || !a.trim())) {
    throw new Error(`config ${path}: "allow" must be an array of non-empty strings`);
  }
  const out = { allow };
  if (cfg.profiles !== undefined) {
    const profiles = cfg.profiles;
    if (!Array.isArray(profiles) || profiles.some((p) => !Object.hasOwn(PROFILES, p))) {
      throw new Error(`config ${path}: "profiles" must be an array of: ${Object.keys(PROFILES).join(", ")}`);
    }
    out.profiles = profiles;
  }
  if (cfg.ignore !== undefined) {
    if (!Array.isArray(cfg.ignore) || cfg.ignore.some((a) => typeof a !== "string" || !a.trim())) {
      throw new Error(`config ${path}: "ignore" must be an array of non-empty strings`);
    }
    out.ignore = cfg.ignore;
  }
  return out;
}

// -- Document model -------------------------------------------------------------
// Classify each line so rules can scope to prose, headings, list items, or code.
function classify(lines) {
  const kinds = [];
  let fence = null, front = lines[0]?.replace(/^\uFEFF/, "") === "---";
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (front) { kinds.push("front"); if (i > 0 && l === "---") front = false; continue; }
    const f = l.match(/^\s*(```|~~~)/);
    if (fence) { kinds.push("code"); if (f && f[1] === fence) fence = null; continue; }
    if (f) { fence = f[1]; kinds.push("code"); continue; }
    if (!l.trim()) kinds.push("blank");
    else if (/^\s{0,3}#{1,6}\s/.test(l)) kinds.push("heading");
    else if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) kinds.push("list");
    else if (/^\s*\|/.test(l)) kinds.push("table");
    else if (/^\s*>/.test(l)) kinds.push("quote");
    else if (/^ {4,}\S/.test(l) && (i === 0 || kinds[i - 1] === "blank" || kinds[i - 1] === "indent")) kinds.push("indent");
    else if (/^\s*<\/?[a-z][^>]*>\s*$/i.test(l)) kinds.push("html");
    else kinds.push("prose");
  }
  return kinds;
}

// Blank out inline code spans so tells quoted in backticks are not flagged.
const maskInline = (l) => l.replace(/`[^`]*`/g, (m) => " ".repeat(m.length));

// Paragraphs: runs of consecutive prose lines (or a list item and its continuation).
function paragraphs(lines, kinds) {
  const out = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const k = kinds[i];
    const cont = cur && k === "prose" && (cur.kind === "prose" || /^\s+\S/.test(lines[i]));
    if (cont) { cur.lines.push(i); continue; }
    if (cur) out.push(cur);
    cur = k === "prose" || k === "list" || k === "quote" ? { kind: k, lines: [i] } : null;
  }
  if (cur) out.push(cur);
  return out;
}

const ABBR = /\b(e\.g|i\.e|etc|vs|cf|Mr|Mrs|Ms|Dr|Prof|Inc|Ltd|Jr|Sr|St|No|Fig|Figs|Eq|al|approx|U\.S|U\.K)\.$/i;
export function splitSentences(text) {
  const parts = text.split(/(?<=[.!?]["')\]]?)\s+(?=["'(\[]?[A-Z0-9])/);
  const out = [];
  for (const p of parts) {
    if (out.length && ABBR.test(out[out.length - 1])) out[out.length - 1] += " " + p;
    else out.push(p);
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

// Strip inline markdown for prose statistics.
const plain = (s) => s
  .replace(/`[^`]*`/g, "x")
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/https?:\/\/\S+/g, "x")
  .replace(/(\*\*|__|\*|_)(?=\S)([^*_]+?)\1/g, "$2")
  .replace(/<[^>]+>/g, " ");

// -- Document-level rates (advisories) ------------------------------------------
// Thresholds were set on the repo's own corpora (corpus/baseline vs corpus/samples,
// 2026-11-25) so that a rate trips on few human documents. They are prompts to look,
// not verdicts: syntax-only features reach AUROC 0.64-0.68 against a human slop label
// (Shaib et al. 2025). Sources: Reinhart et al. PNAS 2025 (participial clauses 5.3x,
// nominalizations 2.1x in GPT-4o); Bakhshi 2026 (tricolons 1.9x per document, ~1.7x per
// sentence after a length adjustment, performed hedges 2x); Lanzo & Angelo 2026 (flatter sentence-length rhythm in 8 of 9
// models); Pangram (bold 65 vs 2 per 10k words); Antislop (negative parallelism).
// Reinhart per 1k words, recomputed from hap-e-biber.csv.gz: participial human 1.73 vs GPT-4o 9.09, nominalizations 14.6 vs 31.3.
export const RATE_THRESHOLDS = {
  // Calibration (2026-11-25, docs of 15+ sentences): human = 53 corpus/baseline docs,
  // models = 96 corpus/samples answers (Claude, Gemini, GPT, Grok). Each threshold sits
  // at or beyond the human extreme, so a trip means "outside what the human baseline did".
  minSentences: 15,
  sentenceCV: 0.45,        // below: human p10 0.47, model medians 0.40-0.47
  participial: 10,         // per 100 sentences, above: human max 8.1, model medians 7-19
  nominalization: 0.06,    // share of words, above: human p90 0.037 (max 0.071); register-relative
  tricolon: 0.27,          // per sentence, above: human max 0.27, model medians 0.20-0.32
  hedge: 0.03,             // performed hedges per sentence, above: human max 0.015
  contrast: 2.6,           // negative-contrast hits per 1k words, above: human max 2.5
  copula: 2,               // "serves/stands/acts as a" count, at or above: human max 0
  bold: 4,                 // bold spans per 1k words (and 4+ spans), above: human max 0
  oneSentencePars: 0.85,   // one-sentence paragraph share (8+ paragraphs): human oratory runs to 0.83
  intensifier: 4,          // per 1k words, above: human max 3.6, model p90 3.4-7.3
};
const NOMINAL = /^[a-z]{3,}(?:tion|tions|ment|ments|ness|nesses|ity|ities|ance|ances|ence|ences|ization|izations|isation|isations)$/;
const NOT_NOMINAL = new Set(("government governments president moment moments nation nations city cities community " +
  "communities element elements comment comments apartment department departments document documents equipment " +
  "environment environments instrument instruments segment segments parliament station stations question questions " +
  "section sections fiction caution mention ration portion portions lotion motion potion notion ocean audience " +
  "evidence science sciences experience experiences sentence sentences difference differences conference conferences " +
  "university universities quality quantity identity entity entities activity activities facility facilities business " +
  "witness illness sickness darkness fitness wilderness").split(" "));
const PARTICIPIAL = /,\s+(?!(?:including|during|according|regarding|concerning|following|considering|excluding|involving|notwithstanding|something|nothing|anything|everything|morning|evening|thing|things|king|string|spring|bring|being)\b)[a-z]{3,}ing\b/g;
const TRICOLON = /\b[\w'-]+(?: [\w'-]+){0,3}, [\w'-]+(?: [\w'-]+){0,3},? (?:and|or) [\w'-]+/g;
const PERFORMED_HEDGE = /\b(it'?s (important|worth|essential|crucial) to (note|remember|consider|recognize|acknowledge)|worth noting|it should be noted|generally speaking|in many ways|to some extent|to a certain (extent|degree)|it could be argued|arguably|(could|might|may) (potentially|possibly)|it is (possible|likely) that)\b/gi;
const COPULA = /\b(serves|stands|functions|acts) as (a|an|the)\b/gi;
const INTENSIFIER = /\b(actually|really|truly|deeply|fundamentally|genuinely|honestly|incredibly|quietly|simply|absolutely|incredibly|remarkably)\b/gi;
const count = (s, re) => (s.match(re) || []).length;

export function docRates(text, { contrastHits = null } = {}) {
  const lines = text.split("\n");
  const kinds = classify(lines);
  const pars = paragraphs(lines, kinds).filter((p) => p.kind === "prose")
    .map((p) => plain(p.lines.map((i) => lines[i].trim()).join(" ")));
  const sents = pars.flatMap(splitSentences).filter((s) => /[a-z]/i.test(s));
  const words = sents.join(" ").match(/[A-Za-z][A-Za-z'-]*/g) || [];
  const nW = words.length || 1, nS = sents.length || 1;
  const lens = sents.map((s) => (s.match(/\S+/g) || []).length);
  const mean = lens.reduce((a, b) => a + b, 0) / nS;
  const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / nS);
  const prose = sents.join(" ");
  const rawBody = lines.filter((_, i) => kinds[i] !== "code" && kinds[i] !== "front").join("\n");
  const bold = Math.floor(count(rawBody, /\*\*/g) / 2);
  const oneSent = pars.filter((p) => splitSentences(p).length === 1).length;
  return {
    sentences: sents.length,
    words: words.length,
    paragraphs: pars.length,
    sentenceCV: mean ? sd / mean : 0,
    participial: (100 * count(prose, PARTICIPIAL)) / nS,
    nominalization: words.filter((w) => NOMINAL.test(w.toLowerCase()) && !NOT_NOMINAL.has(w.toLowerCase())).length / nW,
    tricolon: count(prose, TRICOLON) / nS,
    hedge: count(prose, PERFORMED_HEDGE) / nS,
    contrast: contrastHits === null ? null : (1000 * contrastHits) / nW,
    copula: count(prose, COPULA),
    bold,
    boldPer1k: (1000 * bold) / nW,
    oneSentencePars: pars.length ? oneSent / pars.length : 0,
    intensifier: (1000 * count(prose, INTENSIFIER)) / nW,
  };
}

// Turn rates into advisory lines.
export function rateAdvisories(r, T = RATE_THRESHOLDS) {
  if (r.sentences < T.minSentences) return [];
  const out = [];
  const f = (n, d = 2) => Number(n).toFixed(d);
  if (r.sentenceCV < T.sentenceCV) out.push(`sentence lengths are uniform (variation ${f(r.sentenceCV)}, human docs usually >= ${T.sentenceCV}); vary by content, not as a device`);
  if (r.participial > T.participial) out.push(`participial clauses at ${f(r.participial, 0)} per 100 sentences (> ${T.participial}); cut ", ensuring/highlighting ..." tails`);
  if (r.nominalization > T.nominalization) out.push(`nominalizations are ${f(100 * r.nominalization, 1)}% of words (> ${f(100 * T.nominalization, 1)}%); put actions in verbs, actors in subjects`);
  if (r.tricolon > T.tricolon) out.push(`three-item lists in ${f(100 * r.tricolon, 0)}% of sentences (> ${f(100 * T.tricolon, 0)}%); use the count the facts have`);
  if (r.hedge > T.hedge) out.push(`performed hedges in ${f(100 * r.hedge, 0)}% of sentences (> ${f(100 * T.hedge, 0)}%); hedge only real uncertainty`);
  if (r.contrast !== null && r.contrast > T.contrast) out.push(`negative-contrast constructions at ${f(r.contrast, 1)} per 1k words (> ${T.contrast}); state the positive claim`);
  if (r.copula >= T.copula) out.push(`${r.copula} "serves/stands/acts as a" (>= ${T.copula}); write "is"`);
  if (r.bold >= 4 && r.boldPer1k > T.bold) out.push(`${r.bold} bold spans, ${f(r.boldPer1k, 1)} per 1k words (> ${T.bold}); bold only what a scanner must find`);
  if (r.paragraphs >= 8 && r.oneSentencePars > T.oneSentencePars) out.push(`${f(100 * r.oneSentencePars, 0)}% of paragraphs are one sentence (> ${f(100 * T.oneSentencePars, 0)}%); join related sentences`);
  if (r.intensifier > T.intensifier) out.push(`intensifiers at ${f(r.intensifier, 1)} per 1k words (> ${T.intensifier}); delete them`);
  return out;
}

// -- Code comments --------------------------------------------------------------
// Return the source with everything but comment text blanked, line count preserved.
export function extractComments(src, syntax) {
  const lines = src.split("\n");
  const out = [];
  let inBlock = null;
  for (let n = 0; n < lines.length; n++) {
    const l = lines[n];
    if (n === 0 && l.startsWith("#!")) { out.push(""); continue; }
    let text = "", i = 0, quote = null;
    while (i < l.length) {
      if (inBlock) {
        const end = l.indexOf(inBlock, i);
        if (end < 0) { text += " " + l.slice(i); i = l.length; break; }
        text += " " + l.slice(i, end); i = end + inBlock.length; inBlock = null; continue;
      }
      const c = l[i];
      if (quote) { if (c === "\\") i += 2; else { if (c === quote) quote = null; i++; } continue; }
      const blk = syntax.block.find(([s]) => l.startsWith(s, i));
      if (blk) { inBlock = blk[1]; i += blk[0].length; continue; }
      if (syntax.line.some((t) => l.startsWith(t, i))) { text += " " + l.slice(i).replace(/^(\/\/+|#+|--+)!?/, ""); break; }
      if (c === '"' || c === "'" || c === "`") quote = c;
      i++;
    }
    out.push(text.replace(/^\s*\*+\s?/, " ").replace(/\s+$/, ""));
  }
  return out.join("\n");
}

// -- Lint -----------------------------------------------------------------------
const TITLE_SMALL = new Set("a an the and or but nor of to in on at for with by vs via from as into per than".split(" "));
function isTitleCase(h) {
  const words = h.replace(/[^\w\s'-]/g, " ").split(/\s+/).filter(Boolean);
  const sig = words.slice(1).filter((w) => !TITLE_SMALL.has(w.toLowerCase()) && /^[a-z]/i.test(w));
  return sig.length >= 2 && sig.every((w) => /^[A-Z]/.test(w)) && !sig.every((w) => /^[A-Z0-9]+$/.test(w));
}
const STOCK_HEADING = /^(challenges and (future )?(directions|prospects|outlook)|future (outlook|prospects|directions)|key takeaways|why (it|this) matters)$/i;
const WIKI_HEADING = /^(awards and recognition|legacy and impact|impact and legacy)$/i;
const PR_HEADING = /^(summary|changes|what changed|changes made|key changes|testing|test plan|tests|motivation|overview|why|how|context)$/i;
const BOLD_LEAD = /^\s*([-*+]|\d+[.)])\s+\*\*[^*\n]{1,60}\*\*/;

// Lint one document. Returns { em, artifacts, hits, advisories }: em is the em-dash
// count and artifacts the machine-artifact count (both failures); hits are
// preformatted "  <line>: <symbol> ..." report lines (failures and warnings);
// advisories are document-level rate notes (never failures).
// Options: allow (see readConfig), profiles (opt-in groups), rates (default true),
// code (a CODE_EXTS syntax: lint only comment text).
// Each `allow` entry is a word or phrase as it would appear in prose; it disables every
// word/phrase rule its text triggers (case-insensitive), so flagged text can be pasted
// verbatim. Typography and artifacts are never suppressed.
export function lintText(text, { allow = [], profiles = [], rates = true, code = null } = {}) {
  const on = new Set(profiles);
  const words = WORD_GROUPS.filter((g) => !g.profile || on.has(g.profile)).flatMap((g) => g.words);
  const phrases = PHRASES.filter((p) => (!p.profile || on.has(p.profile)) && (!p.codeOnly || code));
  const okWords = new Set(), okPhrases = new Set();
  for (const a of allow) {
    for (const w of words) if (reWord(w).test(a)) okWords.add(w);
    for (const p of phrases) if (p.re.test(a)) okPhrases.add(p);
  }
  const src = code ? extractComments(text, code) : text;
  const lines = src.split("\n");
  const kinds = code ? lines.map((l) => (l.trim() ? "prose" : "blank")) : classify(lines);
  let em = 0, artifacts = 0, contrastHits = 0;
  const hits = [];
  const add = (n, s) => hits.push({ n, s });
  const free = phrases.filter((p) => !p.position);
  const paras = paragraphs(lines, kinds);
  // For `unless` rules: the paragraph text around each line.
  const paraText = new Map();
  for (const par of paras) { const t = par.lines.map((i) => lines[i]).join(" "); for (const i of par.lines) paraText.set(i, t); }

  lines.forEach((line, i) => {
    const n = i + 1;
    const dash = (line.match(/\u2014/g) || []).length;
    if (dash) { em += dash; add(n, `✗ em-dash ×${dash}  ${line.trim().slice(0, 64)}`); }
    for (const a of ARTIFACTS) if (a.re.test(line)) { artifacts++; add(n, `✗ artifact: ${a.msg}`); }
    if (SMARTQUOTE.test(line)) add(n, "⚠ smart/curly quote (weak alone: mail clients and word processors autocorrect to curly)");
    if (EMOJI.test(line)) add(n, "⚠ emoji");
    if (NNBSP.test(line)) add(n, "⚠ narrow no-break space (U+202F)");
    if (kinds[i] === "code" || kinds[i] === "front") return;
    const m = maskInline(line);
    if (DOUBLEDASH.test(m)) add(n, '⚠ "--" (em-dash approximation)');
    for (const w of words) if (!okWords.has(w) && reWord(w).test(m)) add(n, `⚠ word "${w}"`);
    for (const p of free) if (!okPhrases.has(p) && p.re.test(m) && !(p.unless && p.unless.test(paraText.get(i) ?? m))) { add(n, `⚠ ${p.msg}`); if (p.family === "contrast") contrastHits++; }
  });

  // Cross-line matches: a construction split over a soft line break inside a paragraph.
  for (const par of paras) {
    if (par.lines.length < 2) continue;
    const joined = par.lines.map((i) => maskInline(lines[i]).trim()).join(" ");
    const starts = p0 => p0.anchor === "sentence"
      ? splitSentences(joined).map((_, k, all) => all.slice(k).join(" ")) : [joined];
    for (const p of free) {
      if (p.lineOnly || okPhrases.has(p) || !starts(p).some((t) => p.re.test(t)) || (p.unless && p.unless.test(joined))) continue;
      if (par.lines.some((i) => p.re.test(maskInline(lines[i])))) continue;
      add(par.lines[0] + 1, `⚠ ${p.msg} (across lines)`);
      if (p.family === "contrast") contrastHits++;
    }
  }

  // Position-scoped rules: first sentence / last two sentences of the prose.
  const prosePars = paras.filter((p) => p.kind === "prose" || (code && p.kind));
  const positional = phrases.filter((p) => p.position && !okPhrases.has(p));
  if (prosePars.length && positional.length) {
    const last = prosePars[prosePars.length - 1];
    const lastText = splitSentences(last.lines.map((i) => maskInline(lines[i]).trim()).join(" ")).slice(-2).join(" ");
    const first = prosePars[0];
    const firstText = splitSentences(first.lines.map((i) => maskInline(lines[i]).trim()).join(" "))[0] || "";
    for (const p of positional) {
      if (p.position === "last" && p.re.test(lastText)) add(last.lines[last.lines.length - 1] + 1, `⚠ ${p.msg}`);
      if (p.position === "first" && p.re.test(firstText)) add(first.lines[0] + 1, `⚠ ${p.msg}`);
    }
  }

  if (!code) {
    // Headings: stock section names per hit; Title Case and colon subtitles by share.
    const heads = lines.map((l, i) => [i, l]).filter(([i]) => kinds[i] === "heading")
      .map(([i, l]) => ({ i, level: l.match(/#+/)[0].length, text: maskInline(l).replace(/^\s*#+\s*/, "").replace(/\s*#*\s*$/, "") }));
    for (const h of heads) {
      const t = h.text.replace(/[:.]$/, "").trim();
      if (STOCK_HEADING.test(t)) add(h.i + 1, `⚠ stock heading "${t}"`);
      if (on.has("wiki") && WIKI_HEADING.test(t)) add(h.i + 1, `⚠ stock heading "${t}" (wiki)`);
    }
    const sub = heads.filter((h) => h.level > 1);
    if (sub.length >= 3) {
      const tc = sub.filter((h) => isTitleCase(h.text));
      if (tc.length / sub.length >= 0.6) add(tc[0].i + 1, `⚠ Title Case headings (${tc.length} of ${sub.length}); use sentence case`);
      const colon = sub.filter((h) => /^[^:]{2,40}:\s+\S/.test(h.text));
      if (colon.length / sub.length >= 0.4) add(colon[0].i + 1, `⚠ colon-subtitle headings (${colon.length} of ${sub.length}, "X: The Y of Z")`);
    }
    if (on.has("pr")) {
      const pr = heads.filter((h) => PR_HEADING.test(h.text.trim()));
      if (pr.length >= 4) add(pr[0].i + 1, `⚠ PR template headings (${pr.map((h) => h.text.trim()).join(" / ")}); write what changed and why`);
    }
    // List runs: 3+ consecutive "- **Label**: text" items.
    let run = [];
    const flush = () => { if (run.length >= 3) add(run[0] + 1, `⚠ bold lead-in bullets (${run.length} in a row)`); run = []; };
    lines.forEach((l, i) => {
      if (kinds[i] === "list" && BOLD_LEAD.test(l)) run.push(i);
      else if (!(kinds[i] === "blank" || (kinds[i] === "prose" && /^\s+\S/.test(l) && run.length))) flush();
    });
    flush();
  }

  const advisories = rates && !code ? rateAdvisories(docRates(text, { contrastHits })) : [];
  hits.sort((a, b) => a.n - b.n);
  return {
    em, artifacts,
    hits: hits.map((h) => `  ${h.n}: ${h.s}`),
    advisories: advisories.map((a) => `  ℹ ${a}`),
  };
}

// Expand paths to a file list. Explicit files are always included; directories are
// walked with the extension filter, skipping IGNORE_DIRS + any `ignore` substring.
export function walkFiles(paths, { exts = DEFAULT_EXTS, ignore = [] } = {}) {
  const skip = (p) => p.split(sep).some((s) => IGNORE_DIRS.has(s)) || ignore.some((s) => p.includes(s));
  const out = [];
  const walk = (d) => {
    let entries; try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      const p = join(d, e);
      if (skip(p)) continue;
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (exts.includes(extname(p).toLowerCase())) out.push(p);
    }
  };
  for (const p of paths) {
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p);
    else out.push(p); // explicit file -> lint regardless of extension
  }
  return [...new Set(out)];
}

// -- Discover: find candidate NEW tells empirically ----------------------------
// Compare word/bigram frequency in model-output samples against a human baseline.
// Tokens that are massively over-represented in the samples, and not already in the
// catalogue, are ranked as candidates for human review. This is how the original
// "delve" tell was found, and it re-runs against each new model's output.
const STOP = new Set((
  "the a an and or but of to in on at for with as is are was were be been being by " +
  "this that these those it its it's i you he she we they them his her their our your " +
  "not no nor so if then than too very can will just also from into over under about " +
  "out up down off here there what which who whom when where why how all any both each " +
  "more most other some such only own same has have had do does did"
).split(" "));

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z][a-z'\u2019-]{2,}/g) || []).filter((w) => !STOP.has(w));
}
// Per-text frequency + document frequency (how many texts a token appears in). Doc
// frequency lets us drop one-off artifacts (an invented product name repeated within a
// single answer) and keep tokens that recur across many answers - the real style tells.
function freqMap(texts, { bigrams = true } = {}) {
  const counts = new Map(), docs = new Map(); let total = 0;
  for (const t of texts) {
    const toks = tokenize(t);
    const seen = new Set();
    for (let i = 0; i < toks.length; i++) {
      counts.set(toks[i], (counts.get(toks[i]) || 0) + 1); total++; seen.add(toks[i]);
      if (bigrams && i + 1 < toks.length) {
        const bg = `${toks[i]} ${toks[i + 1]}`;
        counts.set(bg, (counts.get(bg) || 0) + 1); seen.add(bg);
      }
    }
    for (const tok of seen) docs.set(tok, (docs.get(tok) || 0) + 1);
  }
  return { counts, total: total || 1, docs };
}
export function discover(sampleTexts, baselineTexts, { top = 30, minCount = 3, minDocs = 3 } = {}) {
  const S = freqMap(sampleTexts), B = freqMap(baselineTexts);
  const known = new Set(ALL_WORDS.map((w) => w.toLowerCase()));
  const smoothing = 1 / (B.total * 10);
  const effMinDocs = Math.min(minDocs, sampleTexts.length); // small corpora still return something
  const out = [];
  for (const [tok, c] of S.counts) {
    if (c < minCount || (S.docs.get(tok) || 0) < effMinDocs || known.has(tok)) continue;
    const sf = c / S.total;
    const bf = (B.counts.get(tok) || 0) / B.total;
    out.push({ token: tok, count: c, docs: S.docs.get(tok), sampleFreq: sf, baselineFreq: bf, ratio: sf / (bf + smoothing) });
  }
  out.sort((a, b) => b.ratio - a.ratio || b.count - a.count);
  return out.slice(0, top);
}

const stripFrontmatter = (t) => t.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
function readAll(paths) {
  return walkFiles(paths, { exts: [".md", ".markdown", ".mdx", ".txt"] })
    .map((f) => { try { return stripFrontmatter(readFileSync(f, "utf8")); } catch { return ""; } });
}

function runDiscover(argv) {
  const get = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
  const samples = get("--samples"), baseline = get("--baseline");
  const json = argv.includes("--json");
  const top = Number(get("--top")) || 30;
  const minDocs = Number(get("--min-docs")) || 3;
  if (!samples || !baseline) {
    console.error("discover: need --samples <dir> and --baseline <dir>.\n" +
      "  node slop-lint.mjs --discover --samples corpus/samples --baseline corpus/baseline");
    return 2;
  }
  // both accept a comma-separated list of dirs/files, so a model can be compared against
  // a human baseline or against the pool of other models (topic held constant).
  const sTexts = readAll(samples.split(",")), bTexts = readAll(baseline.split(","));
  if (!sTexts.length || !bTexts.length) { console.error("discover: empty samples or baseline corpus."); return 2; }
  const cands = discover(sTexts, bTexts, { top, minDocs });
  if (json) { console.log(JSON.stringify({ version: VERSION, candidates: cands }, null, 2)); return 0; }
  console.log("Candidate tells (over-represented in samples vs baseline, not yet in the catalogue):\n");
  console.log("  ratio   count  docs  token");
  for (const c of cands) console.log(`  ${c.ratio.toFixed(1).padStart(6)}  ${String(c.count).padStart(5)}  ${String(c.docs).padStart(4)}  ${c.token}`);
  console.log(`\n${cands.length} candidate(s). Review, then add the real tells to WORD_GROUPS (with a source) and CHANGELOG.md.`);
  return 0;
}

function printList() {
  const meta = (g) => [`since ${g.since}`, g.evidence && `evidence ${g.evidence}`, g.profile && `profile ${g.profile}`, g.era && `era: ${g.era}`]
    .filter(Boolean).join("; ");
  console.log("# WORDS");
  for (const g of WORD_GROUPS) console.log(`\n## ${g.source} (${meta(g)})${g.note ? `\n   note: ${g.note}` : ""}\n${g.words.join(", ")}`);
  console.log("\n# PHRASES");
  for (const g of PHRASE_GROUPS) console.log(`\n## ${g.source} (${meta(g)})\n${g.rules.map((r) => `  - ${r.msg}${r.position ? ` [${r.position} sentences]` : ""}`).join("\n")}`);
  console.log(`\n# ARTIFACTS (fail)\n${ARTIFACTS.map((a) => `  - ${a.msg}`).join("\n")}`);
  console.log(`\n# PROFILES (opt-in: --profile <name>)\n${Object.entries(PROFILES).map(([k, v]) => `  ${k.padEnd(9)} ${v}`).join("\n")}`);
  console.log(`\n${ALL_WORDS.length} words, ${PHRASES.length} phrase rules, ${ARTIFACTS.length} artifact rules. Catalogue version ${VERSION}.`);
}

function main(argv) {
  if (argv.includes("--version") || argv.includes("-v")) { console.log(VERSION); return 0; }
  if (argv.includes("--discover")) return runDiscover(argv);
  if (argv.includes("--list")) { printList(); return 0; }
  const paths = [];
  let exts = null, ignore = [], failOnWarn = false, quiet = false, configPath = null, allow = [], profiles = [], rates = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      console.log("slop-lint - flag LLM tells in prose. FAIL on em-dash and machine artifacts, WARN on the rest.\n" +
        "  node slop-lint.mjs [paths...] [--ext .md,.txt] [--ignore <substr>]... [--fail-on-warn] [--quiet]\n" +
        "                     [--allow <word/phrase>]... [--config <file>] [--profile <name>]... [--code] [--no-rates]\n" +
        "  node slop-lint.mjs --discover --samples <dir> --baseline <dir> [--top N] [--json]\n" +
        "  --version  --list   (no paths: scans the current directory recursively)\n" +
        `  Profiles: ${Object.keys(PROFILES).join(", ")}\n` +
        `  Config: ${DEFAULT_CONFIG} in the cwd ({"allow": [...], "profiles": [...]}) is read automatically.`);
      return 0;
    }
    if (a === "--ext") { exts = argv[++i].split(",").map((e) => (e.startsWith(".") ? e : `.${e}`).toLowerCase()); continue; }
    if (a === "--ignore") { ignore.push(argv[++i]); continue; }
    if (a === "--fail-on-warn") { failOnWarn = true; continue; }
    if (a === "--quiet") { quiet = true; continue; }
    if (a === "--allow") { allow.push(argv[++i]); continue; }
    if (a === "--config") { configPath = argv[++i]; continue; }
    if (a === "--profile") { profiles.push(...(argv[++i] || "").split(",").filter(Boolean)); continue; }
    if (a === "--code") { profiles.push("code"); continue; }
    if (a === "--no-rates") { rates = false; continue; }
    paths.push(a);
  }
  const bad = profiles.filter((p) => !Object.hasOwn(PROFILES, p));
  if (bad.length) { console.error(`slop-lint: unknown profile ${bad.join(", ")} (known: ${Object.keys(PROFILES).join(", ")})`); return 2; }
  try {
    const cfg = configPath ? readConfig(configPath) : existsSync(DEFAULT_CONFIG) ? readConfig(DEFAULT_CONFIG) : { allow: [] };
    allow.push(...cfg.allow);
    profiles.push(...(cfg.profiles || []));
    ignore.push(...(cfg.ignore || []));
  } catch (e) { console.error(`slop-lint: ${e.message}`); return 2; }
  const codeMode = profiles.includes("code");
  const walkExts = exts || (codeMode ? [...DEFAULT_EXTS, ...Object.keys(CODE_EXTS)] : DEFAULT_EXTS);
  const files = walkFiles(paths.length ? paths : ["."], { exts: walkExts, ignore });
  if (!files.length) { console.log("slop-lint: no files found."); return 0; }

  let emTotal = 0, artTotal = 0, warnTotal = 0, advTotal = 0;
  for (const file of files) {
    let text; try { text = readFileSync(file, "utf8"); } catch (e) { console.log(`skip ${file}: ${e.message}`); continue; }
    const code = codeMode ? CODE_EXTS[extname(file).toLowerCase()] || null : null;
    const { em, artifacts, hits, advisories } = lintText(text, { allow, profiles, rates, code });
    emTotal += em; artTotal += artifacts;
    warnTotal += hits.filter((h) => h.includes("⚠")).length;
    advTotal += advisories.length;
    const body = [...hits, ...advisories];
    if (body.length || !quiet) console.log(`\n${file}\n${body.length ? body.join("\n") : "  clean ✓"}`);
  }
  const fails = emTotal + artTotal;
  console.log(`\n${emTotal} em-dash failure(s), ${artTotal} artifact failure(s), ${warnTotal} warning(s), ${advTotal} advisory note(s) across ${files.length} file(s).`);
  console.log("FAIL on em-dash and machine artifacts; warnings are prompts to review, not bans; advisories never fail.");
  return fails || (failOnWarn && warnTotal) ? 1 : 0;
}

// Run as a CLI when invoked directly; stay importable when required elsewhere.
// argv[1] may be a symlink (npx and package `bin` install a node_modules/.bin
// shim), so resolve it to its real path before comparing against this module.
function invokedAsCli() {
  const entry = process.argv[1];
  if (!entry) return false;
  let real = entry;
  try { real = realpathSync(entry); } catch { /* keep the raw path */ }
  return import.meta.url === pathToFileURL(real).href;
}
if (invokedAsCli()) {
  process.exit(main(process.argv.slice(2)));
}
