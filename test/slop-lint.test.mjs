import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, symlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { lintText, walkFiles, discover, readConfig, WORDS, WORD_GROUPS, PHRASES, VERSION } from "../slop-lint.mjs";

const CLI = fileURLToPath(new URL("../slop-lint.mjs", import.meta.url));

test("em-dash is the one hard failure", () => {
  const { em, hits } = lintText("We shipped it — and it worked.");
  assert.equal(em, 1);
  assert.ok(hits.some((h) => h.includes("em-dash")));
});

test("counts multiple em-dashes on a line", () => {
  assert.equal(lintText("a — b — c").em, 2);
});

test("clean prose has no failures and no warnings", () => {
  const { em, hits } = lintText("The build finished in 3 seconds. Tests pass.");
  assert.equal(em, 0);
  assert.equal(hits.length, 0);
});

test("flags focal and marketing words (warnings, not failures)", () => {
  const { em, hits } = lintText("We leverage synergy to delve into robust solutions.");
  assert.equal(em, 0);
  for (const w of ["leverage", "synergy", "delve", "robust"]) {
    assert.ok(hits.some((h) => h.includes(`word "${w}"`)), `expected to flag ${w}`);
  }
});

test("flags cliche intros and constructions", () => {
  assert.ok(lintText("In today's fast-paced world, things change.").hits.some((h) => h.includes("intro")));
  assert.ok(lintText("It's not about speed, it's about trust.").hits.some((h) => h.includes("negated contrast")));
});

test("flags double-hyphen em-dash substitute and emoji", () => {
  assert.ok(lintText("yes -- really").hits.some((h) => h.includes("--")));
  assert.ok(lintText("ship it 🚀").hits.some((h) => h.includes("emoji")));
});

test("flags smart/curly quotes (a generator/word-processor tell), not straight quotes", () => {
  assert.ok(lintText("He said “hello” there.").hits.some((h) => h.includes("smart/curly quote")));
  assert.ok(lintText("It’s fine.").hits.some((h) => h.includes("smart/curly quote")));
  assert.equal(lintText('He said "hello" there.').hits.filter((h) => h.includes("smart/curly")).length, 0);
});

test("word matching is case-insensitive and whole-word", () => {
  assert.ok(lintText("LEVERAGE this").hits.some((h) => h.includes('word "leverage"')));
  assert.equal(lintText("the leveraged buyout").hits.filter((h) => h.includes('word "leverage"')).length, 0);
});

test("flags validate-then-restate reply openers", () => {
  assert.ok(lintText("That is the distinction. Strong leaders learn from setbacks.").hits.some((h) => h.includes("validate-then-restate opener")));
  assert.ok(lintText("The lever you're describing is the interesting part.").hits.some((h) => h.includes("you're describing")));
  assert.ok(lintText("You're right that nobody is pretending otherwise.").hits.some((h) => h.includes("concessive validation")));
  // mid-paragraph "that is the" is not an opener and stays clean
  assert.equal(lintText("We agree that is the file to edit next week.").hits.length, 0);
});

test("flags the uncontracted negated contrast, but not plain docs negation", () => {
  const aphorism = "The danger isn't the failure of the model. It is the rigidity that follows.";
  assert.ok(lintText(aphorism).hits.some((h) => h.includes("negated contrast (uncontracted)")));
  // no article after the negation = ordinary technical prose, not the aphorism shape
  assert.equal(lintText("This field is not required. It is optional.").hits.length, 0);
  assert.equal(lintText("The port is not open. It is closed by default.").hits.length, 0);
});

test("flags standalone aphorism molds", () => {
  const molds = [
    ["Adaptation is what keeps a temporary failure from becoming an operating model.", "is what keeps"],
    ["Leadership is measured by how quickly the organization follows.", "is measured by how"],
    ["Humor lowers the temperature without lowering the standard.", "parallel antithesis"],
    ["A plan should be treated as a hypothesis, not a promise.", "antithesis close"],
    ["The most important form of autonomy may be the ability to abandon a plan.", "hedged superlative"],
    ["The uncomfortable question is whether before is even possible.", "uncomfortable question"],
  ];
  for (const [text, tag] of molds) {
    assert.ok(lintText(text).hits.some((h) => h.includes(tag)), `expected "${tag}" for: ${text}`);
  }
});

