#!/usr/bin/env node
/**
 * Catalogue refresh - assembles a review report of candidate new tells. Self-contained:
 * no API keys, no private infra. Two public, reproducible sources:
 *
 *   1. Wikipedia          - the maintained "Signs of AI writing" essay's "Words to watch",
 *                           diffed against our catalogue and against the decisions already
 *                           recorded in corpus/refresh-reviewed.json, so each item is
 *                           raised once.
 *   2. Corpus discovery   - (--corpus only) over-represented tokens in corpus/samples vs
 *                           corpus/baseline, kept only when they recur across many prompts.
 *                           Off by default: the corpus is static, so a monthly run would
 *                           repeat the same table.
 *
 * Writes refresh-report.md and prints it. When GITHUB_OUTPUT is set, also writes
 * `new=<n>` (-1 when the source was unreachable) so the monthly workflow
 * (.github/workflows/catalogue-refresh.yml) files an issue only when there is
 * something new. Nothing auto-updates the catalogue: a human reviews the report, adds
 * the real tells with a source, and records every decision in refresh-reviewed.json.
 *
 *   node refresh.mjs [--corpus]
 */

import { writeFileSync, existsSync, appendFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { discover, ALL_WORDS, PHRASES, VERSION } from "./slop-lint.mjs";

const REVIEWED_PATH = "corpus/refresh-reviewed.json";
const MIN_PROMPT_SHARE = 0.25; // a corpus candidate must recur in a quarter of the prompts

function readDir(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(md|markdown|mdx|txt)$/.test(e)) { try { out.push({ path: p, text: readFileSync(p, "utf8").replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n/, "") }); } catch { /* skip */ } }
    }
  };
  walk(dir);
  return out;
}

export function loadReviewed(path = REVIEWED_PATH) {
  if (!existsSync(path)) return {};
  const data = JSON.parse(readFileSync(path, "utf8"));
  return Object.fromEntries(Object.entries(data.wikipedia || {}).map(([k, v]) => [k.toLowerCase(), v]));
}

// Wikipedia writes items as templates: "...in the provided/available sources / search
// results...", "[claim] should be [treated/presented] as". Expand them into concrete
// phrases so the catalogue's regexes get a fair test. " / " separates whole
// alternatives; "a/b" inside a phrase is a one-word alternation; [x] is a placeholder.
export function expandTemplate(item, cap = 64) {
  const clean = item.replace(/&nbsp;/g, " ").replace(/\.\.\.|\u2026/g, " ").replace(/\[[^\]]*\]/g, "X");
  const out = new Set();
  for (const alt of clean.split(/\s+\/\s+/)) {
    let forms = [""];
    for (const word of alt.trim().split(/\s+/).filter(Boolean)) {
      const opts = word.split("/").filter(Boolean);
      forms = forms.flatMap((f) => opts.map((o) => (f ? f + " " : "") + o)).slice(0, cap);
    }
    for (const f of forms) if (f.trim()) out.add(f.trim());
  }
  return [...out];
}

