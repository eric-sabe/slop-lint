#!/usr/bin/env node
/**
 * build-baseline - assemble a human reference corpus for `--discover` from MODERN
 * (past ~30 years), permissively-licensed sources across several registers. No API keys.
 * Writes corpus/baseline/<source>/ and a SOURCES.md.
 *
 *   node build-baseline.mjs
 *
 * Sources (all keyless HTTP, modern, free to use):
 *   gov-speeches/  US presidential State of the Union + Inaugural addresses (PUBLIC DOMAIN,
 *                  US-government work) - formal oratory. Via English Wikisource.
 *   medlineplus/   NIH MedlinePlus health-topic summaries (PUBLIC DOMAIN, NLM-authored) -
 *                  plain-language explainer prose. Via the MedlinePlus web service.
 *   wikinews/      English Wikinews articles (CC BY - attribution only) - journalism.
 *
 * Three registers (oratory / explainer / journalism) give a broader human reference than
 * any single source. Caveat: still not casual chat - genuinely casual modern prose is
 * almost all copyrighted. The strongest baseline you can add is your own contemporary
 * writing in the prompt genres; drop it in and re-run.
 */

import { writeFileSync, mkdirSync, rmSync } from "node:fs";

const UA = "slop-lint-baseline-builder/3.0 (https://github.com/eric-sabe/slop-lint)";
const wc = (t) => (t.match(/\S+/g) || []).length;
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
// Paragraph model: a document is an array of paragraphs (each one a single line, inner
// whitespace flattened). Files are written as paragraphs joined by a blank line ("\n\n"),
// so paragraph/heading/list-run structure survives into the baseline.
const BOILERPLATE = /^(from wikisource|wikisource\b|source:|retrieved from|this work is in the public domain|public domain\b|category:|navigation menu|jump to (navigation|search)|\[?(edit|hide|show)\]?$)/i;
const toParas = (t) => String(t).replace(/\r/g, "").split(/\n/)
  .map((l) => l.replace(/\s+/g, " ").trim()).filter((l) => l && !BOILERPLATE.test(l));
// Cap at n words at paragraph granularity; the last paragraph is cut mid-way if needed.
function capParas(paras, n) {
  const out = []; let left = n;
  for (const p of paras) {
    if (left <= 0) break;
    const w = p.split(" ");
    if (w.length <= left) { out.push(p); left -= w.length; }
    else { out.push(w.slice(0, left).join(" ")); break; }
  }
  return out;
}
const render = (paras) => paras.join("\n\n") + "\n";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fresh = (dir) => { rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true }); };

// ── 1. Presidential speeches (Wikisource; public domain US-gov work) ───────────
const MODERN = /\b(Ford|Carter|Reagan|Bush|Clinton|Obama|Trump|Biden)\b/;
async function wsTitles(query, kind) {
  const u = `https://en.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=50&format=json&formatversion=2`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  return ((await r.json()).query?.search?.map((s) => s.title) || [])
    .filter((t) => MODERN.test(t) && new RegExp(`${kind} Address`, "i").test(t));
}
async function wsExtract(title) {
  const u = `https://en.wikisource.org/w/api.php?action=query&prop=extracts&explaintext=1&exlimit=max&titles=${encodeURIComponent(title)}&format=json&formatversion=2`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  return ((await r.json()).query?.pages?.[0]?.extract || "").trim();
}
async function speeches(maxWords = 2000) {
  const dir = "corpus/baseline/gov-speeches"; fresh(dir);
  const titles = [...new Set([
    ...(await wsTitles("State of the Union Address", "State of the Union")).slice(0, 14),
    ...(await wsTitles("Inaugural Address", "Inaugural")).slice(0, 8),
  ])];
  let n = 0;
  for (const t of titles) {
    try { const x = await wsExtract(t); if (wc(x) >= 400) { writeFileSync(`${dir}/${slug(t)}.txt`, render(capParas(toParas(x), maxWords))); n++; } }
    catch (e) { console.log(`speech "${t}": ${e.message}`); }
    await sleep(150);
  }
  console.log(`gov-speeches: ${n}`); return n;
}

// ── 2. MedlinePlus health topics (NLM web service; public domain explainer prose) ──
const TERMS = ["diabetes", "asthma", "nutrition", "exercise", "sleep", "vaccines", "high blood pressure",
  "depression", "arthritis", "cholesterol", "pregnancy", "stroke", "obesity", "influenza", "anxiety",
  "allergies", "osteoporosis", "hepatitis", "migraine", "anemia"];
