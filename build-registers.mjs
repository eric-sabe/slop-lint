#!/usr/bin/env node
// Fetch HUMAN text written before 2022-11-30 (ChatGPT's launch), one folder per register,
// into corpus/registers/<register>/*.txt, for screening slop-lint's register profiles.
//
//   node build-registers.mjs                 # every register
//   node build-registers.mjs wiki code       # only these
//   GH_TOKEN=... node build-registers.mjs pr # authenticated GitHub (larger, faster)
//
// Zero dependencies (Node 18+, global fetch; `tar` for release tarballs). Each register
// fails soft: one broken source never stops the others. Output is gitignored.
import { mkdirSync, writeFileSync, rmSync, readdirSync, readFileSync, statSync, existsSync, mkdtempSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const OUT = join(import.meta.dirname || ".", "corpus", "registers");
const UA = "slop-lint-corpus-builder/0.1 (+https://github.com/eric-sabe/slop-lint; prose-linter false-positive screening)";
const CUTOFF = "2022-06-01";
let GH = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
if (!GH) { try { GH = execFileSync("gh", ["auth", "token"], { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { /* unauthenticated */ } }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.error(...a);
const NOTES_FILE = join(OUT, "notes.json");
const prior = existsSync(NOTES_FILE) ? JSON.parse(readFileSync(NOTES_FILE, "utf8")) : {};
const notes = {};          // register -> { n, words, dates:[min,max], what, where, license, status }
const words = (t) => (t.match(/\S+/g) || []).length;

async function get(url, { headers = {}, json = false, tries = 4, wait = 0 } = {}) {
  for (let i = 0; i < tries; i++) {
    if (wait) await sleep(wait);
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, ...headers }, redirect: "follow" });
      if (r.status === 403 || r.status === 429) {
        const ra = Number(r.headers.get("retry-after")) || 0;
        const reset = Number(r.headers.get("x-ratelimit-reset")) || 0;
        const left = r.headers.get("x-ratelimit-remaining");
        const ms = ra ? ra * 1000 : left === "0" && reset ? Math.max(0, reset * 1000 - Date.now()) + 1000 : 20000 * (i + 1);
        if (ms > 120000) throw new Error(`${r.status} rate limited (${Math.round(ms / 1000)}s)`);
        await sleep(ms); continue;
      }
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
      return json ? await r.json() : await r.text();
    } catch (e) {
      if (i === tries - 1) throw new Error(`${url.slice(0, 100)}: ${e.message}`);
      await sleep(2000 * (i + 1));
    }
  }
}
const gh = (path) => get(`https://api.github.com${path}`, {
  json: true, wait: GH ? 250 : 2500,
  headers: { Accept: "application/vnd.github+json", ...(GH ? { Authorization: `Bearer ${GH}` } : {}) },
});

