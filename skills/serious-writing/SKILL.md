---
name: serious-writing
description: "Apply to every reply and every written deliverable: chat answers, files, commit messages, PR descriptions, code comments, email, docs, reports, specs, proposals and papers. Covers two things. First, the slop-lint contract: write so the linter (catalogue 0.10.1) reports zero FAIL and zero WARN lines, with each advisory rate fixed or justified, plus the structural tells no regex can see. Second, professional-writing craft: twelve commandments, each with a test you run on your own draft, for any document a cold expert reader will act on or judge. Load references/academic.md for papers, theses, abstracts, research proposals, literature reviews and peer reviews. Load references/registers.md for chat, email, social posts, PR and commit text, code comments and encyclopedic articles. Replaces no-ai-tells and serious-academic."
---

# serious-writing

This skill has two jobs. Every output passes the slop-lint linter clean, and every professional deliverable reads as the work of someone who knows what the reader needs. Tier 1 applies to all output. Tier 2 adds craft rules for professional deliverables. Tier 3 points to the references for academic writing and for specific registers.

Precedence: Tier 1 binds everything, with only the exceptions listed at its end. Where a register reference and Tier 2 disagree (a commit message has no paragraphs), the register reference wins.

Evidence marks: "(measured: Study)" means a corpus study or controlled experiment supports the rule. Unmarked rules come from craft sources or practitioner consensus. The research behind each rule is in `docs/research/2026-11-llm-writing-tells.md` in the slop-lint repository (github.com/eric-sabe/slop-lint).

## Tier 1. Every output

Scope: chat replies, files, commit messages, PR bodies, code comments and docstrings.

### The linter contract

slop-lint is the linter, and this skill is how to write so it finds nothing. It also covers the checks the linter cannot run.

```
node slop-lint.mjs <file>                                    # inside a slop-lint checkout
npx -y github:eric-sabe/slop-lint <file>                     # anywhere, main branch
npx -y github:eric-sabe/slop-lint --fail-on-warn --profile pr <file>
```

This skill tracks catalogue 0.10.1. Check that `--version` prints 0.10.1 or later before relying on a clean run.

The linter prints three kinds of line, each with its own symbol (a cross, a warning sign, an information sign):

```
FAIL      exit 1. The em-dash, and machine artifacts humans never type: chat
          citation residue (ChatGPT content-reference and search-turn markers,
          Gemini cite brackets), chatbot tracking parameters on links, and the
          chat UI's regenerate-button label pasted with an answer.
WARN      Words, phrases, constructions, smart quotes, emoji, heading and list
          layout rules, matches that span lines.
advisory  A document rate, printed for documents of 15+ sentences, never failing.
          Sentence-length variation, participial clauses, nominalization density,
          tricolons, hedge rate, negative-contrast density, copula avoidance, bold
          and heading density, one-sentence-paragraph share, intensifier density.
```

Machine artifacts fail even inside code blocks, so never paste them anywhere in a file.

The target is zero FAIL lines and zero WARN lines, with every advisory either fixed or justified in one sentence to the person who asked. A reference table that needs a heading per section is a valid justification. Treat a warning as a ban, the way `--fail-on-warn` does.

Register groups are opt-in. Pass `--profile <name>` (repeatable, or a comma list), or name them in `.slop-lint.json` next to the file:

```
{"allow": ["tapestry"], "profiles": ["pr"]}
```

| Writing | Profile |
| --- | --- |
| PR description, commit message | `pr` |
| Email | `email` |
| LinkedIn-style post | `social` |
| Fiction | `fiction` |
| Encyclopedic article | `wiki` |
| Peer review | `review` |
| Paper, abstract, research proposal | `academic` |
| Comments in code files | `code`, or `--code` |

`--no-rates` turns the advisories off. Use it for code files and for text under 15 sentences, where the rates mean little.

The ban list lives in `references/catalogue.md`. That file is generated from `slop-lint.mjs` and lists every word, phrase and structural rule with its regex, its message and its group, plus the profile groups. It is authoritative for what is banned. This file is authoritative for how to fix a hit. Era labels in the catalogue mark vocabulary from older models and do not lift a ban, because older models stay in use.

A clean run shows the text avoids the catalogue. It says nothing about authorship or quality, and most of what follows is what the linter cannot see.

### Typography

