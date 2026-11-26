#!/usr/bin/env node
// Screen slop-lint's register profiles against human text in corpus/registers/<register>/.
// Build the corpus first with build-registers.mjs.
//
//   node screen-registers.mjs            # text report
//   node screen-registers.mjs --json     # machine-readable
//   node screen-registers.mjs pr wiki    # only these registers
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { lintText, PROFILES, CODE_EXTS, PHRASES, WORD_GROUPS, docRates, extractComments, RATE_THRESHOLDS } from "./slop-lint.mjs";

const ROOT = join(import.meta.dirname || ".", "corpus", "registers");
const PROFILE_OF = { review: "review", academic: "academic", pr: "pr", commits: "pr", code: "code", wiki: "wiki", fiction: "fiction", email: "email", social: "social" };
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const only = args.filter((a) => !a.startsWith("--"));

// message -> profile, for every profile-gated rule
const profileMsg = new Map();
for (const g of WORD_GROUPS) if (g.profile) for (const w of g.words) profileMsg.set(`word "${w}"`, g.profile);
for (const p of PHRASES) if (p.profile) profileMsg.set(p.msg, p.profile);
const contrastMsgs = new Set(PHRASES.filter((p) => p.family === "contrast").map((p) => p.msg));
const rulesByMsg = new Map(PHRASES.map((p) => [p.msg, p]));

const norm = (h) => {
  const m = h.match(/^\s*(\d+): [^\s]+ (.*)$/s);
  if (!m) return null;
  let msg = m[2].replace(/ \(across lines\)$/, "");
  if (/^em-dash ×/.test(msg)) msg = "em-dash";
  if (/^PR template headings/.test(msg)) { profileMsg.set("PR template headings", "pr"); msg = "PR template headings"; }
  if (/^stock heading ".*" \(wiki\)$/.test(msg)) { msg = "stock heading (wiki)"; profileMsg.set(msg, "wiki"); }
  if (/^Title Case headings/.test(msg)) msg = "Title Case headings";
  if (/^colon-subtitle headings/.test(msg)) msg = "colon-subtitle headings";
  if (/^bold lead-in bullets/.test(msg)) msg = "bold lead-in bullets";
  if (/^stock heading "/.test(msg)) msg = "stock heading";
  return { n: +m[1], msg };
};
const ADV = [
  ["sentence-uniform", /^sentence lengths/], ["participial", /^participial/], ["nominalization", /^nominalizations/],
  ["tricolon", /^three-item/], ["hedge", /^performed hedges/], ["contrast", /^negative-contrast/], ["copula", /serves\/stands/],
  ["bold", /bold spans/], ["one-sentence-pars", /one sentence/], ["intensifier", /^intensifiers/],
];
const advType = (a) => (ADV.find(([, re]) => re.test(a.replace(/^\s*ℹ /, ""))) || ["other"])[0];
const METRICS = ["sentenceCV", "participial", "nominalization", "tricolon", "hedge", "contrast", "copula", "boldPer1k", "oneSentencePars", "intensifier"];
const pct = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };
const r3 = (x) => (x === null ? null : Math.round(x * 1000) / 1000);