function reset(reg) { rmSync(join(OUT, reg), { recursive: true, force: true }); mkdirSync(join(OUT, reg), { recursive: true }); notes[reg] = { n: 0, words: 0, dates: [null, null] }; }
function save(reg, name, text, date, ext = ".txt") {
  const n = notes[reg];
  writeFileSync(join(OUT, reg, name.replace(/[^\w.-]+/g, "_").slice(0, 120) + ext), text.endsWith("\n") ? text : text + "\n");
  n.n++; n.words += words(text);
  if (date) { const d = String(date).slice(0, 10); if (!n.dates[0] || d < n.dates[0]) n.dates[0] = d; if (!n.dates[1] || d > n.dates[1]) n.dates[1] = d; }
}
const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
  .replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(+c)).replace(/&#x([0-9a-f]+);/gi, (_, c) => String.fromCodePoint(parseInt(c, 16)));

// ---- review: ICLR reviews ---------------------------------------------------------
async function review() {
  reset("review");
  // First choice: OpenReview API v1. It has sat behind a bot challenge ("ChallengeRequiredError")
  // since at least 2026; we do not try to get around that.
  try {
    const r = await fetch("https://api.openreview.net/notes?invitation=ICLR.cc/2019/Conference/-/Paper1/Official_Review&limit=1", { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error(`OpenReview API ${r.status} (bot challenge)`);
    notes.review.status = "OpenReview reachable but fetcher for it is not implemented; used mirror";
  } catch (e) { log("review: OpenReview unavailable:", e.message); }
  // Fallback: a Hugging Face mirror of OpenReview reviews (ICLR 2017-2020 human reviews).
  const ds = "pawin205/iclr-2017-2020-peer-review-with-thinking-trace";
  const total = (await get(`https://datasets-server.huggingface.co/rows?dataset=${ds}&config=default&split=train&offset=0&length=1`, { json: true })).num_rows_total;
  const seen = new Set();
  for (let k = 0; k < 30 && notes.review.n < 300; k++) {
    const off = Math.floor(((k * 0.6180339887) % 1) * (total - 100));
    const j = await get(`https://datasets-server.huggingface.co/rows?dataset=${ds}&config=default&split=train&offset=${off}&length=100`, { json: true, wait: 800 });
    for (const { row } of j.rows) {
      if (!/^iclr20(19|20)$/i.test(row.source) && !/^iclr2018$/i.test(row.source)) continue;
      const t = String(row.review || "").replace(/\r/g, "").trim();
      if (words(t) < 120 || seen.has(t.slice(0, 80))) continue;
      seen.add(t.slice(0, 80));
      if (notes.review.n >= 300) break;
      save("review", `${row.source}_${String(notes.review.n).padStart(3, "0")}`, t.replace(/\n{3,}/g, "\n\n"), row.source.replace(/\D/g, "") + "-01-01");
    }
  }
  Object.assign(notes.review, {
    what: "ICLR official reviews (review text only)",
    where: `Hugging Face mirror ${ds} (api.openreview.net was blocked by a bot challenge; not circumvented). Sources iclr2018-2020.`,
    license: "Reviews are CC BY on OpenReview; mirror terms unchecked. Local screening use only.",
  });
}

// ---- academic: arXiv abstracts ----------------------------------------------------
async function academic() {
  reset("academic");
  const cats = ["cs.CL", "cs.LG", "cs.CV", "cs.SE", "q-bio.NC", "q-bio.GN", "physics.optics", "physics.flu-dyn", "cond-mat.mes-hall", "econ.GN", "stat.ME", "stat.AP", "math.PR", "astro-ph.GA"];
  const windows = [["201601010000", "201612312359"], ["201801010000", "201812312359"], ["202001010000", "202012312359"], ["202201010000", "202205312359"]];
  const seen = new Set();
  for (const c of cats) for (const [a, b] of windows) {
    if (notes.academic.n >= 330) break;
    const q = encodeURIComponent(`cat:${c} AND submittedDate:[${a} TO ${b}]`);
    let xml;
    try { xml = await get(`https://export.arxiv.org/api/query?search_query=${q}&start=${(a.charCodeAt(3) * 7) % 200}&max_results=6&sortBy=relevance`, { wait: 3200 }); }
    catch (e) { log("academic:", e.message); continue; }
    for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const e = m[1];
      const id = (e.match(/<id>([^<]+)<\/id>/) || [])[1];
      const pub = (e.match(/<published>([^<]+)<\/published>/) || [])[1];
      const sum = decode((e.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1] || "").replace(/\s*\n\s*/g, " ").trim();
      if (!id || seen.has(id) || !pub || pub.slice(0, 10) >= CUTOFF || words(sum) < 60) continue;
      seen.add(id);
      save("academic", `${c}_${id.split("/abs/")[1] || notes.academic.n}`, sum, pub);
    }
  }
  Object.assign(notes.academic, { what: "arXiv abstracts, mixed categories (cs, q-bio, physics, cond-mat, econ, stat, math, astro-ph), 2016-2022-05", where: "export.arxiv.org API", license: "Abstracts are metadata, freely reusable per arXiv terms; screening only." });
}

// ---- pr + commits: GitHub ---------------------------------------------------------
const REPOS = ["microsoft/vscode", "kubernetes/kubernetes", "django/django", "rust-lang/rust", "facebook/react", "home-assistant/core"];
const YEARS = [2017, 2018, 2019, 2020, 2021];
async function pr() {
  reset("pr");
  const per = GH ? 70 : 30;
  for (const repo of REPOS) {
    let got = 0;
    let canon = repo;
    try { canon = (await gh(`/repos/${repo}`)).full_name || repo; } catch { /* keep name */ }
    for (const y of YEARS) {
      let yGot = 0;
      try {
        const q = encodeURIComponent(`repo:${canon} is:pr is:merged created:${y}-01-01..${y}-12-31`);
        const j = await gh(`/search/issues?q=${q}&per_page=${GH ? 60 : 30}&sort=comments&order=desc`);
        for (const it of j.items || []) {
          if (yGot >= Math.ceil(per / YEARS.length)) break;
          if (it.user?.type === "Bot" || /\[bot\]|bot$/i.test(it.user?.login || "")) continue;
          let body = String(it.body || "").replace(/\r/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/\n{3,}/g, "\n\n").trim();
          if (body.length < 200 || it.created_at.slice(0, 10) >= CUTOFF) continue;
          save("pr", `${repo.replace("/", "_")}_${it.number}`, body, it.created_at);
          got++; yGot++;
        }
        if (!GH) await sleep(6500);
      } catch (e) { log("pr:", repo, y, e.message); if (/rate limited/.test(e.message)) break; }
    }
    log(`pr: ${repo} ${got}`);
  }
  Object.assign(notes.pr, { what: "merged pull-request descriptions >200 chars, non-bot authors; HTML comments (template instructions) stripped", where: `GitHub search API; repos ${REPOS.join(", ")}; years ${YEARS[0]}-${YEARS.at(-1)}; most-commented first per year${GH ? "" : " (unauthenticated, reduced)"}`, license: "Public repo content; each repo's own license/contributor terms. Screening only." });
}
async function commits() {
  reset("commits");
  const per = GH ? 70 : 30;
  for (const repo of REPOS) {
    let got = 0;
    for (const y of YEARS) {
      if (got >= per) break;
      try {
        const j = await gh(`/repos/${repo}/commits?since=${y}-03-01T00:00:00Z&until=${y}-03-08T00:00:00Z&per_page=100`);
        for (const c of j) {
          if (got >= per) break;
          if ((c.parents || []).length !== 1 || /\[bot\]/i.test(c.author?.login || "")) continue;
          const lines = c.commit.message.replace(/\r/g, "").split("\n");
          while (lines.length && /^(Signed-off-by|Co-authored-by|Reviewed-by|Change-Id|Fixes|Closes|Differential Revision|Pull Request resolved|Reviewed By|Summary|Test Plan|Test Plan):?/i.test(lines.at(-1).trim() || "Signed-off-by")) lines.pop();
          const msg = lines.join("\n").trim();
          if (!/\n\n/.test(msg) || msg.length < 120 || c.commit.author.date.slice(0, 10) >= CUTOFF) continue;
          save("commits", `${repo.replace("/", "_")}_${c.sha.slice(0, 8)}`, msg, c.commit.author.date);
          got++;
        }
      } catch (e) { log("commits:", repo, y, e.message); if (/rate limited/.test(e.message)) break; }
    }
    log(`commits: ${repo} ${got}`);
  }
  Object.assign(notes.commits, { what: "non-merge commit messages with a body (trailers trimmed), one week of March per year", where: `GitHub REST commits API; repos ${REPOS.join(", ")}; ${YEARS[0]}-${YEARS.at(-1)}`, license: "Public repo content; each repo's own license. Screening only." });
}

// ---- code: release tarballs -------------------------------------------------------
async function code() {
  reset("code");
  const projects = [
    ["psf/requests", "v2.26.0", [".py"]], ["pallets/flask", "2.0.1", [".py"]],
    ["expressjs/express", "4.17.1", [".js"]], ["axios/axios", "v0.21.1", [".js"]],
    ["spf13/cobra", "v1.2.1", [".go"]], ["gorilla/mux", "v1.8.0", [".go"]],
    ["microsoft/TypeScript-Node-Starter", "master", []].slice(0, 0),
  ].filter((p) => p.length);
  const tmp = mkdtempSync(join(tmpdir(), "slop-code-"));
  for (const [repo, tag, exts] of projects) {
    try {
      const url = `https://codeload.github.com/${repo}/tar.gz/refs/tags/${tag}`;
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(`${r.status}`);
      const dir = join(tmp, repo.replace("/", "_")); mkdirSync(dir, { recursive: true });
      const tgz = join(dir, "src.tgz"); writeFileSync(tgz, Buffer.from(await r.arrayBuffer()));
      execFileSync("tar", ["-xzf", tgz, "-C", dir]);
      const files = [];
      const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) { if (!/^(node_modules|vendor|\.git|dist|build|docs?|examples?|testdata)$/i.test(e.name)) walk(p); }
        else if (exts.includes(extname(e.name)) && !/(\.min\.|_test\.go$|^test_|\.test\.)/.test(e.name) && statSync(p).size > 1500 && statSync(p).size < 200000) files.push(p);
      } };
      walk(dir);
      files.sort((a, b) => statSync(b).size - statSync(a).size);
      let k = 0;
      for (const f of files.slice(0, 50)) { save("code", `${basename(repo)}_${tag}__${f.slice(dir.length + 1).split("/").slice(1).join("__")}`, readFileSync(f, "utf8"), null, ""); k++; }
      log(`code: ${repo}@${tag} ${k}`);
    } catch (e) { log("code:", repo, e.message); }
  }
  rmSync(tmp, { recursive: true, force: true });
  Object.assign(notes.code, { what: "source files (largest 50 per project), original extensions kept for --code", where: projects.map((p) => `${p[0]}@${p[1]}`).join(", ") + " release tarballs from codeload.github.com", license: "Apache-2.0 / MIT / BSD-3 per project. Screening only.", dates: ["2020", "2021"] });
}