T1. No em-dash (U+2014). Use a comma, period, colon or parentheses, and never an en-dash, a spaced hyphen or a double hyphen in its place. The ban is house style. As an authorship signal the em-dash is strongest for Claude through Opus 5 and for older OpenAI output, and newer models suppress it (measured: The Economist 2026, the repo corpus). After removing a dash, reread the sentence for a comma splice, a crashed clause, or a new run of short sentences of equal length.

T2. Straight quotes and apostrophes only.

T3. No emoji, arrows or dingbats. Write "to", "becomes" or "then".

T4. Bold appears at most about five times per document, never on a whole sentence, and only on what a scanner must find: a deadline, a prohibition, a name. Human prose averages 2 bold spans per 10k words against 65 for model output (measured: Pangram 2026). Never write three or more consecutive bullets that open with a bold label and a colon. Write those items as prose or as a table. Bold habits differ by family and drift by version: Claude output often has no bold at all, yet Opus 5.5 used 2.5 times the bold lead-in bullets of Opus 5, so check for the runs in every draft (measured: Sun et al. 2025, Bennett 2026).

T5. A semicolon stays when it gives a related second point its own stress position. A semicolon that joins unrelated facts becomes a period. Semicolon count alone is no tell: three of four model samples in the repo corpus use fewer than the human baseline.

T6. Headings use sentence case. A heading names its content or states a finding. Do not write colon-reveal headings, do not reach for stock headings, and keep colon subtitles under about four in ten headings. Prose is the default, and a heading per paragraph is inflation (measured: Pangram 2026, 0.5 headers per 10k words for humans against 11 for models).

```
colon reveal:   "## The fix: caching"           -> "## Cache the token check"
stock headings: Key takeaways, Why it matters, Future outlook, Challenges and future directions
```

### Words, phrases and constructions

Every catalogue hit gets a rewrite. The usual fix is the concrete thing the vague word stood for. Default replacements for the most frequent hits:

```
leverage, utilize, harness            -> use
enhance, elevate, bolster             -> improve | <the specific verb>
pivotal, paramount, crucial           -> main | (delete)
additionally, furthermore, moreover   -> also | (delete)
nevertheless, nonetheless             -> but | still
comprehensive                         -> full | complete
robust                                -> reliable | <what it survives>
seamless, seamlessly                  -> (delete) | "with no X"
landscape, ecosystem, realm           -> <the nouns: market, tools, field>
journey, roadmap                      -> process | plan
navigate                              -> handle | work through
delve                                 -> look at | examine
showcase                              -> show
foster                                -> encourage | build
notable, noteworthy                   -> (delete) | say why it counts
streamline                            -> simplify | shorten
empower, unlock, unleash              -> let | allow
innovative, groundbreaking, cutting-edge, unprecedented, unparalleled -> new | say what is new
myriad, plethora                      -> many | <the number>
testament                             -> shows
elucidate                             -> explain
unveil                                -> show | release
pinpoint                              -> find
interplay                             -> interaction | <name the relation>
load-bearing                          -> essential | <name what depends on it>
quietly, genuinely, honestly, incredibly -> (delete)
```

Phrase families, each with its fix:

```
OPENERS   Certainly! | Great question | I'd be happy to help | you're absolutely right
          -> delete; the first sentence is the answer
CLOSERS   let me know if you'd like | would you like me to | is there anything else
          | I hope this helps | in conclusion | to sum up
          -> delete; end on the last useful fact
STAGING   let that sink in | read that again | here's the kicker | The result? ...
          | This matters. | Full stop. | earns its keep | doing a lot of work
          | that's the whole point | the real unlock | let's break this down
          -> delete the stage direction and keep the content
PUFFERY   plays a crucial role | is a testament to | as a stark reminder
          | despite these challenges | the complex interplay | become a focal point
          | renewed sense of purpose
          -> say what happened, with a number or a name
HEDGE     it's worth noting | could potentially | may possibly | generally speaking
          -> delete, or state the uncertainty once
META      this article will explore | let's dive in | here's why
          -> delete; start with the content
LEAKAGE   as an AI | as of my last knowledge update | I don't have access to real-time
          | Here is a revised version | pasted chat UI button text
          -> delete; never paste chat residue into a deliverable
```

The negative-contrast family is the most frequent construction. Test each candidate by swapping its content nouns. If the sentence keeps its shape, it is the mold, so rewrite it as a plain declarative of the positive claim.

