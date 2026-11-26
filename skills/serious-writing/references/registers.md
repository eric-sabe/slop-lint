# Registers

Tier 1 of SKILL.md applies to every register below. Tier 2 applies wherever the register is a professional deliverable: a PR description, a consequential email, a README. Each section names what the reader wants, what to do, what to avoid, and the linter profile to run. Lists of banned tokens sit in code blocks, each with its fix. The full regexes are in `catalogue.md`.

Evidence for most register rules is practitioner consensus. No quantified study exists for commit messages, code comments or LinkedIn vocabulary, and the email tells come only from detector vendors. Where a measurement exists, the entry names it.

## Chat reply

The reader asked something and wants the answer. No profile applies beyond the default catalogue, and a reply over about 15 sentences, or one the reader will forward, goes to a scratch file for a lint run. Do the following, and avoid the forms in the block after the list.

- Answer in the first sentence. Background, caveats and options follow, and only if the reader needs them.
- Use the reader's own terms for their files, products and people.
- Use contractions.
- Match length to the question. A yes-or-no question gets the answer and the reason.
- If you cannot do something, say so once, with what you can do instead.
- End on the last useful fact, with a period.

```
Certainly! | Absolutely! | Sure! | Of course! (as openers)     -> delete
Great question | Good catch | I love this framing              -> delete
you're absolutely right | you're right that                   -> delete; state the corrected fact
It's completely understandable | That sounds really hard       -> delete unless the reader asked for support
Honestly? | to be honest | frankly                             -> delete
I'd be happy to help | I'm happy to                            -> do the thing
let me know if you'd like | would you like me to | is there anything else I can
                                                               -> delete
restating the question before answering                        -> delete
headings, bold labels or bullets in a reply of a few paragraphs -> prose
a summary paragraph repeating the reply                         -> delete
```

Watch for the wrong-reader reply (SKILL.md R22): the reader gave the context, so do not explain it back to them. In a reply under about 300 words, a single negative contrast already reads as the pattern, so rewrite it.

## Email

The reader wants to know what you want from them and by when. Run the `email` profile. Do the following, and avoid the forms in the block after the list.

- Make the subject line state the ask or the news: "Need sign-off on Q3 vendor contract by Friday".
- In the first sentence give the ask, and for a cold email who you are.
- Keep to one ask per email. Put dates and times with a time zone.
- Close with the next step and your name.
- Apply Tier 2 when the email carries a decision, a report or a commitment.

```
I hope this email finds you well                -> delete; start with the ask
I wanted to reach out | I'm reaching out to     -> state the reason
I came across your profile                      -> say where and what caught your attention, specifically
quick 15-minute call                            -> propose a time, or ask the question in the email
don't hesitate to reach out                     -> delete
I look forward to hearing from you              -> state the next step and its date
```

One opener and one closer from this list together read as a template, so the linter's email group weighs the pair.

## Social post

The reader is scrolling and gives the post a line or two. Run the `social` profile. Do the following, and avoid the forms in the block after the list.

- Lead with the thing itself: the result, the number, the link, the claim.
- Write paragraphs of several sentences, one point per post.
- Name the people and sources you credit.

```
I'm thrilled to announce | I'm humbled to share      -> "We shipped X" | "I joined Y"
Unpopular opinion: | Hot take:                       -> state the opinion
let that sink in | read that again | for those in the back -> delete
Agree? | Thoughts? (as the final line)               -> ask a specific question, or end
repost if | follow for more                          -> delete
one sentence per paragraph, stacked                  -> join sentences that share a point
```

## PR description

The reviewer wants to know what changes, why, what to check, and how you know it works. A PR is about a change, so the history that commandment 7 keeps out of design docs belongs here. Run the `pr` profile. Do the following, and avoid the forms in the block after the list.

- In the first sentence or two, say what changes and why, with the problem or issue link.
- Point reviewers to the part that needs judgment: the migration, the concurrency change, the public API.
- Describe testing with specifics: the command run, the cases covered, what you checked by hand and what you did not check.
- State risks and how to roll back.
- Use headings only when the PR is large enough to need them, and write prose under each.
- Keep attribution lines the project requires.