// Decode the escaped-HTML payload, turn block-level tags into newlines, then strip the rest.
// Returns text with "\n" at block boundaries (use toParas to split into paragraphs).
function unhtml(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/<\/?(p|li|ul|ol|div|br|h[1-6]|tr|table|dl|dt|dd|blockquote)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#0?39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&amp;/g, "&").replace(/[ \t\f\v]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
}
async function medlineplus(maxWords = 1200) {
  const dir = "corpus/baseline/medlineplus"; fresh(dir);
  const seen = new Set(); let n = 0;
  for (const term of TERMS) {
    try {
      const u = `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(term)}&retmax=1`;
      const xml = await (await fetch(u, { headers: { "User-Agent": UA } })).text();
      const title = toParas(unhtml((xml.match(/<content name="title">([\s\S]*?)<\/content>/) || [])[1] || term)).join(" ");
      const summary = toParas(unhtml((xml.match(/<content name="FullSummary">([\s\S]*?)<\/content>/) || [])[1] || ""));
      const key = slug(title);
      if (seen.has(key) || wc(summary.join(" ")) < 150) continue;
      seen.add(key); writeFileSync(`${dir}/${key || slug(term)}.txt`, render(capParas(summary, maxWords))); n++;
    } catch (e) { console.log(`medlineplus "${term}": ${e.message}`); }
    await sleep(200);
  }
  console.log(`medlineplus: ${n}`); return n;
}

// ── 3. Wikinews (CC BY; journalism) ────────────────────────────────────────────
async function wikinews(target = 22) {
  const dir = "corpus/baseline/wikinews"; fresh(dir);
  const seen = new Set(); let n = 0;
  for (let round = 0; round < 16 && n < target; round++) {
    try {
      const u = "https://en.wikinews.org/w/api.php?action=query&generator=random&grnnamespace=0&grnlimit=25" +
        "&prop=extracts&explaintext=1&exlimit=max&format=json&formatversion=2";
      const pages = (await (await fetch(u, { headers: { "User-Agent": UA } })).json()).query?.pages || [];
      for (const p of pages) {
        if (n >= target) break;
        const ex = (p.extract || "").trim();
        if (seen.has(p.pageid) || wc(ex) < 180) continue;
        seen.add(p.pageid); n++;
        writeFileSync(`${dir}/${String(n).padStart(2, "0")}-${slug(p.title)}.txt`, render(toParas(ex)));
      }
    } catch (e) { console.log(`wikinews round ${round}: ${e.message}`); break; }
  }
  console.log(`wikinews: ${n}`); return n;
}

for (const d of ["gutenberg", "scotus"]) rmSync(`corpus/baseline/${d}`, { recursive: true, force: true });
const ns = await speeches();
const nm = await medlineplus();
const nw = await wikinews();

writeFileSync("corpus/baseline/SOURCES.md", `# Baseline sources

Human reference corpus for \`slop-lint --discover\`, built by \`build-baseline.mjs\`
(\`npm run baseline\`). Modern (past ~30 years), keyless, free to use, across three registers.
Re-run to refresh. (Caveat: still formal/edited, not casual chat - genuinely casual modern
prose is almost all copyrighted. Your own contemporary writing is the strongest baseline.)

## Presidential speeches (${ns} files, \`gov-speeches/\`) - PUBLIC DOMAIN

State of the Union + Inaugural addresses, Ford through Biden. US-government works (public
domain). Retrieved from English Wikisource (https://en.wikisource.org/). Register: oratory.

## MedlinePlus health topics (${nm} files, \`medlineplus/\`) - PUBLIC DOMAIN

Health-topic summaries written by the U.S. National Library of Medicine (a federal work,
public domain). Retrieved via the MedlinePlus web service (https://medlineplus.gov/).
Register: plain-language explainer. (The summaries only; not the licensed A.D.A.M. encyclopedia.)

## Wikinews (${nw} files, \`wikinews/\`) - CC BY (attribution)

English Wikinews articles, © their contributors, licensed CC BY 2.5
(https://creativecommons.org/licenses/by/2.5/). Source: https://en.wikinews.org/. Register: journalism.
`);
console.log(`Wrote SOURCES.md (${ns + nm + nw} files across 3 registers)`);