```
not just X, but Y | doesn't just X, it Y           -> state Y
it's not X, it's Y | X isn't the A. It's the B      -> state B
is no longer X. It is Y.                            -> state Y and when it changed
Not because X. Because Y.                           -> "because Y"
The question isn't X. The question is Y.            -> ask Y
Not X. Not Y. Just Z. | no X, no Y, just Z          -> state Z
can X ... can't X (verb echo)                       -> one sentence, one claim
as an X rather than a Y                             -> "as an X"
lowers X without lowering Y                         -> two plain clauses
the real question is | the uncomfortable truth is   -> ask the question, state the fact
```

One instance of the family is human-plausible. Model text runs about six times the human rate (measured: Antislop 2025), so the linter warns on each hit and the advisory tracks density. Rhetorical questions in general are fine, since humans ask assertive rhetorical questions at twice the model rate (measured: Bakhshi 2026). Only the self-answered fragment question is banned.

### Structural tells the linter cannot see

Read for these. Each row gives the test to run and the fix.

| id | Tell | Test | Fix |
| --- | --- | --- | --- |
| R1 | Rule of three | For each triple of adjectives, examples or clauses, count the items the facts supply. Model essays carry nearly twice the expert tricolon count per document (7.13 against 3.73), about 1.7 times per sentence after a length adjustment (measured: Bakhshi 2026) | Use the count the facts have |
| R2 | Participial tail | Find sentences that end in a comma plus an -ing clause (`, ensuring ...`, `, highlighting ...`). GPT-4o uses present participial clauses at 5.3 times the human rate (measured: Reinhart et al., PNAS 2025) | Cut the tail, or make it a sentence with its own subject |
| R3 | Significance inflation | Look for milestone, legacy, turning point, broader trend | Say what happened |
| R4 | Vague attribution | Look for `experts say`, `observers note`, `studies have shown`, `research has shown` | Name the source and what it found, or drop the claim |
| R5 | Synonym cycling | One referent with three or more names | Repeat the word |
| R6 | Header and bullet inflation | A heading per paragraph, a bullet per sentence, Title Case headings | Prose; a list only for parallel items a reader scans |
| R7 | Recap close | The last paragraph restates the body | End on the last useful fact |
| R8 | Callback close | The last sentence returns to an earlier metaphor | Delete it |
| R9 | Register mismatch | Uncontracted "it is", "does not" in chat or code comments | Contract in conversation |
| R10 | Praise or agreement opener | The first sentence judges the question or agrees (`Great question`, `Spot on`, `I love this framing`) | Delete; the first sentence is the answer |
| R11 | Offer-of-help close | The last sentence offers more help | Delete |
| R12 | Missing final period | A polished multi-paragraph reply ends without punctuation | Add it |
| R13 | Salience flag | A sentence whose only job is to announce that the next one is important (`This matters.`) | Delete; let the content show its weight |
| R14 | Verdict intensifier | `that's the whole point`, `that's not an accident` | Delete |
| R15 | Gotcha signpost | `here's the catch`, `the hard part is`, `what nobody tells you` | State the catch as a fact where it applies |
| R16 | Stock metaphor | `a dial worth turning`, `north star`, `sharp edges`, `a useful lens`, `where it falls over` | Name the literal thing |
| R17 | Mannered prose | A phrase chosen to sound written; Anthropic's own style guide gives `earns its keep` as the example. Ask whether the reader's team would say it in a meeting | The literal verb and noun |
| R18 | Broetry | Stacked one-sentence paragraphs; the linter advises when they pass 85% of eight or more paragraphs, a bar set above human oratory, and any run of three in prose is worth a look | Join sentences that share a point |
| R19 | Copula avoidance | `serves as`, `stands as`, `functions as`, `acts as` where "is" fits | "is" |
| R20 | Writing about the document | `The table below compares`, `In this section we`, `As mentioned above` | State the content. Introduce a table with what it shows |
| R21 | Arguing with no one | `I'm not saying X, but`, `a tempting approach would be`, a rebuttal nobody asked for | Delete (commandment 5) |
| R22 | Wrong-reader reply | The reply re-explains background the asker supplied, and the answer arrives last | Put the answer first and cut the supplied background |
| R23 | Heading echo | The first sentence under a heading repeats the heading | Start with new content |
| R24 | Colon reveal in prose | `The secret: X.` | State X as a sentence |
| R25 | Code and commit leakage | Chat phrasing, step narration, history or placeholder text in code comments; stock headings or boilerplate test claims in a PR; markdown in a commit message | See references/registers.md |