const known = new Set(ALL_WORDS.map((w) => w.toLowerCase()));
export function isCovered(item) {
  const forms = expandTemplate(item);
  if (forms.some((f) => PHRASES.some((p) => p.re.test(f) || p.re.test(f + ".")))) return true;
  const toks = item.match(/[a-z][a-z'-]{3,}/g) || [];
  return !toks.length || toks.some((t) => known.has(t));
}

// ── 1. Corpus discovery ────────────────────────────────────────────────────────
function corpusSection() {
  const samples = readDir("corpus/samples"), baseline = readDir("corpus/baseline");
  if (!samples.length || !baseline.length) {
    return "## Corpus discovery\n\n_Skipped: add text to `corpus/samples` (model output) and `corpus/baseline` (human) and re-run._\n";
  }
  // Samples are named NN-<prompt>.md, one per model. A word that over-represents because
  // the prompt was about coffee clusters in a few prompts; a register tell spreads.
  const prompt = samples.map((s) => basename(s.path).replace(/^\d+-/, "").replace(/\.\w+$/, ""));
  const nPrompts = new Set(prompt).size;
  const minPrompts = Math.max(2, Math.ceil(nPrompts * MIN_PROMPT_SHARE));
  const texts = samples.map((s) => s.text);
  const cands = discover(texts, baseline.map((b) => b.text), { top: 400 })
    .map((c) => {
      const re = new RegExp(`\\b${c.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return { ...c, prompts: new Set(prompt.filter((_, i) => re.test(texts[i]))).size };
    })
    .filter((c) => c.prompts >= minPrompts)
    .slice(0, 25);
  if (!cands.length) return "## Corpus discovery\n\n_No over-represented tokens recur across enough prompts._\n";
  const rows = cands.map((c) => `| ${c.token} | ${c.count} | ${c.prompts}/${nPrompts} | ${c.ratio.toFixed(1)}× |`).join("\n");
  return `## Corpus discovery\n\nOver-represented in \`corpus/samples\` vs \`corpus/baseline\`, not in the catalogue, and found in at least ${minPrompts} of ${nPrompts} prompts. The baseline is small (about 60k words), so treat the ratios as a ranking, not a measurement.\n\n` +
    `| candidate | count | prompts | over-representation |\n|---|---:|---:|---:|\n${rows}\n`;
}

// ── 2. Wikipedia "Signs of AI writing" ─────────────────────────────────────────
async function wikipediaSection() {
  const url = "https://en.wikipedia.org/w/api.php?action=parse&page=Wikipedia:Signs_of_AI_writing&prop=wikitext&format=json&formatversion=2";
  let wikitext;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "slop-lint catalogue-refresh (https://github.com/eric-sabe/slop-lint)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    wikitext = (await res.json()).parse.wikitext;
  } catch (e) {
    return { md: `## Wikipedia: Signs of AI writing\n\n_Source unavailable this run (${e.message})._\n`, fresh: -1 };
  }
  // Extract the italic items inside each "Words to watch: {{strong|''a'', ''b''}}".
  const items = new Set();
  for (const m of wikitext.matchAll(/Words to watch:\s*\{\{strong\|([^}]*)\}\}/gi)) {
    for (const it of m[1].matchAll(/''([^'']+)''/g)) {
      const phrase = it[1].replace(/\[\[|\]\]/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
      if (/[a-z]/.test(phrase) && phrase.length < 60) items.add(phrase);
    }
  }
  if (!items.size) return { md: "## Wikipedia: Signs of AI writing\n\n_No parseable 'Words to watch' items this run (page format may have changed)._\n", fresh: -1 };
  const reviewed = loadReviewed();
  const all = [...items];
  const covered = all.filter(isCovered);
  const decided = all.filter((i) => !isCovered(i) && i in reviewed);
  const fresh = all.filter((i) => !isCovered(i) && !(i in reviewed)).sort();
  const body = fresh.length
    ? fresh.map((g) => `- ${g}`).join("\n")
    : "_Nothing new: every item is covered or already reviewed._";
  const md = `## Wikipedia: Signs of AI writing\n\n${items.size} "Words to watch" items: ${covered.length} matched by the catalogue, ${decided.length} reviewed earlier (see \`${REVIEWED_PATH}\`), ${fresh.length} new:\n\n${body}\n`;
  return { md, fresh: fresh.length };
}

// ── Assemble ────────────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("refresh.mjs")) {
  const stamp = process.env.REFRESH_DATE || "this run"; // CI passes a date; keep deterministic otherwise
  const wiki = await wikipediaSection();
  const corpus = process.argv.includes("--corpus") ? `${corpusSection()}\n` : "";
  const report = `# slop-lint catalogue refresh

Candidate new tells for review (catalogue v${VERSION}, ${stamp}). Nothing here is added automatically. For each item: confirm the tell is real, add it to \`WORD_GROUPS\` / \`PHRASE_GROUPS\` with a source and a baseline screen, note it in \`CHANGELOG.md\`, and record the decision (added, rejected or held, with the reason) in \`${REVIEWED_PATH}\` so the item is not raised again.

${wiki.md}
${corpus}---
_Generated by \`refresh.mjs\`. Source: Wikipedia:Signs of AI writing${corpus ? " and corpus frequency analysis" : ""}._
`;
  writeFileSync("refresh-report.md", report);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `new=${wiki.fresh}\n`);
  console.log(report);
}
