#!/usr/bin/env node
/**
 * corpus-stats - punctuation and structure rates per corpus folder. Surfaces the
 * TYPOGRAPHIC tells that `--discover` (word-based) is blind to: em-dash density (the
 * flagship), smart/curly quotes, semicolons, ellipses, bold. Useful for characterizing
 * a model's output and validating the em-dash hard-fail empirically.
 *
 *   node corpus-stats.mjs                 # each subfolder of corpus/samples
 *   node corpus-stats.mjs corpus/baseline corpus/samples/gpt
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const strip = (t) => t.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
function texts(dir) {
  const out = [];
  const walk = (d) => {
    let entries; try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      const p = join(d, e);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (/\.(md|markdown|mdx|txt)$/.test(e)) { try { out.push(strip(readFileSync(p, "utf8"))); } catch { /* skip */ } }
    }
  };
  walk(dir);
  return out;
}

const args = process.argv.slice(2);
let dirs = args.length ? args
  : (() => { try { return readdirSync("corpus/samples").map((d) => join("corpus/samples", d)).filter((p) => statSync(p).isDirectory()); } catch { return []; } })();

const rate = (n, w) => (1000 * n / (w || 1)).toFixed(1);
const rows = [];
for (const dir of dirs) {
  const ts = texts(dir);
  if (!ts.length) continue;
  let words = 0, em = 0, semi = 0, cq = 0, ell = 0, bold = 0;
  for (const t of ts) {
    words += (t.match(/\S+/g) || []).length;
    em += (t.match(/—/g) || []).length;
    semi += (t.match(/;/g) || []).length;
    cq += (t.match(/[“”‘’]/g) || []).length;
    ell += (t.match(/…/g) || []).length + (t.match(/\.\.\./g) || []).length;
    bold += Math.floor((t.match(/\*\*/g) || []).length / 2);
  }
  rows.push({ name: dir.replace(/^corpus\//, ""), words, em, semi, cq, ell, bold });
}
if (!rows.length) { console.log("corpus-stats: no text found. Generate a corpus first (npm run generate)."); process.exit(0); }

console.log("corpus               words   em-dash/1k  semicolon/1k  curlyquote/1k  ellipsis/1k  bold/1k");
for (const r of rows) {
  console.log(`${r.name.padEnd(18)} ${String(r.words).padStart(6)}   ${rate(r.em, r.words).padStart(9)}  ` +
    `${rate(r.semi, r.words).padStart(11)}  ${rate(r.cq, r.words).padStart(12)}  ${rate(r.ell, r.words).padStart(10)}  ${rate(r.bold, r.words).padStart(6)}`);
}
console.log("\nem-dash is the hard-fail tell; elevated curly-quote / semicolon rates are softer generator signals.");