```
four or more of ## Summary / ## Changes / ## Testing / ## Test plan / ## Motivation,
  each with a line or two of filler                -> one opening paragraph, headings only where content needs them
comprehensive test coverage was added to ensure correct functionality
                                                   -> "Added 6 tests for the expired-token path; `npm test` passes"
a bullet per changed file                          -> group by purpose; the diff lists files
improved clarity and flow | preserved existing behavior (with no specifics)
                                                   -> say what changed and how you verified it
load-bearing | quietly | genuinely                 -> essential | (delete) | (delete)
```

Generic boilerplate appeared in 18.8% of high-inconsistency agentic PRs (measured, weaker: ACM agentic PR study 2026). In one corpus of 544,271 PR descriptions, em-dashes rose from 0.2 to 123 per 10,000 words between early 2024 and mid-2026 (measured, unlabelled corpus: Abraham).

## Commit message

A future maintainer runs `git log` or `git blame` and wants to know why the line changed. Run the `pr` profile on the message text. Do the following, and avoid the forms in the block after the list.

- Write a subject line of about 72 characters or fewer, in the imperative mood, saying what the commit does: "Retry token check once on 503".
- Leave a blank line, then a body that says why, wrapped at about 72 characters.
- Reference the issue.
- Keep attribution trailers the project requires.

```
markdown headings, bold or tables in the message   -> plain text
a bullet per file touched                          -> say why; the diff shows what
This commit ...                                    -> start with the verb
improved clarity | refactored for readability (alone) -> name the change
Here's the updated ... | as requested               -> delete
```

## Code comments

A maintainer reading the code wants what the code cannot say: why it is this way, what must stay true, and what would break. Run the `code` profile (or `--code`), which lints only the comments in code files and adds the code-comment rules, and add `--no-rates`. Do the following, and avoid the forms in the block after the list.

- Explain why: the constraint, the invariant, the unit, the workaround and its issue link.
- Describe the current code in the present tense.
- Use contractions and short sentences.

```
Here's the updated function | as requested | I've added   -> delete (chat leakage)
# Step 1: ... | Now we ...                                 -> delete, or say why the order matters
This function was added to replace X | changed from X to Y | NEW:
                                                           -> describe what the code does now; history goes in the commit
// rest of your code here | ... existing code ...          -> write the code, or delete the comment
This function handles X (restating the name)               -> delete, or state the non-obvious contract
mirrored section banners (// ===== Helpers =====)          -> delete
```

History comments are commandment 7 in code form. "Narrates the obvious" is the most reported code tell and also the most over-claimed one, so judge each comment by whether it says something the code does not.

## Encyclopedic and wiki articles

The reader wants verifiable facts in a neutral voice, each one traceable to an independent source. Run the `wiki` profile. Do the following, and avoid the forms in the block after the list.

- Give dates, numbers and named sources for each claim.
- Cite a source independent of the subject for any claim of importance.
- Keep the section structure the subject needs.

```
nestled | in the heart of | boasts | rich cultural heritage    -> location and facts
stands as a testament | enduring legacy | marks a pivotal shift -> say what happened and when
faced numerous challenges | despite these challenges           -> name the problem and its outcome
has been featured in | independent coverage | maintains an active online presence
  | holds the distinction of                                   -> cite the coverage itself
reflects the broader | has sparked broader discussions about   -> cite who discussed what
"Legacy", "Awards and recognition" stock sections               -> only with sourced content
sentence-final ", highlighting ..." clauses                    -> cut, or a new sentence
```

Wikipedia now files many promotional words under historical indicators for 2023 to 2025. They stay banned here, since a ban that never fires costs nothing.

## Other profiles

- `fiction`: run it on fiction only. It flags model-typical names and stock sensory verbs and nouns, which are normal in other registers. The list is in `catalogue.md`.
- `academic` and `review`: see `academic.md`.