Bennett's six moves (salience flag, contrast reframe, verdict intensifier, signpost, gotcha framing, stock metaphor) are R13 to R16 plus the negative-contrast family. Salience flags alone were 48 of the 153 hand flags in that study on Opus 5 output (measured: Bennett 2026).

### Defaults

- The first sentence is the answer, decision or fact the reader came for.
- Specific beats general: a number, name, date, path or command.
- Say each thing once, with no preview and no recap.
- Plain verbs: use, fix, run, check, move, cut, add, show.
- Hedge only where uncertainty exists. Use one marker per claim, matched to the evidence. Never stack qualifiers, and never hedge a measured value: write "The job failed 14 times", and drop "The job appears to have failed around 14 times". Model argumentative essays carry fewer calibrated hedges than human ones and about twice the performed ones (measured: Crosthwaite et al. 2026, Bakhshi 2026). So move each hedge to where the uncertainty is. Adding hedges overall is the wrong fix, and so is stripping them all. For academic stance rules, see references/academic.md.
- Use the reader's own names for their things: product names, team terms, file names.
- Use contractions in conversation and code comments, and the formal register in deliverables (Tier 2).
- Use punctuation a person types: `, . : ( ) " '`
- Let sentence length vary because the content varies. Do not fake variation. Inserting short sentences to break the rhythm is a tell of its own, and an explicit instruction to vary sentences still left 5 of 9 models flatter than human news (measured: Lanzo and Angelo 2026, abstract only). A sentence with one item to stress is short, and a sentence that carries a condition and its result is longer.
- Do not discuss banned words in prose. When you report a lint fix, put the word in a code span next to its replacement. Naming a tell in running text may prime it (anecdotal, one report).

### Pre-send procedure

```
1. Typography. Search for U+2014, a spaced double hyphen, U+2018 to U+201D,
   emoji and arrows.                                                Must be 0.
2. Words and phrases. Scan against the maps above and references/catalogue.md.
   Rewrite each hit.
3. Constructions. For every sentence containing not, isn't, doesn't, no longer,
   rather than, without or because, run the noun-swap test.
4. Structure pass, always, even when steps 1 to 3 found nothing.
   First sentence: R10, R22. Last sentence: R7, R8, R11, R12.
   Then R1 triples, R2 sentence-final -ing clauses, T4 bold and bullet runs,
   T6 headings, R18 one-sentence paragraphs, R19 copulas, R13 to R16.
5. Run the linter with the register's profile:
     npx -y github:eric-sabe/slop-lint --fail-on-warn --profile <name> <file>
   Fix every FAIL and WARN. Fix each advisory or say why it stands.
6. Rerun until clean.
```

Step 4 runs even when step 2 is clean, because suppressing one tell moves output to another. Opus 5.5 nearly dropped the em-dash and halved its stock vocabulary against Opus 5, but used 2.5 times the bold lead-in bullets and 35% more three-part lists (measured: Bennett 2026).

For a chat reply with no file, run steps 1 to 4 by reading. For a reply over about 15 sentences, or one the reader will forward, write it to a scratch file and run steps 5 and 6.

### Exceptions

- A catalogued word used as a proper noun or a documented API term (a product named `Tapestry`, a `robust` flag) is allowed in that sense. Add it to the `allow` list in `.slop-lint.json` so the run stays clean.
- Quoted text stays verbatim, tells included, inside quotation marks or a code block.
- Code identifiers and literal program output go in code spans.
- T1 to T3 have no exceptions.

## Tier 2. Professional deliverables

Scope: design documents, reports, proposals, specs, READMEs, PR descriptions, incident reviews, consequential email and papers. Apply it to anything a reader will act on, judge or keep.

These rules began as twelve commandments for academic prose, written after a professor's feedback on an LLM-assisted draft (the origin is in references/academic.md). The failures named in that feedback were facts listed with no connection between them, and rebuttals to objections nobody had raised. Both appear in design docs and reports as often as in papers.

### The reader

Write for one person: a competent reader in the field who has never seen this project. This reader does not know its repositories, meetings, internal names or history. They read in order, once, and decide sentence by sentence whether they need what they are told. For a design doc, picture an engineer on a neighboring team who must approve it. For an incident review, picture the on-call lead who reads it next quarter.

Before drafting, write one sentence that names this reader and says what they already know when they reach the section.

### Register

