#!/usr/bin/env node
/**
 * mine-transcripts - measure the catalogue on your own Claude Code sessions.
 *
 * Reads the assistant text blocks in ~/.claude/projects/** /*.jsonl (main sessions and
 * subagents), groups them by model, and reports per model:
 *
 *   - words, messages and sessions sampled;
 *   - every catalogue rule's hits per 10k words, so you can see which tells a model
 *     version still produces and which have faded;
 *   - risers and fallers between two models (default: the oldest and newest model with
 *     enough text), the version-over-version signal;
 *   - pooled structure rates (participial, tricolon, hedge, bold, copula);
 *   - with --discover: words and bigrams over-represented in the newer model against
 *     the older one, and (when corpus/registers exists) against pre-2023 human prose,
 *     kept when they recur across several sessions. Off by default: on one person's
 *     sessions the lists are dominated by what the work was about, not by style.
 *
 * Privacy: the transcripts are yours. Nothing here sends data anywhere. The report goes
 * to corpus/transcripts/ (gitignored) and never contains message text. The rule tables
 * hold only catalogue rule names and numbers. The discovery lists can hold words from
 * your projects, so read them before copying anything into a committed file.
 *
 * Sessions whose project path contains "slop-lint" are skipped by default, because
 * work on this repo quotes the tells it catalogues.
 *
 * Sessions that name a writing skill (no-ai-tells, serious-writing, serious-academic) are
 * reported as "<model> +skill", apart from bare sessions, because they measure the
 * model plus your rules. --no-split merges them.
 *
 *   node mine-transcripts.mjs [--root DIR] [--out DIR] [--exclude a,b] [--min-words 20000]
 *                             [--compare "older,newer"] [--min-sessions 5] [--no-split]
 *                             [--discover]
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { lintText, discover, docRates, VERSION } from "./slop-lint.mjs";

const argv = process.argv.slice(2);
const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const ROOT = opt("--root", join(homedir(), ".claude", "projects"));
const EXCLUDE = opt("--exclude", "slop-lint").split(",").map((s) => s.trim()).filter(Boolean);
const MIN_WORDS = Number(opt("--min-words", 20000));
const MIN_SESSIONS = Number(opt("--min-sessions", 5));
const COMPARE = opt("--compare", "");
const GUIDE = /no-ai-tells|serious-writing|serious-academic/;
const SPLIT = !argv.includes("--no-split"); // report "model" and "model +skill" separately
const OUT_DIR = opt("--out", "corpus/transcripts");
const DISCOVER = argv.includes("--discover");

// Model ids carry date suffixes on some releases ("claude-haiku-4-5-20251001").
const family = (id) => id.replace(/-\d{8}$/, "");

function jsonlFiles(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) jsonlFiles(p, out);
    else if (e.endsWith(".jsonl")) out.push(p);
  }
  return out;
}

// -- Collect ---------------------------------------------------------------------
const byModel = new Map(); // model -> { blocks: [{ text, session }], sessions: Set, guided: Set, first, last }
let skippedFiles = 0;
const degenerate = new Map(); // model -> messages dropped

// Output loops (one token per line for thousands of lines, or a phrase repeated) are
// not prose and would swamp the rates.
function isDegenerate(text) {
  const words = text.match(/\S+/g) || [];
  if (words.length < 300) return false;
  const lines = text.split("\n").length;
  if (lines > 200 && words.length / lines < 1.5) return true;
  return new Set(words.map((w) => w.toLowerCase())).size / words.length < 0.08;
}
for (const file of jsonlFiles(ROOT)) {
  const project = file.slice(ROOT.length + 1).split("/")[0];
  if (EXCLUDE.some((x) => project.includes(x))) { skippedFiles++; continue; }
  let raw;
  try { raw = readFileSync(file, "utf8"); } catch { continue; }
  // A session that had a writing skill available measures "model plus your rules",
  // not the bare model. Record it so the report can say how much of each sample that is.
  const guided = GUIDE.test(raw);
  for (const line of raw.split("\n")) {
    if (!line.includes('"assistant"')) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (rec.type !== "assistant") continue;
    const m = rec.message || {};
    if (!m.model || m.model.startsWith("<")) continue;
    for (const b of m.content || []) {
      if (!b || b.type !== "text" || !b.text || !b.text.trim()) continue;
      const k = family(m.model) + (guided && SPLIT ? " +skill" : "");
      if (isDegenerate(b.text)) { degenerate.set(k, (degenerate.get(k) || 0) + 1); continue; }
      if (!byModel.has(k)) byModel.set(k, { blocks: [], sessions: new Set(), guided: new Set(), first: "9", last: "0" });
      const slot = byModel.get(k);
      slot.blocks.push({ text: b.text, session: file });
      slot.sessions.add(file);
      if (guided) slot.guided.add(file);
      const ts = (rec.timestamp || "").slice(0, 10);
      if (ts) { if (ts < slot.first) slot.first = ts; if (ts > slot.last) slot.last = ts; }
    }
  }
}

const wordCount = (t) => (t.match(/[A-Za-z][A-Za-z'-]*/g) || []).length;
// Layout rules put counts in their message ("(4 in a row)", "(2 of 4, ...)"); fold them.
const ruleKey = (h) => h.replace(/^\s*\d+:\s*/, "").replace(/^[^\w"'(]+\s*/, "").replace(/\s*\(across lines\)$/, "")
  .replace(/\(\d+ in a row\)/, "(3+ in a row)").replace(/\(\d+ of \d+/, "(n of m").trim();

// -- Measure ---------------------------------------------------------------------
const stats = new Map();
for (const [model, { blocks, sessions, guided, first, last }] of byModel) {
  let words = 0, em = 0;
  const rules = new Map();
  for (const { text } of blocks) {
    words += wordCount(text);
    const r = lintText(text, { rates: false });
    em += r.em;
    for (const h of r.hits) {
      const k = ruleKey(h);
      if (/^em-dash/.test(k)) continue;
      rules.set(k, (rules.get(k) || 0) + 1);
    }
  }
  // Per message, then summed as counts: one unclosed code fence in a joined corpus
  // would turn everything after it into code.
  const pooled = { sentences: 0, words: 0, paragraphs: 0, participial: 0, tricolon: 0, hedge: 0, bold: 0, copula: 0, oneSent: 0 };
  for (const { text } of blocks) {
    const r = docRates(text);
    pooled.sentences += r.sentences; pooled.words += r.words; pooled.paragraphs += r.paragraphs;
    pooled.participial += (r.participial * r.sentences) / 100;
    pooled.tricolon += r.tricolon * r.sentences;
    pooled.hedge += r.hedge * r.sentences;
    pooled.bold += r.bold; pooled.copula += r.copula;
    pooled.oneSent += r.oneSentencePars * r.paragraphs;
  }
  stats.set(model, { words, messages: blocks.length, sessions: sessions.size, guided: guided.size, first, last, em, rules, pooled });
}

const models = [...stats.keys()].sort();
const big = models.filter((m) => stats.get(m).words >= MIN_WORDS);
const per10k = (m, k) => (10000 * (stats.get(m).rules.get(k) || 0)) / stats.get(m).words;
const f1 = (n) => (n >= 10 ? n.toFixed(0) : n.toFixed(1));

// Order models oldest to newest by the numbers in their names (4-8 < 5 < 5-5).
const versionOf = (m) => (m.match(/(\d+)(?:-(\d))?/g) || ["0"]).map((s) => s.split("-").map(Number)).flat();
const byVersion = (a, b) => {
  const va = versionOf(a), vb = versionOf(b);
  for (let i = 0; i < Math.max(va.length, vb.length); i++) if ((va[i] || 0) !== (vb[i] || 0)) return (va[i] || 0) - (vb[i] || 0);
  return a.localeCompare(b);
};
big.sort(byVersion);
// Default comparison: the oldest and newest well-sampled versions of the family with the
// most text (e.g. claude-opus-4-8 to claude-opus-5-5). Across families, style differs
// for reasons other than version.
const familyName = (m) => m.replace(/-\d.*$/, "") + (m.endsWith(" +skill") ? " +skill" : "");
const famWords = new Map();
for (const m of big) famWords.set(familyName(m), (famWords.get(familyName(m)) || 0) + stats.get(m).words);
const topFam = [...famWords].sort((a, b) => b[1] - a[1])[0]?.[0];
const famModels = big.filter((m) => familyName(m) === topFam);
let [older, newer] = COMPARE ? COMPARE.split(",") : [famModels[0], famModels[famModels.length - 1]];

// -- Report ----------------------------------------------------------------------
const lines = [];
const out = (s = "") => lines.push(s);
out(`# Transcript sweep (catalogue ${VERSION})`);
out();
out(`Source: assistant text in \`${ROOT.replace(homedir(), "~")}\`; ${skippedFiles} session files skipped by --exclude ${EXCLUDE.join(",") || "(none)"}. Rates are hits per 10k words. Models with fewer than ${MIN_WORDS} words are listed but left out of comparisons.`);
out();
out("| model | dates | words | messages | dropped loops | sessions | with a writing skill | em-dashes per 10k |");
out("|---|---|---:|---:|---:|---:|---:|---:|");
for (const m of [...models].sort(byVersion)) {
  const s = stats.get(m);
  out(`| ${m}${big.includes(m) ? "" : " (small)"} | ${s.first} to ${s.last} | ${s.words} | ${s.messages} | ${degenerate.get(m) || 0} | ${s.sessions} | ${s.guided} | ${f1((10000 * s.em) / s.words)} |`);
}
out();
out("\"With a writing skill\" counts sessions whose transcript names no-ai-tells, serious-writing or serious-academic, usually because the skill was listed as available. Those sessions measure the model plus your rules, so low rates there can mean the rules worked, not that the model changed.");
out();

const allRules = new Set(big.flatMap((m) => [...stats.get(m).rules.keys()]));
out(`## Catalogue rules by rate (${big.join(", ")})`);
out();
out(`| rule | ${big.join(" | ")} |`);
out(`|---|${big.map(() => "---:").join("|")}|`);
const ranked = [...allRules].sort((a, b) => Math.max(...big.map((m) => per10k(m, b))) - Math.max(...big.map((m) => per10k(m, a))));
for (const k of ranked.filter((k) => Math.max(...big.map((m) => per10k(m, k))) >= 0.1).slice(0, 60)) out(`| ${k.replace(/\|/g, "\\|")} | ${big.map((m) => f1(per10k(m, k))).join(" | ")} |`);
out();

if (older && newer && stats.has(older) && stats.has(newer) && older !== newer) {
  out(`## Risers and fallers: ${older} to ${newer}`);
  out();
  out("Rules with at least 5 hits in one of the two. Ratio uses +0.5 hit smoothing.");
  out();
  const rows = [...allRules]
    .filter((k) => (stats.get(older).rules.get(k) || 0) >= 5 || (stats.get(newer).rules.get(k) || 0) >= 5)
    .map((k) => {
      const a = ((stats.get(older).rules.get(k) || 0) + 0.5) / stats.get(older).words;
      const b = ((stats.get(newer).rules.get(k) || 0) + 0.5) / stats.get(newer).words;
      return { k, a: per10k(older, k), b: per10k(newer, k), ratio: b / a };
    })
    .sort((x, y) => y.ratio - x.ratio);
  out(`| rule | ${older} | ${newer} | change |`);
  out("|---|---:|---:|---:|");
  const show = rows.length > 30 ? [...rows.slice(0, 15), ...rows.slice(-15)] : rows;
  for (const r of show) out(`| ${r.k.replace(/\|/g, "\\|")} | ${f1(r.a)} | ${f1(r.b)} | ${r.ratio.toFixed(2)}x |`);
  out();
}

out("## Pooled structure rates");
out();
out("Counted per message and summed. Prose only: code, tables and lists are excluded from the sentence counts, and bold is counted across the whole message.");
out();
out("| model | prose sentences | participial /100 sent. | tricolons /100 sent. | hedges /100 sent. | bold spans /10k words | copula avoidance /10k words | one-sentence paragraphs |");
out("|---|---:|---:|---:|---:|---:|---:|---:|");
for (const m of big) {
  const p = stats.get(m).pooled;
  const S = p.sentences || 1, W = stats.get(m).words || 1;
  out(`| ${m} | ${p.sentences} | ${((100 * p.participial) / S).toFixed(1)} | ${((100 * p.tricolon) / S).toFixed(1)} | ${((100 * p.hedge) / S).toFixed(1)} | ${f1((10000 * p.bold) / W)} | ${f1((10000 * p.copula) / W)} | ${(p.oneSent / (p.paragraphs || 1)).toFixed(2)} |`);
}
out();

// Discovery. Spread across sessions drops project vocabulary.
function spreadFilter(cands, blocks) {
  return cands.map((c) => {
    const re = new RegExp(`\\b${c.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    const s = new Set(blocks.filter((b) => re.test(b.text)).map((b) => b.session));
    return { ...c, sessions: s.size };
  }).filter((c) => c.sessions >= MIN_SESSIONS);
}
const discoveryTable = (title, cands) => {
  out(`## ${title}`);
  out();
  if (!cands.length) { out("_None above threshold._"); out(); return; }
  out("| candidate | count | sessions | ratio |");
  out("|---|---:|---:|---:|");
  for (const c of cands.slice(0, 40)) out(`| ${c.token} | ${c.count} | ${c.sessions} | ${c.ratio.toFixed(1)}x |`);
  out();
};
if (DISCOVER && older && newer && stats.has(older) && stats.has(newer) && older !== newer) {
  const nb = byModel.get(newer).blocks, ob = byModel.get(older).blocks;
  discoveryTable(`Discovery: ${newer} against ${older} (local only; may contain project words)`,
    spreadFilter(discover(nb.map((b) => b.text), ob.map((b) => b.text), { top: 300, minDocs: MIN_SESSIONS }), nb));
}
if (DISCOVER && existsSync("corpus/registers")) {
  const human = [];
  const walk = (d) => { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p) : e.endsWith(".txt") && human.push(readFileSync(p, "utf8")); } };
  walk("corpus/registers");
  const allBlocks = big.flatMap((m) => byModel.get(m).blocks);
  discoveryTable(`Discovery: all models against pre-2023 human prose (local only; may contain project words)`,
    spreadFilter(discover(allBlocks.map((b) => b.text), human, { top: 300, minDocs: MIN_SESSIONS }), allBlocks));
}

mkdirSync(OUT_DIR, { recursive: true });
const report = lines.join("\n") + "\n";
writeFileSync(join(OUT_DIR, "report.md"), report);
console.log(report);
console.error(`wrote ${join(OUT_DIR, "report.md")}`);