test("parallel-antithesis backreference handles e-dropping verbs and requires the echo", () => {
  assert.ok(lintText("It raises the floor without raising the ceiling.").hits.some((h) => h.includes("parallel antithesis")));
  assert.equal(lintText("It lowers the temperature without breaking the process.").hits.length, 0);
});

test("flags corrective anaphora only when the verb echoes", () => {
  assert.ok(lintText("Nobody polices what you download, they police what you sell.").hits.some((h) => h.includes("corrective anaphora")));
  assert.equal(lintText("Nobody knows the answer yet, they said on the call.").hits.length, 0);
});

test("flags the sharp-compliment open and clause-initial worth-noting hedge", () => {
  assert.ok(lintText("That's a sharp addition and it deserves a look.").hits.some((h) => h.includes("compliment-open")));
  assert.ok(lintText("This is such a sharp way to frame the issue.").hits.some((h) => h.includes("compliment-open")));
  assert.ok(lintText("Interesting. Worth noting the spec anticipated this case.").hits.some((h) => h.includes("worth noting")));
  // "sharp" as an ordinary adjective stays clean
  assert.equal(lintText("Use a sharp knife for the tomatoes.").hits.length, 0);
});

test("flags the can/can't modal antithesis only with a verb echo, not conditionals", () => {
  assert.ok(lintText("The law can mandate the audit. It can't mandate that anyone reads it.").hits.some((h) => h.includes("modal antithesis")));
  // different verb: no echo, no hit
  assert.equal(lintText("You can read the file. You cannot edit the schema.").hits.length, 0);
  // conditional continuation is ordinary prose (MedlinePlus-style)
  assert.equal(lintText("Ask how soon you can get it. If you cannot get it, ask why.").hits.length, 0);
});

test("flags contracted and fragment openers at reply position", () => {
  assert.ok(lintText("That's the gap inspection can't close. More below.").hits.some((h) => h.includes("validate-then-restate opener")));
  assert.ok(lintText("Which might be the real test of the policy.").hits.some((h) => h.includes("fragment opener")));
  // mid-sentence "which might" stays clean
  assert.equal(lintText("We picked the option which might work best.").hits.length, 0);
});

test("flags feed-mined molds: noun-subject contrast, superlative prediction, reframes", () => {
  const cases = [
    ["Adoption isn't really a tech problem anymore, it's a change one.", "noun subject"],
    ["The rarest ones will be the ones who can turn usage into a number.", "superlative prediction"],
    ["Treat AI as a transformation initiative rather than an IT project.", "reframe"],
    ["It made ignoring it a permit failure, not just a judgment one.", "echo"],
    ["True value lies in translating capability into habits.", "aphorism open"],
    ["This really resonated with the team.", 'word "resonated"'],
    ["They don't just deploy models, but integrate them into culture.", "not just X, but Y"],
    ["The pattern is exactly what you described in the post.", "validate-then-restate"],
    ["Smart glasses don't mark the birth of surveillance, they mark its spread.", "corrective anaphora"],
  ];
  for (const [text, tag] of cases) {
    assert.ok(lintText(text).hits.some((h) => h.includes(tag)), `expected "${tag}" for: ${text}`);
  }
  // ordinary comparative prose stays clean
  assert.equal(lintText("We chose Postgres rather than keeping SQLite.").hits.length, 0);
  assert.equal(lintText("The fix isn't merged yet because CI is red.").hits.length, 0);
});

