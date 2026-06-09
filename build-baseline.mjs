#!/usr/bin/env node
/**
 * build-baseline - assemble a human reference corpus for `--discover` from permissively
 * licensed sources. No keys. Writes corpus/baseline/ and a SOURCES.md with attribution.
 *
 *   node build-baseline.mjs
 *
 * Sources:
 *   - English Wikinews (CC BY 2.5): contemporary, plain factual prose. Random articles.
 *   - Project Gutenberg (public domain): a few plain-prose books for register variety.
 *
 * The strongest baseline is a large body of your own / trusted contemporary human prose
 * in the same genres as prompts.json; this is a reasonable, reproducible starter. Re-run
 * to refresh. Genre coverage is broad rather than perfectly matched - good enough because
 * real human prose rarely uses the AI tells regardless of topic.
 */

import { writeFileSync, mkdirSync, rmSync } from "node:fs";

const UA = "slop-lint-baseline-builder/1.0 (https://github.com/eric-sabe/slop-lint)";
const words = (t) => (t.match(/\S+/g) || []).length;
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44);

async function wikinews(target = 45) {
  const dir = "corpus/baseline/wikinews";
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const seen = new Set();
  let n = 0;
  for (let round = 0; round < 16 && n < target; round++) {
    const url = "https://en.wikinews.org/w/api.php?action=query&generator=random&grnnamespace=0&grnlimit=25" +
      "&prop=extracts&explaintext=1&exlimit=max&format=json&formatversion=2";
    let pages;
    try { const r = await fetch(url, { headers: { "User-Agent": UA } }); pages = (await r.json()).query?.pages || []; }
    catch (e) { console.log(`wikinews round ${round}: ${e.message}`); break; }
    for (const p of pages) {
      if (n >= target) break;
      const ex = (p.extract || "").trim();
      if (seen.has(p.pageid) || words(ex) < 200) continue;
      seen.add(p.pageid); n++;
      writeFileSync(`${dir}/${String(n).padStart(2, "0")}-${slug(p.title)}.txt`, ex + "\n");
    }
  }
  console.log(`wikinews: ${n} articles`);
  return n;
}

// Public-domain, deliberately plain (non-flowery) prose across registers.
const GUTENBERG = [
  { id: 3176, title: "The Innocents Abroad", author: "Mark Twain (1869)", note: "travel" },
  { id: 76, title: "Adventures of Huckleberry Finn", author: "Mark Twain (1884)", note: "narrative" },
  { id: 2814, title: "Dubliners", author: "James Joyce (1914)", note: "narrative" },
  { id: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle (1892)", note: "narrative" },
  { id: 2009, title: "On the Origin of Species", author: "Charles Darwin (1859)", note: "explainer/science" },
  { id: 10136, title: "The Book of Household Management", author: "Isabella Beeton (1861)", note: "how-to/practical" },
];
async function gutenberg(maxWords = 6000) {
  const dir = "corpus/baseline/gutenberg";
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  let ok = 0;
  for (const b of GUTENBERG) {
    try {
      const r = await fetch(`https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.txt`, { headers: { "User-Agent": UA } });
      if (!r.ok) { console.log(`gutenberg ${b.id}: HTTP ${r.status}`); continue; }
      let t = await r.text();
      t = t.replace(/^[\s\S]*?\*\*\*\s*START OF[\s\S]*?\*\*\*/i, "").replace(/\*\*\*\s*END OF[\s\S]*$/i, "");
      const ws = t.split(/\s+/).filter(Boolean);
      const chunk = ws.slice(300, 300 + maxWords).join(" "); // skip front matter, take a body chunk
      writeFileSync(`${dir}/${b.id}-${slug(b.title)}.txt`, chunk + "\n");
      ok++;
    } catch (e) { console.log(`gutenberg ${b.id}: ${e.message}`); }
  }
  console.log(`gutenberg: ${ok} books`);
  return ok;
}

const wn = await wikinews();
await gutenberg();

writeFileSync("corpus/baseline/SOURCES.md", `# Baseline sources

Human reference corpus for \`slop-lint --discover\`. Permissively licensed; assembled by
\`build-baseline.mjs\` (re-run to refresh).

## English Wikinews (${wn} articles, in \`wikinews/\`)

Content from English Wikinews, © its contributors, licensed **CC BY 2.5**
(https://creativecommons.org/licenses/by/2.5/). Random mainspace articles; see filenames
for titles. Source: https://en.wikinews.org/

## Project Gutenberg (in \`gutenberg/\`, public domain)

Body excerpts of public-domain works (US):

${GUTENBERG.map((b) => `- *${b.title}* — ${b.author} (${b.note}). Gutenberg #${b.id}.`).join("\n")}

Project Gutenberg (https://www.gutenberg.org/) texts are in the public domain in the US.
`);
console.log("Wrote corpus/baseline/SOURCES.md");