- State the fact with its subject, verb and number. If a sentence could be quoted alone as a saying, rewrite it.
- No aphorisms, punchy contrasts, teaser sentences, or short sentences written for effect. A punchline at the end of a sentence takes the emphasis that belongs to the claim.
- Use the field's standard terms and keep them. Do not paraphrase a term into everyday words for variety.
- Write about the subject, not the document. Cut sentences whose subject is the document or its plan (`In this section we will discuss`, `As mentioned above`, `It is worth noting`). Content ordinals (First, Second, In contrast) stay, and a long document may close its introduction with one sentence that gives the plan.
- A sentence carries one complete claim. Do not split a claim in two for rhythm.
- Sentence length follows commandment 9. Use 40 words as a trigger to reread, and set no fixed cap.
- A README or PR description may use contractions. Reports, proposals and papers use none.

| Written for effect | Plain |
| --- | --- |
| "Three problems stand between us and a reliable deploy." | "The deploy fails for three reasons: the migration lock, the health-check timeout and the stale image tag." |
| "Customer records did not always stay where they were written." | "Between March and May, 4,120 records written to the EU region were copied to the US backup bucket." |
| "A cache that knows nothing about tenants serves everyone the same answer." | "The cache key omits the tenant ID, so tenant B can receive tenant A's cached report." |
| "Latency is the symptom. The cause lives upstream." | "p99 latency rose from 180 ms to 950 ms because the auth service retries each token check three times." |

### The twelve commandments

Each commandment is a rule followed by a test you can run on your own draft. Run every test before presenting a draft.

1. Write only what this reader can follow from the page. No internal names, no shared history, no undefined borrowed terms. Where a plain word has the same technical meaning, use it (`utilize` to `use`, `methodology` to `method`). Needless long words lower readers' judgment of the writer (measured: Oppenheimer 2006).

   Test: give the section to someone with no project context, or a fresh model session holding only the section, and ask them to say back what it claims. Each miss is missing context. With no cold reader available, list every name, acronym and reference the section uses and mark the ones the page defines. Each unmarked item fails. In the title, summary and first paragraph, define or replace every term a reader from a neighboring team or subfield would not know.

2. Give each paragraph one point. The first sentence states the paragraph's specific claim or question, and the last sentence states what the paragraph established.

   Test: list the first and last sentences of every paragraph. The first sentences should read as a summary of the section. Fail when a last sentence is a bare datum, link, citation or hedge, or when a first sentence would fit any document on the topic ("Reliability is important for any production system"). Then label each sentence by level, 1 for raw data (a log line, a measurement) up to 5 for a conclusion or recommendation. Fail when every sentence sits at 3 or above, which is summary with no evidence, or every sentence sits at 1 or 2, which is a list of facts with no point (craft: Hayot).

3. Connect each sentence to the one before it. A sentence connects by opening on something the reader has already met, usually what the previous sentence ended on, or with a word that states the relation: because, so, but, therefore, for example. Additive openers join nothing.

   Test: list the first five words of each sentence in a paragraph. Most should name something already introduced, and the subject should not change every sentence. Next, read the last words of each sentence. An item introduced there must be taken up within two sentences; if it is not, a step of reasoning is missing, so add the step. Swap two adjacent sentences: if nothing is lost, the paragraph is a list. Finally, every sentence that opens with This, These, That or It needs a noun after the pronoun ("This retry loop") (craft: Gopen and Swan 1990, Williams).

4. State the problem and the main claim before the mechanism. A reader can judge a design choice only after seeing what it solves. Frame the problem as a condition plus its cost to the reader: what they cannot do, what breaks, what it costs them.

   Test: for each section, write "Without this, ...". That content belongs in the section's first three sentences. Then write the one sentence the reader should keep, such as "We recommend X because Y" or "X caused the outage, and Z prevents a repeat". It appears in the summary or opening, again where the argument ends, and at the start of the conclusion. Fail when the opening lists activities (we examined, we analyzed, we discuss) with no finding or decision. Fail when the stated cost is the author's effort ("this took significant engineering time").

