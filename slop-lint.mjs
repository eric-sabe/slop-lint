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
 *   node slop-lint.mjs --version            # print the catalogue version
 *   node slop-lint.mjs --list               # print the catalogue with its sources
 *   git ls-files '*.md' | xargs node slop-lint.mjs     # lint tracked markdown
 *
 * Tells fade as models train against them and new ones appear with each release, so
 * the catalogue is sourced and versioned (see CHANGELOG.md). Find candidate new tells
 * empirically with --discover (see below).
 *
 * Allow list (optional): some content legitimately needs a catalogued word or phrase
 * (a product named Tapestry, a doc that must say "robust"). Put those in a
 * `.slop-lint.json` next to where you run the tool: { "allow": ["tapestry", "robust"] }.
 * Each entry disables every word/phrase rule its text triggers, so you can paste the
 * flagged text verbatim. Typographic tells (em-dash, "--", smart quotes, emoji) are
 * never suppressed.
 *
 * Severity, deliberately conservative (these words also appear in good human
 * writing, so false positives are the main risk and almost everything is a warning):
 *   FAIL (exit 1): the em-dash character (U+2014). The one near-decisive typographic tell.
 *   WARN:          everything else, flagged for a human look, never auto-removed.
 */

import { readFileSync, readdirSync, statSync, existsSync, realpathSync } from "node:fs";
import { join, sep, extname } from "node:path";
import { pathToFileURL } from "node:url";

export const VERSION = "0.9.1";

// Catalogue, grouped by provenance. Each group carries the version it was added in
// and its source, so the list can be pruned with confidence as tells fade. Edit a
// group's `words`, record the change in CHANGELOG.md, and bump the version.
export const WORD_GROUPS = [
  {
    since: "0.1.0",
    source: "FSU 'delve' focal-word study; PubMed 135-term analysis",
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
    words: [
      "landscape", "journey", "roadmap", "ecosystem", "beacon", "symphony", "myriad",
      "plethora", "facet", "illuminate", "navigate", "navigating",
    ],
  },
  {
    since: "0.1.0",
    source: "practitioner blacklists (booster adverbs / filler transitions)",
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
    words: ["incredibly"],
  },
  {
    // Inflection completion: 0.1.0 has resonate/resonates, but the reply-register
    // validate-open is past tense ("this really resonated").
    since: "0.9.0",
    source: "empirical: reply-bot specimens (validate-open 'this really resonated')",
    words: ["resonated", "resonating"],
  },
];

// Flat list for matching (derived from the sourced groups above).
export const WORDS = WORD_GROUPS.flatMap((g) => g.words);