test("specimen corpus: coverage floor holds", () => {
  const lines = readFileSync("corpus/specimens/reply-register.txt", "utf8").split("\n").filter((l) => l.trim());
  const caught = lines.filter((l) => lintText(l).hits.length > 0);
  assert.ok(lines.length >= 15, "specimen corpus is non-trivial");
  assert.ok(caught.length / lines.length >= 0.8, `coverage ${caught.length}/${lines.length} fell below 80%`);
});

test("allow suppresses a word warning but leaves the rest of the line flagged", () => {
  const { hits } = lintText("We leverage synergy here.", { allow: ["leverage"] });
  assert.ok(!hits.some((h) => h.includes('word "leverage"')));
  assert.ok(hits.some((h) => h.includes('word "synergy"')));
});

test("allow is case-insensitive in both directions", () => {
  assert.equal(lintText("LEVERAGE this.", { allow: ["leverage"] }).hits.length, 0);
  assert.equal(lintText("leverage this.", { allow: ["Leverage"] }).hits.length, 0);
});

test("allow is exact per catalogue entry: allowing one form leaves siblings flagged", () => {
  const { hits } = lintText("We delve in, delving deep.", { allow: ["delve"] });
  assert.ok(!hits.some((h) => h.includes('word "delve"')));
  assert.ok(hits.some((h) => h.includes('word "delving"')));
});

test("allow suppresses a phrase pasted verbatim", () => {
  const text = "At its core, this is a deep dive.";
  assert.equal(lintText(text).hits.length, 2);
  const { hits } = lintText(text, { allow: ["at its core", "deep dive"] });
  assert.equal(hits.length, 0);
});

test("an allow entry disables every rule its text triggers (phrase and its inner word)", () => {
  const text = "A rich cultural tapestry of markets.";
  assert.equal(lintText(text).hits.length, 2); // the phrase + word "tapestry"
  assert.equal(lintText(text, { allow: ["rich cultural tapestry"] }).hits.length, 0);
});

test("allow never suppresses typographic tells", () => {
  const r = lintText("a — b -- c “quoted” 🚀", { allow: ["—", "--", "“quoted”", "🚀"] });
  assert.equal(r.em, 1);
  assert.ok(r.hits.some((h) => h.includes('"--"')));
  assert.ok(r.hits.some((h) => h.includes("smart/curly quote")));
  assert.ok(r.hits.some((h) => h.includes("emoji")));
});

test("readConfig parses a valid allow list and defaults a missing one to empty", () => {
  const dir = mkdtempSync(join(tmpdir(), "slop-lint-"));
  const good = join(dir, "good.json");
  writeFileSync(good, JSON.stringify({ allow: ["robust", "deep dive"] }));
  assert.deepEqual(readConfig(good), { allow: ["robust", "deep dive"] });
  const empty = join(dir, "empty.json");
  writeFileSync(empty, "{}");
  assert.deepEqual(readConfig(empty), { allow: [] });
});

test("readConfig throws with the path on missing, unparsable, or malformed config", () => {
  const dir = mkdtempSync(join(tmpdir(), "slop-lint-"));
  assert.throws(() => readConfig(join(dir, "nope.json")), /config .*nope\.json/);
  const bad = join(dir, "bad.json");
  writeFileSync(bad, "{ not json");
  assert.throws(() => readConfig(bad), /invalid JSON/);
  const wrong = join(dir, "wrong.json");
  writeFileSync(wrong, JSON.stringify({ allow: ["ok", 42] }));
  assert.throws(() => readConfig(wrong), /array of non-empty strings/);
});

test("catalogue is non-trivial", () => {
  assert.ok(WORDS.length > 50);
  assert.ok(PHRASES.length > 25);
});

test("walkFiles recurses dirs, filters extensions, includes explicit files as-is", () => {
  const md = walkFiles(["."]);
  assert.ok(md.includes("README.md"));
  assert.ok(!md.some((p) => p.endsWith(".json")), "should not pick up .json by default");
  assert.deepEqual(walkFiles(["package.json"]), ["package.json"]); // explicit file, any extension
});