5. Answer the questions the reader has, including the hard ones. Do not rebut objections nobody has raised: sentences built on "never", "by construction", "not comparable" or "X, not Y" often answer a critic from an earlier review. Do answer the objections a competent reader will raise, because leaving them out reads as careless.

   Test: for each rebuttal sentence, name the reader who would raise the point. "A reviewer from the platform team" or "anyone who has run this migration" passes. "Nobody" or "a comment on the last draft" fails, so delete the sentence, state the positive fact where the reader needs it, or move it to Risks or Limitations. Then list the two most plausible objections a competent reader would raise: an alternative design, a confound, a cost, a failure mode, a case the proposal does not cover. If either is missing, answer it where the reader would raise it or under Limitations. In Boston Review essays, default models chained rebuttal to rebuttal 52.0% of the time against 32.4% for humans, but New York Times debate essays showed the reverse (10.9% against 21.2%) (measured, debate essays: Kim et al. 2026).

6. Define each term before using it, and keep one name for each thing. Internal identifiers stay in tables, code and appendices, and prose uses descriptive names. A term the document counts with gets a one-sentence definition at first use. State each fact one way everywhere.

   Test: grep the prose for identifier patterns (camelCase, snake_case, ticket keys, file names) and for every synonym of the main objects and actions. Each object should have one name.

7. Describe the system, not its change history. The reader has no earlier version in mind. Credit a predecessor once, saying what is inherited and what is new, then describe what exists in the present tense. A PR description and a changelog are about the change, so history belongs there and nowhere else.

   Test: search for replaced, ported, refactored, upgraded, migrated, previously, used to, now. Rewrite each hit in a document about current state in the present tense.

8. Decide what matters, give it room, and cut the rest. A detail stays if the reader needs it to understand the work, reproduce it, act on it, or decide how far to trust a result. Otherwise it goes to an appendix, a link, or out. The two or three ideas the document depends on each get at least a paragraph, and each topic lives in one place.

   Test: ask "understand, reproduce, act, or trust?" of every sentence. Then ask whether each argument, risk or benefit could appear unchanged in another document on the topic. If it could, tie it to a number, design choice or case from this one, or cut it (measured, debate essays: 65.3% of human main arguments were unique within a debate against 3.4% for model arguments, Kim et al. 2026). For each main topic, list the paragraphs that discuss it, and fail when it appears in non-adjacent places with no stated reason. Headings and figure titles in a findings section state the finding as a sentence ("Most timeouts come from the auth service") (craft: Mensh and Kording 2017).

9. Give each sentence one idea, with the actor as its subject, the action as its verb, and the new information at the end.

   Test: read the last few words of each sentence. Fail when a sentence ends on a citation, hedge, date, link, method detail or "as discussed above" while its claim appears earlier, and fail when it ends on a turn of phrase. Move the claim to the end. A sentence is too long when it holds more items worth stressing than it has stress positions: one per sentence, plus one per correctly used semicolon or colon. Next, list the main verbs of a paragraph. Fail when most are be, have, show, provide, perform or involve, and turn the action hidden in a noun into the verb (`an analysis of the logs was performed` to `we analyzed the logs`). Flag a paragraph whose nominalizations (-tion, -ment, -ness, -ity, -ance) reach about 5% of its words, defined terms excepted. GPT-4o uses nominalizations at about 2.1 times the human rate, and instruction-tuned Llama 3 at about 1.5 times (measured: Reinhart et al. 2025). Split any sentence with more than about seven words between its subject and verb. Keep a passive that puts known information first, since a passive ban helps nobody (craft: Gopen and Swan 1990, Sword).

10. Say what each number means. Lead with the claim, then give the number that supports it. Introduce every table and figure with what the reader should see in it. Give counts with percentages, both raw values with a ratio, units on every quantity, and one denominator for one population.

    Test: after each number, ask "so what?" and "out of how many?"

11. Show one concrete case before the general scheme. Use a request trace, a log excerpt, a worked example or one real customer case, placed early and referred back to.

    Test: can the reader picture one specific instance before meeting the taxonomy or the architecture diagram?

