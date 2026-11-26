#!/usr/bin/env node
/**
 * build-skill - regenerate skills/serious-writing/references/catalogue.md from the
 * linter's own catalogue, so the skill's ban list can never drift from slop-lint.mjs.
 *
 *   node build-skill.mjs           # write the file
 *   node build-skill.mjs --check   # exit 1 if the file is stale (used by the tests)
 *
 * Everything that names a tell sits inside a code block, which the linter skips, so the
 * generated file passes its own lint. Machine artifacts are described, never spelled
 * out: the artifact rules fail even inside code blocks.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { VERSION, WORD_GROUPS, PHRASE_GROUPS, ARTIFACTS, PROFILES, RATE_THRESHOLDS } from "./slop-lint.mjs";

export const OUT = fileURLToPath(new URL("./skills/serious-writing/references/catalogue.md", import.meta.url));

// Artifact descriptions with the literal tokens replaced, so this file never trips them.
const describe = (msg) => msg
  .replace(/oaicite \/ turn0search0/, "contentReference markers, turnNsearchN ids")
  .replace(/"Regenerate response" \(chat UI text pasted along with an answer\)/, "the chat UI's regenerate-button label pasted along with an answer")
  .replace(/\[cite: N\] \/ start_span/, "bracketed cite numbers, span markers")
  .replace(/\(【N†source】\)/, "(lenticular brackets around a dagger)");

const meta = (g) => [`since ${g.since}`, g.evidence && `evidence ${g.evidence}`, g.era && `era: ${g.era}`, g.screened && `screened ${g.screened}`]
  .filter(Boolean).join("; ");
const wrap = (words, width = 88) => {
  const lines = []; let cur = "";
  for (const w of words) { if (cur && (cur + " " + w).length > width) { lines.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w; }
  if (cur) lines.push(cur);
  return lines.join("\n");
};

// Group provenance goes inside the code block as "#" lines: sources and notes quote
// tell words, and prose outside a code block would trip the linter.
const block = (g, body) => "```\n" + [`# ${g.source}`, `# ${meta(g)}`, g.note && `# note: ${g.note}`]
  .filter(Boolean).join("\n") + "\n" + body + "\n```\n";
const rules = (g) => g.rules.map((r) => `${r.msg}${r.position ? `  [${r.position}]` : ""}\n    /${r.re.source}/${r.re.flags}`).join("\n");

export function render() {
  const out = [];
  const always = (gs) => gs.filter((g) => !g.profile);
  const byProfile = (gs, p) => gs.filter((g) => g.profile === p);
  out.push(`# Catalogue (generated)

Generated from slop-lint.mjs catalogue ${VERSION} by \`node build-skill.mjs\`. Do not edit by hand: change the linter, then regenerate. Every entry is a ban for serious-writing, whatever its severity in the linter. Matching is case-insensitive and whole-word for words. Tells are listed only inside code blocks, which the linter skips, so this file lints clean.

Evidence grades: M1 large corpus or controlled study, M2 measured but weaker, P independent practitioner reports, A anecdote. An era label records when a tell peaked. It does not lift the ban: older models stay in use.

## Typography (always)

\`\`\`
U+2014 em-dash                         FAIL. Use a comma, period, colon, or parentheses.
double hyphen used as a dash           warn. Same fix.
U+201C U+201D U+2018 U+2019 quotes     warn. Use straight quotes.
emoji, arrows, dingbats                warn. Use words ("to", "becomes").
U+202F narrow no-break space           warn. Use a plain space.
\`\`\`

## Machine artifacts (FAIL, never allowed)

These are tokens a person never types. They fail even inside code blocks, so they are described here rather than spelled out.

\`\`\`
${ARTIFACTS.map((a) => describe(a.msg)).join("\n")}
\`\`\`
`);
  out.push("## Words (always on)\n");
  for (const g of always(WORD_GROUPS)) out.push(block(g, wrap(g.words)));
  out.push("## Phrases and constructions (always on)\n\nEach entry is the linter's message, then its pattern. Rules marked `last` only apply to the last two sentences, `first` to the first sentence.\n");
  for (const g of always(PHRASE_GROUPS)) out.push(block(g, rules(g)));
  out.push("## Layout rules (always on)\n\n```\n" + [
    "stock headings (Key takeaways, Why it matters, Challenges and future directions, Future outlook)",
    "Title Case on 60%+ of 3+ subheadings: use sentence case",
    "colon-subtitle headings on 40%+ of 3+ subheadings",
    "3+ consecutive list items that open with a bold label",
    "any phrase rule matched across a soft line break inside a paragraph",
  ].join("\n") + "\n```\n");
  out.push(`## Rate advisories (documents of ${RATE_THRESHOLDS.minSentences}+ sentences)

Advisories never fail the linter. serious-writing treats each one as a finding to fix or justify. Thresholds sit at or beyond the human extreme on the repo's baseline corpus.

\`\`\`
${Object.entries(RATE_THRESHOLDS).filter(([k]) => k !== "minSentences").map(([k, v]) => `${k.padEnd(16)} ${v}`).join("\n")}
\`\`\`
`);
  out.push("## Profiles (opt-in: `--profile <name>`)\n");
  for (const [p, desc] of Object.entries(PROFILES)) {
    out.push(`### ${p}\n\n${desc}.\n`);
    for (const g of byProfile(WORD_GROUPS, p)) out.push(block(g, wrap(g.words)));
    for (const g of byProfile(PHRASE_GROUPS, p)) out.push(block(g, rules(g)));
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const text = render();
  if (process.argv.includes("--check")) {
    let cur = ""; try { cur = readFileSync(OUT, "utf8"); } catch { /* missing */ }
    if (cur !== text) { console.error("catalogue.md is stale: run `node build-skill.mjs`"); process.exit(1); }
    console.log("catalogue.md is current");
  } else {
    writeFileSync(OUT, text);
    console.log(`wrote ${OUT}`);
  }
}