test("walkFiles --ignore substring is honored", () => {
  assert.ok(!walkFiles(["."], { ignore: ["README"] }).includes("README.md"));
});

test("catalogue is sourced: every group has since + source, and WORDS derives from them", () => {
  for (const g of WORD_GROUPS) {
    assert.ok(g.since && g.source && Array.isArray(g.words) && g.words.length);
  }
  const flat = WORD_GROUPS.flatMap((g) => g.words);
  assert.deepEqual(WORDS, flat);
  assert.equal(new Set(WORDS).size, WORDS.length, "no duplicate words across groups");
});

test("VERSION is a semver-ish string", () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

test("VERSION matches the package.json version", () => {
  const pkg = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));
  assert.equal(VERSION, pkg.version);
});

test("CLI runs through a bin symlink (npx path) and fails on an em-dash", () => {
  // npx and package `bin` installs launch the tool via a symlink; the direct-run
  // guard must resolve argv[1] to its real path, or main never runs (exit 0, no output).
  const dir = mkdtempSync(join(tmpdir(), "slop-lint-bin-"));
  const target = join(dir, "sample.md");
  writeFileSync(target, "We shipped it — and it worked.\n");
  const link = join(dir, "slop-lint");
  symlinkSync(CLI, link);
  let code = 0, stdout = "";
  try {
    stdout = execFileSync(process.execPath, [link, target], { encoding: "utf8" });
  } catch (e) {
    code = e.status;
    stdout = e.stdout ?? "";
  }
  assert.equal(code, 1, "symlinked CLI should exit 1 on an em-dash");
  assert.match(stdout, /em-dash failure\(s\)/);
});

test("discover surfaces over-represented tokens and bigrams, excluding catalogue words", () => {
  const samples = ["widgets widgets widgets shiny widgets shiny widgets shiny"];
  const baseline = ["a quiet ordinary afternoon by the river with friends and bread"];
  const cands = discover(samples, baseline, { top: 10, minCount: 2 });
  const tokens = cands.map((c) => c.token);
  assert.ok(tokens.includes("widgets"), "should surface the over-represented unigram");
  assert.ok(tokens.includes("shiny widgets"), "should surface the over-represented bigram");
});

test("discover never re-proposes a word already in the catalogue", () => {
  const cands = discover(["delve delve delve delve"], ["river river"], { minCount: 1 });
  assert.ok(!cands.some((c) => c.token === "delve"));
});

test("discover filters one-off artifacts by document frequency", () => {
  // "zorp" recurs across 2 docs; "blarg" is repeated within a single doc only.
  const samples = ["zorp zorp zorp", "zorp zorp zorp", "blarg blarg blarg blarg blarg"];
  const cands = discover(samples, ["alpha beta gamma delta"], { minCount: 2, minDocs: 2 });
  const toks = cands.map((c) => c.token);
  assert.ok(toks.includes("zorp"), "kept: appears across multiple documents");
  assert.ok(!toks.includes("blarg"), "dropped: appears in only one document");
});

test("discover reports document frequency for surviving candidates", () => {
  const cands = discover(["frobnch good", "frobnch fast", "frobnch bright"], ["plain ordinary sample words"], { minCount: 2, minDocs: 2 });
  assert.ok(cands.some((c) => c.token === "frobnch" && c.docs === 3));
});

test("prompts.json and models.json are valid and consistent", () => {
  const p = JSON.parse(readFileSync("prompts.json", "utf8"));
  const m = JSON.parse(readFileSync("models.json", "utf8"));
  assert.ok(p.version && p.prompts.length >= 10, "a versioned, non-trivial prompt set");
  const ids = p.prompts.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, "prompt ids are unique");
  assert.ok(p.prompts.every((x) => x.id && x.genre && x.prompt), "each prompt has id/genre/prompt");
  assert.ok(m.models.length && m.models.every((x) => x.id && x.provider && x.model && x.key), "each model has id/provider/model/key");
});