// Phrases / constructions. Sources: corpus studies above plus the Wikipedia
// "Signs of AI writing" essay and practitioner blacklists. Added in 0.1.0 unless noted.
export const PHRASES = [
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
  { re: /\bit'?s (important|worth|essential) (to note|noting|to consider|considering|to recognize) that\b/i, msg: "hedge: \"it's worth noting that ...\"" },
  { re: /\bwhile it is true that\b/i, msg: '"while it is true that"' },
  { re: /\bit could be argued that\b/i, msg: '"it could be argued that"' },
  { re: /\bgenerally speaking\b/i, msg: '"generally speaking"' },
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
  { re: /\b(not|don'?t|doesn'?t|didn'?t) (just|only)\b[^.?!]{0,60}\b(but|it'?s|they'?re|its)\b/i, msg: '"not just X, but Y"' },
  { re: /\b(it'?s|we'?re|they'?re)\s+(not|never)(\s+just)?\b[^.?!]{1,80}?\b(it'?s|we'?re|they'?re)\b/i, msg: '"it\'s not X, it\'s Y" negated contrast' },
  // added 0.3.0 — Wikipedia: Signs of AI writing (assistant leakage + high-signal cliches)
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
  // added 0.9.0 — empirical: AI comment-reply rhetoric, sourced from reply-bot specimens
  // collected off social threads. The reply register favors validate-then-restate openers
  // and standalone aphorism molds that long-form corpus discovery can't see. Every rule
  // was FP-screened against corpus/baseline (0 hits across ~60k words of human oratory /
  // explainer / journalism); the uncontracted negated contrast is also corroborated in
  // corpus/samples (model long-form output). The two ^ anchors mean "starts the line",
  // which in social text is the start of the reply.
  { re: /^\s*that('?s| is) the [^.?!]{1,40}\.(\s|$)/i, msg: 'validate-then-restate opener ("That is/That\'s the ...")' },
  { re: /\b(you'?re describing|what you (just )?described)\b/i, msg: 'validate-then-restate ("what you\'re describing")' },
  { re: /\byou'?re (absolutely right|right that)\b/i, msg: 'concessive validation ("you\'re right that ...")' },
  { re: /\b(such )?a sharp (addition|point|observation|framing|distinction|question|way)\b/i, msg: '"a sharp addition/point" compliment-open' },
  { re: /^[^.?!]{1,45}\b(isn'?t|is not|aren'?t|are not) (the|an?|about|just)\b[^.?!]{1,100}[.?!]\s+it(?:'?s| is)\b/i, msg: '"A isn\'t the X. It is the Y." negated contrast (uncontracted)' },
  { re: /\b(doesn'?t|does not) [^.?!]{1,60}, it (just|only|simply|actually)\b/i, msg: '"doesn\'t X, it just Y" contrast' },
  { re: /\bcan (\w{3,})\b[^.?!]{0,80}[.?!]\s+(?!if |when |unless )(?:\w+ ){0,2}can(?:'t|not)\b (?:\w+ )?\1\b/i, msg: '"can X ... can\'t X" modal antithesis (verb echo)' },
  { re: /\bthe real (open )?(question|test) (of|is|isn'?t|will be)\b/i, msg: '"the real question/test" pivot' },
  { re: /^\s*which (means|might|may|is why|is where|is what)\b/i, msg: '"Which means/might ..." fragment opener' },
  { re: /(^|[.?!]\s+)worth noting\b/i, msg: 'hedge: "worth noting ..." (clause-initial)' },
  { re: /\bthe (uncomfortable|deeper|harder|honest|quiet) (question|truth|answer|reality|tension)\b/i, msg: '"the uncomfortable question/truth" framing' },
  { re: /\bthe most (important|powerful|dangerous) form of\b/i, msg: '"the most important form of X" hedged superlative' },
  { re: /\bis what keeps [^.?!]{1,50}from (becoming|turning into)\b/i, msg: '"X is what keeps A from becoming B" aphorism mold' },
  { re: /\bis measured by how\b/i, msg: '"is measured by how" aphorism mold' },
  { re: /\b(\w{3,}?)e?s\b[^.?!]{1,50}\bwithout \1ing\b/i, msg: '"lowers X without lowering Y" parallel antithesis' },
  { re: /\bas an? \w+, not an? \w+[.!]/i, msg: '"as a hypothesis, not a promise" antithesis close' },
  { re: /\bnobody (\w{3,}?)e?s\b[^.?!]{1,60}\bthey \1/i, msg: 'corrective anaphora ("nobody polices X, they police Y")' },
  // Second collection pass (feed mining, 2026-07): same screen, two independent
  // sightings each. "as ... rather than" is also corroborated in corpus/samples (4 hits).
  { re: /\b\w+ isn'?t (really )?(the|an?) [^.?!]{1,60}, it'?s\b/i, msg: '"X isn\'t the A, it\'s B" negated contrast (noun subject)' },
  { re: /\b(will|are going to) be (those|the ones) who\b/i, msg: '"will be those who ..." superlative prediction' },
  { re: /\bas an? [\w-]+( [\w-]+){0,3} rather than an?\b/i, msg: '"as an X rather than a Y" reframe' },
  { re: /\ban? [\w-]+( [\w-]+)? (problem|failure|issue|question)\b[^.?!]{0,40}\ban? [\w-]+( [\w-]+)? one\b/i, msg: '"a tech problem, a change-management one" echo' },
  { re: /\btrue \w+ (requires|lies in|demands|means)\b/i, msg: '"True X requires/lies in ..." aphorism open' },
  { re: /\b(don'?t|doesn'?t) (\w{3,})\b[^.?!]{1,60},\s*(they|it|we) \2/i, msg: 'corrective anaphora ("don\'t mark X, they mark Y")' },
];

export const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;
const DOUBLEDASH = /(^|\s)--(\s|$)|\w--\w/; // em-dash approximation
const SMARTQUOTE = /[“”‘’]/; // curly quotes/apostrophes: a generator/word-processor tell in plaintext or markdown
const reWord = (w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

const DEFAULT_EXTS = [".md", ".markdown", ".mdx", ".txt"];
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", "out", "vendor", "coverage"]);
const DEFAULT_CONFIG = ".slop-lint.json";

// Read an allow-list config file: { "allow": ["word or phrase", ...] }.
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
  return { allow };
}

// Lint one document. Returns { em, hits } where em is the em-dash count (the only
// failure) and hits are preformatted "  <line>: <symbol> ..." report lines.
// Each `allow` entry is a word or phrase as it would appear in prose; it disables every
// word/phrase rule its text triggers (case-insensitive), so flagged text can be pasted
// verbatim. Typographic tells (em-dash, "--", smart quotes, emoji) are never suppressed.
export function lintText(text, { allow = [] } = {}) {
  const okWords = new Set(), okPhrases = new Set();
  for (const a of allow) {
    for (const w of WORDS) if (reWord(w).test(a)) okWords.add(w);
    for (const p of PHRASES) if (p.re.test(a)) okPhrases.add(p);
  }
  let em = 0;
  const hits = [];
  text.split("\n").forEach((line, i) => {
    const n = i + 1;
    const dash = (line.match(/—/g) || []).length;
    if (dash) { em += dash; hits.push(`  ${n}: ✗ em-dash ×${dash}  ${line.trim().slice(0, 64)}`); }
    if (DOUBLEDASH.test(line)) hits.push(`  ${n}: ⚠ "--" (em-dash approximation)`);
    for (const w of WORDS) if (!okWords.has(w) && reWord(w).test(line)) hits.push(`  ${n}: ⚠ word "${w}"`);
    for (const p of PHRASES) if (!okPhrases.has(p) && p.re.test(line)) hits.push(`  ${n}: ⚠ ${p.msg}`);
    if (SMARTQUOTE.test(line)) hits.push(`  ${n}: ⚠ smart/curly quote`);
    if (EMOJI.test(line)) hits.push(`  ${n}: ⚠ emoji`);
  });
  return { em, hits };
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

// ── Discover: find candidate NEW tells empirically ────────────────────────────
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
  return (text.toLowerCase().match(/[a-z][a-z'’-]{2,}/g) || []).filter((w) => !STOP.has(w));
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
  const known = new Set(WORDS.map((w) => w.toLowerCase()));
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

const stripFrontmatter = (t) => t.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
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

function main(argv) {
  if (argv.includes("--version") || argv.includes("-v")) { console.log(VERSION); return 0; }
  if (argv.includes("--discover")) return runDiscover(argv);
  if (argv.includes("--list")) {
    for (const g of WORD_GROUPS) console.log(`\n# ${g.source} (since ${g.since})\n${g.words.join(", ")}`);
    console.log(`\n# phrases: ${PHRASES.length} patterns. Catalogue version ${VERSION}.`);
    return 0;
  }
  const paths = [];
  let exts = DEFAULT_EXTS, ignore = [], failOnWarn = false, quiet = false, configPath = null, allow = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      console.log("slop-lint - flag LLM tells in prose. FAIL on em-dash, WARN on the rest.\n" +
        "  node slop-lint.mjs [paths...] [--ext .md,.txt] [--ignore <substr>]... [--fail-on-warn] [--quiet]\n" +
        "                     [--allow <word/phrase>]... [--config <file>]\n" +
        "  node slop-lint.mjs --discover --samples <dir> --baseline <dir> [--top N] [--json]\n" +
        "  --version  --list   (no paths: scans the current directory recursively)\n" +
        `  Allow list: ${DEFAULT_CONFIG} in the cwd ({"allow": ["word or phrase", ...]}) is read automatically.`);
      return 0;
    }
    if (a === "--ext") { exts = argv[++i].split(",").map((e) => (e.startsWith(".") ? e : `.${e}`).toLowerCase()); continue; }
    if (a === "--ignore") { ignore.push(argv[++i]); continue; }
    if (a === "--fail-on-warn") { failOnWarn = true; continue; }
    if (a === "--quiet") { quiet = true; continue; }
    if (a === "--allow") { allow.push(argv[++i]); continue; }
    if (a === "--config") { configPath = argv[++i]; continue; }
    paths.push(a);
  }
  try {
    if (configPath) allow.push(...readConfig(configPath).allow);
    else if (existsSync(DEFAULT_CONFIG)) allow.push(...readConfig(DEFAULT_CONFIG).allow);
  } catch (e) { console.error(`slop-lint: ${e.message}`); return 2; }
  const files = walkFiles(paths.length ? paths : ["."], { exts, ignore });
  if (!files.length) { console.log("slop-lint: no files found."); return 0; }

  let emTotal = 0, warnTotal = 0;
  for (const file of files) {
    let text; try { text = readFileSync(file, "utf8"); } catch (e) { console.log(`skip ${file}: ${e.message}`); continue; }
    const { em, hits } = lintText(text, { allow });
    emTotal += em; warnTotal += hits.filter((h) => h.includes("⚠")).length;
    if (hits.length || !quiet) console.log(`\n${file}\n${hits.length ? hits.join("\n") : "  clean ✓"}`);
  }
  console.log(`\n${emTotal} em-dash failure(s), ${warnTotal} warning(s) across ${files.length} file(s).`);
  console.log("FAIL on em-dash; warnings are prompts to review, not bans.");
  return emTotal || (failOnWarn && warnTotal) ? 1 : 0;
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
