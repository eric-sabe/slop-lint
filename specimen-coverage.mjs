#!/usr/bin/env node
// Coverage + triage for the reply-register specimen workflow.
//
//   npm run specimens                      # coverage: do committed specimens still trip a rule?
//   npm run specimens -- harvest.txt       # triage a raw harvest (one comment per line)
//
// Coverage mode walks corpus/specimens/*.txt. Triage mode is the mining step: run it on
// freshly harvested comment text and it reports, per line, (a) which catalogue rules
// already fire, (b) any PENDING-mold sighting (a second independent sighting is the bar
// for promotion - see corpus/specimens/PENDING.md), and (c) uncaught lines, which are
// the raw material for new molds. Harvests hold third-party text: keep them out of the
// repo, and commit only content-swapped skeletons (see corpus/specimens/README.md).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { lintText } from "./slop-lint.mjs";

// Machine-readable side of corpus/specimens/PENDING.md. Keep the two in sync: one entry
// here per pending mold that is regexable (register-level observations stay prose-only).
export const PENDING_MOLDS = [
  { name: "shortens-the-distance-between", re: /\bshortens the distance between\b/i },
  { name: "worth-sitting-with", re: /\bworth sitting with\b/i },
  { name: "wearing-a-problems-clothes", re: /\bwearing an? [^.?!]{1,30}(clothes|costume)\b/i },
  { name: "whether-actually-or-whether-just", re: /\bwhether \w+ actually \w+[^.?!]{0,40}, or whether \w+ just\b/i },
  { name: "the-gap-x-cant-close", re: /\bthe gap [^.?!]{1,30}can'?t close\b/i },
  { name: "has-never-been-more", re: /\bhas never been more (important|critical|urgent|essential|relevant|true)\b/i },
  { name: "is-no-longer-x-it-is-y", re: /\bis no longer [^.?!]{1,60}[.?!]\s+it is\b/i },
  { name: "verb-echo-staccato-pair", re: /^(\w+ ){0,3}(\w{4,})s? [^.?!]{1,30}\.\s+(\w+ ){0,3}\2s?\b/i },
];

function report(label, lines) {
  let total = 0, caught = 0;
  console.log(label);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    total++;
    const { hits } = lintText(line);
    if (hits.length) caught++;
    const tags = hits.map((h) => h.replace(/^\s*\d+: [⚠✗] /, "")).join(" | ");
    const pending = PENDING_MOLDS.filter((m) => m.re.test(line)).map((m) => m.name);
    console.log(`  ${String(i + 1).padStart(3)}: ${hits.length ? "✓ " + tags : "✗ UNCAUGHT"}`);
    for (const p of pending) console.log(`       ★ PENDING-MOLD SIGHTING: ${p}`);
    if (!hits.length) console.log(`       ${line.slice(0, 90)}`);
  });
  return { total, caught };
}

const args = process.argv.slice(2);
let total = 0, caught = 0;
if (args.length) {
  for (const f of args) {
    const r = report(f, readFileSync(f, "utf8").split("\n"));
    total += r.total; caught += r.caught;
  }
} else {
  const DIR = "corpus/specimens";
  for (const f of readdirSync(DIR).filter((f) => f.endsWith(".txt")).sort()) {
    const r = report(f, readFileSync(join(DIR, f), "utf8").split("\n"));
    total += r.total; caught += r.caught;
  }
}
console.log(`\n${caught}/${total} line(s) trip at least one rule. Uncaught lines are mold candidates; ★ lines are second-sighting evidence for corpus/specimens/PENDING.md.`);