const regs = readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory() && (!only.length || only.includes(d.name))).map((d) => d.name).sort();
const report = {};
for (const reg of regs) {
  const profile = PROFILE_OF[reg];
  const dir = join(ROOT, reg);
  const files = readdirSync(dir).filter((f) => f !== ".DS_Store").sort();
  const isCode = reg === "code";
  const R = { docs: 0, words: 0, profile, runs: { profile: { rules: {}, adv: {}, advDocs: 0 }, none: { rules: {}, adv: {}, advDocs: 0 } }, rates: {}, long: 0 };
  const rateVals = Object.fromEntries(METRICS.map((m) => [m, []]));
  for (const f of files) {
    const text = readFileSync(join(dir, f), "utf8");
    const code = isCode ? CODE_EXTS[extname(f).toLowerCase()] || null : null;
    if (isCode && !code) continue;
    R.docs++; R.words += (text.match(/\S+/g) || []).length;
    const lines = (code ? extractComments(text, code) : text).split("\n");
    for (const [key, profiles] of [["profile", profile ? [profile] : []], ["none", []]]) {
      const res = lintText(text, { profiles, rates: true, code });
      const run = R.runs[key];
      const seen = new Set();
      let contrast = 0;
      for (const h of res.hits) {
        const x = norm(h); if (!x) continue;
        if (contrastMsgs.has(x.msg)) contrast++;
        const e = (run.rules[x.msg] ||= { hits: 0, docs: 0, examples: [] });
        e.hits++;
        if (!seen.has(x.msg)) { e.docs++; seen.add(x.msg); }
        if (e.examples.length < 2 && profileMsg.has(x.msg)) {
          const rule = rulesByMsg.get(x.msg);
          const line = (lines[x.n - 1] || "").trim();
          const m = rule && line.match(rule.re);
          const at = m ? Math.max(0, m.index - 45) : 0;
          e.examples.push(`${f}:${x.n}: ${line.slice(at, at + 110)}`);
        }
      }
      if (res.advisories.length) run.advDocs++;
      for (const a of res.advisories) { const t = advType(a); run.adv[t] = (run.adv[t] || 0) + 1; }
      if (key === "profile" && !code) {
        const r = docRates(text, { contrastHits: contrast });
        if (r.sentences >= RATE_THRESHOLDS.minSentences) { R.long++; for (const m of METRICS) if (r[m] !== null) rateVals[m].push(r[m]); }
      }
    }
  }
  for (const m of METRICS) {
    const v = rateVals[m];
    R.rates[m] = v.length ? { p10: r3(pct(v, 10)), p50: r3(pct(v, 50)), p90: r3(pct(v, 90)), max: r3(Math.max(...v)) } : null;
  }
  report[reg] = R;
}

if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

for (const [reg, R] of Object.entries(report)) {
  console.log(`\n==== ${reg}: ${R.docs} docs, ${R.words} words, profile=${R.profile || "(none)"}, docs with 15+ sentences=${R.long}`);
  const run = R.runs.profile;
  const rows = Object.entries(run.rules);
  const isProf = ([msg]) => profileMsg.get(msg) === R.profile && R.profile;
  const show = (title, list) => {
    console.log(`  -- ${title} (${list.length})`);
    for (const [msg, e] of list.sort((a, b) => b[1].docs - a[1].docs || b[1].hits - a[1].hits))
      console.log(`  ${String(e.hits).padStart(5)} hits ${String(e.docs).padStart(4)} docs  ${msg}`);
  };
  show("profile rules", rows.filter(isProf));
  for (const [msg, e] of rows.filter(isProf)) for (const ex of e.examples) console.log(`      e.g. [${msg.slice(0, 40)}] ${ex}`);
  show("always-on rules (profile run)", rows.filter((r) => !isProf(r)));
  const adv = (r) => Object.entries(r.adv).map(([k, v]) => `${k}=${v}`).join(" ") || "none";
  console.log(`  -- advisories (profile run): ${adv(run)}; docs with any: ${run.advDocs}/${R.long}`);
  console.log(`  -- advisories (no-profile run): ${adv(R.runs.none)}; docs with any: ${R.runs.none.advDocs}/${R.long}`);
  if (R.profile) {
    const none = R.runs.none.rules;
    const newly = rows.filter(([m]) => !none[m] && !isProf([m]));
    if (newly.length) console.log(`  -- note: always-on rules only seen with profile: ${newly.map(([m]) => m).join("; ")}`);
  }
  if (R.long) {
    console.log(`  -- rate percentiles over ${R.long} docs (p10 / p50 / p90 / max)`);
    for (const m of METRICS) { const x = R.rates[m]; if (x) console.log(`     ${m.padEnd(16)} ${x.p10} / ${x.p50} / ${x.p90} / ${x.max}`); }
  }
}