12. Size each claim to its evidence, commit where the evidence allows, and state each limit once.

    Test, in five passes. First, list every hedge with its location and what it attaches to. Fail on a hedge on a measured value, on stacked hedges, and on a hedge with nothing to qualify. Each main claim carries one marker matched to its evidence, and a claim the evidence settles carries none. Second, compare each claim's tense, quantifier and population with what was measured: "latency fell 30% in the canary region last week" must not become "the change cuts latency by 30%". Model summaries of research were about twice as likely as the source abstracts to overgeneralize, and prompts asking for accuracy made it worse (measured: Peters and Chin-Yee 2025). Third, make each `somewhat`, `relatively`, `fairly`, `arguably`, `potentially`, `may help to` or `in a sense` name what it qualifies or become the bounding number ("in 12 of 30 runs"), and make each `first`, `only`, `all`, `new` or `unique` name its comparison. Fourth, for each main claim, write the principle that makes the evidence count ("the canary predicts the fleet because it gets the same traffic mix"), and state it in the text when a competent reader could reject it. Where you can, phrase the claim so a result could contradict it; that phrasing rule is inference with no source behind it. Fifth, put your own judgment at the decision points ("We chose X because ..."), state each limit once in a Limitations or Risks section with the direction of its effect, and note thin evidence (one run, a small margin) in the same paragraph as the claim. Do not add hedges or boosters to sound human: prompting a model for stance makes its boosters overshoot (measured: Crosthwaite et al. 2026).

### Facts and sources

Serious prose rests on checked facts.

- Take facts from primary material read at the time of writing: code, data, logs, results files, the source document. Earlier drafts, status notes and summaries are not sources, and they go stale.
- Keep a fact sheet for the document: each fact, its value, where it was read, and the date. Update it before changing the prose.
- Define every number that appears more than once in one place (a constants file, a LaTeX macros file, one table) so sections cannot disagree.
- Check each claim about a source against the source itself. Find the page, table, section or line that supports the exact sentence, and check the metadata (author, title, date, version), since a real source with wrong details passes an existence check. Record the check. If the source is unavailable, say so and ask for it.
- No `studies have shown`, `experts agree` or `industry best practice` without a named source. Replace a clump of references behind one general sentence with the two or three that support it, each with what it found.
- When one sentence merges facts from several sources, check that each fact is credited to the source it came from. Model drafts over-cite famous sources, so cite the specific source for the specific claim.
- Never invent a citation, number, result, quote, ticket or reason. Where a fact is missing, leave a visible placeholder (`[TODO: p99 before the change]`) and list it for the author.

For reference accuracy rates and citation checks specific to papers, see references/academic.md.

### Procedure

1. Write the reader sentence and the one sentence the reader should keep (commandment 4).
2. For each section, write the reader's question on arriving and the one-sentence answer.
3. Write each paragraph's point as one sentence. Read the points in order and fix the argument there.
4. Draft each paragraph from its point sentence, given what the reader knows from earlier sections. Do not draft from a checklist or a list of facts to include.
5. Run the tests: first and last sentences and the level map (2), the topic-string, promise and swap tests (3), "Without this" and the keep sentence (4), the who-asked search and the two objections (5), the identifier and synonym grep (6), the change-verb search (7), the portability and zig-zag checks (8), the stress, verb and nominalization checks (9), the so-what pass (10), the hedge, scope, qualifier and warrant passes (12).
6. Check any template, rubric or venue checklist last, and only for missing content. A draft written to fill every slot of a template (PR template headings, an introduction move list) reads as generated.
7. Run the Tier 1 procedure, including the linter.
8. Report to the author which commandments pass and which fail and why, plus every placeholder and unverified fact. Do not claim the cold-reader test passed unless someone ran it.

### When revising someone else's draft

Diagnose before rewriting. Quote each sentence that breaks a commandment, name the commandment, and show the rewrite. Rewrites use only facts already in the draft or verified from sources, with a bracketed placeholder where a fact is missing. If the draft's substance is out of date, say so first, since restyling stale content wastes the pass.

After any polish pass, by you or a model, compare each claim's commitment with the author's draft. A claim that went from "X causes Y" to "X may be associated with Y", or from a stated position to "both approaches have merit", changed in meaning, so restore it. Heavy LLM use produced a 68.9% increase in essays that stayed neutral on the question asked (measured: "How LLMs Distort Our Written Language", 2026).

## Tier 3. References

- `references/academic.md`: load for papers, theses, abstracts, grant and research proposals, literature reviews, peer reviews and rebuttal letters. It covers the academic register, introductions, related work, scope drift, stance and self-mention, citation checks, peer reviews, a leakage grep, and audit order by field.
- `references/registers.md`: load for chat replies, email, social posts, PR descriptions, commit messages, code comments and encyclopedic articles. It gives the do and don't list for each register and the profile to run.
- `references/catalogue.md`: the generated ban list. Load it when a lint hit needs its rule, or before writing in a register whose profile you have not used.

Maintainer notes: keep banned tokens inside code spans or code blocks, each paired with its fix, and keep the evidence marks current. Lint this file and its references with slop-lint before each release.