// ---- wiki: Wikipedia as of 2021-06-01 ---------------------------------------------
const WIKI = `Elon Musk|Taylor Swift|Marie Curie|Barack Obama|Serena Williams|Lionel Messi|Malala Yousafzai|Jeff Bezos|Angela Merkel|Satya Nadella|Greta Thunberg|Stephen Hawking|Ada Lovelace|Frida Kahlo|Quentin Tarantino|Oprah Winfrey|Warren Buffett|Tim Cook|Jacinda Ardern|Bong Joon-ho|Hayao Miyazaki|Toni Morrison|Haruki Murakami|Chimamanda Ngozi Adichie|Yo-Yo Ma|Katherine Johnson|Nikola Tesla|Alan Turing|Rosalind Franklin|Ruth Bader Ginsburg|Microsoft|Tesla, Inc.|Netflix|Spotify|Airbnb|Uber|Zoom Video Communications|Stripe, Inc.|Shopify|Slack Technologies|Patagonia, Inc.|IKEA|Toyota|Samsung Electronics|Nestlé|Siemens|Tata Group|Unilever|Maersk|Lego|Starbucks|Dropbox|Palantir Technologies|Atlassian|Etsy|Peloton Interactive|Moderna|Pfizer|Novo Nordisk|Lisbon|Kyoto|Nairobi|Reykjavik|Marrakesh|Vancouver|Buenos Aires|Hanoi|Tallinn|Cape Town|Florence|Tbilisi|Austin, Texas|Zanzibar|Yellowstone National Park|Lake Baikal|Patagonia|Faroe Islands|Bhutan|Luxembourg|Singapore|Iceland|Ljubljana|Cusco|Edinburgh|Chengdu|Sapporo|Salar de Uyuni|Battle of Hastings|French Revolution|Apollo 11|Fall of the Berlin Wall|Chernobyl disaster|Great Fire of London|Meiji Restoration|Partition of India|Cuban Missile Crisis|Boston Tea Party|Black Death|Suez Crisis|Rwandan genocide|Spanish flu|Treaty of Versailles|Silk Road|2008 financial crisis|Hurricane Katrina|Tōhoku earthquake and tsunami|Photosynthesis|CRISPR|Black hole|Plate tectonics|Mitochondrion|Quantum entanglement|Higgs boson|Gut microbiota|Neuroplasticity|Superconductivity|Vaccine|Antibiotic|Dark matter|Graphene|Machine learning|Blockchain|Coral reef|Photovoltaics|Tardigrade|Octopus|Honey bee|Migraine|Insulin|Periodic table|Entropy|General relativity|Cryptography|Fermentation|Jazz|Impressionism|Bauhaus|Sourdough|Origami|Chess|Flamenco|Ramen|Tango|Olympic Games|Wimbledon Championships|Tour de France|Nobel Prize|Booker Prize|Sundance Film Festival|University of Oxford|Massachusetts Institute of Technology|University of Cape Town|Mahatma Gandhi|Nelson Mandela|Simone de Beauvoir|Leonardo da Vinci|Wangari Maathai|Satyajit Ray|Yayoi Kusama|Ai Weiwei`.split("|");
const DROP_SECT = /^(references|external links|see also|notes|further reading|bibliography|footnotes|sources|citations|works cited|gallery|navigation menu)$/i;
function wikiProse(html) {
  html = html.replace(/<(style|script|table|sup|figure|div class="(?:hatnote|navbox|reflist|thumb|toc)[^"]*")[\s\S]*?<\/(?:style|script|table|sup|figure|div)>/gi, "")
    .replace(/<span class="mw-editsection">[\s\S]*?<\/span>\s*<\/span>/g, "");
  const out = []; let skip = false;
  for (const m of html.matchAll(/<h([23])[^>]*>([\s\S]*?)<\/h\1>|<p[^>]*>([\s\S]*?)<\/p>/g)) {
    if (m[1]) {
      const h = decode(m[2].replace(/<[^>]+>/g, "")).replace(/\[edit\]/g, "").trim();
      skip = DROP_SECT.test(h);
      if (!skip && h) out.push(`${m[1] === "2" ? "##" : "###"} ${h}`);
    } else if (!skip) {
      const p = decode(m[3].replace(/<[^>]+>/g, "")).replace(/\[\d+\]|\[citation needed\]/g, "").replace(/\s+/g, " ").trim();
      if (p.length > 40) out.push(p);
    }
  }
  // Drop headings with no paragraph beneath them.
  return out.filter((l, i) => !/^#/.test(l) || (out[i + 1] && !/^#/.test(out[i + 1]))).join("\n\n");
}
async function wiki() {
  reset("wiki");
  const api = "https://en.wikipedia.org/w/api.php";
  for (const title of WIKI) {
    if (notes.wiki.n >= 160) break;
    try {
      const rv = await get(`${api}?action=query&prop=revisions&titles=${encodeURIComponent(title)}&rvlimit=1&rvstart=2021-06-01T00:00:00Z&rvdir=older&rvprop=ids|timestamp&format=json&formatversion=2&redirects=1`, { json: true, wait: 150 });
      const rev = rv.query?.pages?.[0]?.revisions?.[0];
      if (!rev) { log("wiki: no revision", title); continue; }
      const p = await get(`${api}?action=parse&oldid=${rev.revid}&prop=text&disableeditsection=1&disablelimitreport=1&format=json&formatversion=2`, { json: true, wait: 150 });
      const text = wikiProse(p.parse?.text || "");
      if (words(text) < 150) continue;
      save("wiki", `${title}_${rev.revid}`, text, rev.timestamp);
    } catch (e) { log("wiki:", title, e.message); }
  }
  Object.assign(notes.wiki, { what: "English Wikipedia articles as of the last revision before 2021-06-01: prose paragraphs plus ##/### headings; refs, infobox, nav, tables, lists dropped", where: "en.wikipedia.org MediaWiki API (revisions rvdir=older, action=parse&oldid)", license: "CC BY-SA 4.0; attribution = article title + oldid in each filename. Screening only." });
}

// ---- fiction: Project Gutenberg ---------------------------------------------------
const BOOKS = [[1342, "Pride and Prejudice"], [1400, "Great Expectations"], [2701, "Moby Dick"], [1260, "Jane Eyre"], [345, "Dracula"], [84, "Frankenstein"], [76, "Huckleberry Finn"], [768, "Wuthering Heights"], [1661, "Adventures of Sherlock Holmes"], [35, "The Time Machine"], [174, "The Picture of Dorian Gray"], [219, "Heart of Darkness"]];
async function fiction() {
  reset("fiction");
  for (const [id, title] of BOOKS) {
    try {
      let txt;
      for (const u of [`https://gutenberg.pglaf.org/cache/epub/${id}/pg${id}.txt`, `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`]) {
        try { txt = await get(u, { tries: 2, wait: 1500 }); break; } catch (e) { log("fiction:", e.message); }
      }
      if (!txt) continue;
      txt = txt.replace(/\r/g, "");
      const a = txt.search(/\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/);
      const b = txt.search(/\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG/);
      if (a >= 0) txt = txt.slice(txt.indexOf("\n", a) + 1, b > a ? b : undefined);
      const parts = txt.split(/\n(?=\s*(?:CHAPTER|Chapter)\s+[IVXLC\d]+\b)/).filter((s) => words(s) > 800);
      let chunks = parts.length >= 6 ? parts.slice(1) : [];
      if (!chunks.length) { const w = txt.split(/\n\n+/); let cur = []; for (const para of w) { cur.push(para); if (words(cur.join(" ")) > 2500) { chunks.push(cur.join("\n\n")); cur = []; } } }
      chunks = chunks.slice(Math.max(0, Math.floor(chunks.length / 2) - 8), Math.floor(chunks.length / 2) + 8).slice(0, 16);
      chunks.forEach((c, i) => {
        const body = c.split(/\n{2,}/).map((p) => p.replace(/\s*\n\s*/g, " ").replace(/_/g, "").trim()).filter(Boolean).join("\n\n");
        save("fiction", `${title}_${String(i).padStart(2, "0")}`, body, "1900-01-01");
      });
      log(`fiction: ${title} ${chunks.length}`);
    } catch (e) { log("fiction:", title, e.message); }
  }
  Object.assign(notes.fiction, { what: "Project Gutenberg novels, up to 16 mid-book chapters each (headers/footers stripped); 12 titles, 1818-1902", where: "gutenberg.pglaf.org mirror (www.gutenberg.org returned 503 from this host)", license: "Public domain (US).", dates: ["1818", "1902"] });
}

// ---- email: Enron (AESLC) ---------------------------------------------------------
async function email() {
  reset("email");
  const ds = "snoop2head/enron_aeslc_emails";
  const total = (await get(`https://datasets-server.huggingface.co/rows?dataset=${ds}&config=default&split=train&offset=0&length=1`, { json: true })).num_rows_total;
  for (let k = 0; k < 40 && notes.email.n < 300; k++) {
    const off = Math.floor(((k * 0.6180339887) % 1) * (total - 100));
    let j; try { j = await get(`https://datasets-server.huggingface.co/rows?dataset=${ds}&config=default&split=train&offset=${off}&length=100`, { json: true, wait: 800 }); } catch (e) { log("email:", e.message); continue; }
    for (const { row } of j.rows) {
      const t = row.text.replace(/\r/g, "");
      const date = (t.match(/^Date: (.+)$/m) || [])[1] || "";
      let body = t.slice(t.indexOf("Body:") + 5);
      body = body.split(/\n-{3,}\s*(?:Original Message|Forwarded by)|\n_{5,}|\nFrom:.*\nSent:|\nOn .{5,80} wrote:|\n>/i)[0];
      body = body.replace(/^\s*>.*$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
      if (words(body) < 50 || words(body) > 600 || /forwarded by|original message/i.test(body)) continue;
      if (notes.email.n >= 300) break;
      save("email", `enron_${String(notes.email.n).padStart(3, "0")}`, body, new Date(date).toString() === "Invalid Date" ? null : new Date(date).toISOString());
    }
  }
  Object.assign(notes.email, { what: "Enron employee emails (AESLC subset): body only, quoted replies and forwards cut, 50-600 words", where: `Hugging Face mirror ${ds} (datasets-server rows API, spaced offsets)`, license: "Enron corpus is public domain-ish court-released data (FERC); screening only." });
}

const SKIPPED = { social: "skipped: no clean keyless pre-2023 LinkedIn-style source found. Hugging Face search for 'linkedin' returns only 2023+ datasets (cverse/linkedin 2023-02, Greich/linkedin_posts 2023-11, ...), job-posting dumps, or synthetic data; LinkedIn itself cannot be scraped." };
const ALL = { review, academic, pr, commits, code, wiki, fiction, email };

const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ALL);
mkdirSync(OUT, { recursive: true });
for (const reg of want) {
  if (!ALL[reg]) { log(`unknown register ${reg}`); continue; }
  log(`== ${reg}`);
  try { await ALL[reg](); notes[reg].status = notes[reg].n ? "ok" : "EMPTY"; }
  catch (e) { log(`${reg} FAILED: ${e.message}`); notes[reg] ||= { n: 0, words: 0, dates: [null, null] }; notes[reg].status = `FAILED: ${e.message}`; }
  log(`   ${reg}: ${notes[reg].n} docs, ${notes[reg].words} words, ${notes[reg].dates.join("..")}`);
}

// SOURCES.md: rewrite from notes plus any register folders left by earlier runs.
const rows = [];
for (const reg of [...Object.keys(ALL)]) {
  const n = notes[reg] || prior[reg];
  if (!n) continue;
  rows.push(`## ${reg}\n- Status: ${n.status}; ${n.n} documents, ${n.words} words\n- Dates: ${n.dates.filter(Boolean).join(" to ") || "n/a"}\n- What: ${n.what || ""}\n- Where: ${n.where || ""}\n- License: ${n.license || ""}\n`);
}
rows.push(`## social\n- ${SKIPPED.social}\n`);
writeFileSync(NOTES_FILE, JSON.stringify({ ...prior, ...notes }, null, 1));
writeFileSync(join(OUT, "SOURCES.md"), `# Register corpus sources\n\nHuman text written before 2022-11-30. Built by build-registers.mjs; gitignored.\nGitHub auth: ${GH ? "yes" : "no (reduced sizes)"}.\n\n${rows.join("\n")}`);
log("wrote", join(OUT, "SOURCES.md"));
