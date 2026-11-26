# Academic writing

Load this file for papers, theses, abstracts, grant and research proposals, literature reviews, peer reviews and rebuttal letters. Everything in SKILL.md applies, and this file adds what is specific to research prose. Run the linter with `--profile academic`, and add `--profile review` for a peer review.

## Origin

The Tier 2 commandments began here. A professor wrote this about an LLM-assisted methodology draft: "The writing is grammatically correct, but it has the LLM-like property of not correctly modeling theory of mind in knowing what to include or omit. It provides lists of facts without connecting them, and/or it will give text meant to answer a question or rebut a rejection that wasn't revealed." A later draft drew a second note: stop being cutesy and clever, because the audience is academic.

Both complaints now have measured counterparts. Lists of unconnected facts match report-by-paper literature reviews, and support-to-support transitions in model essays ran at one-half to three-quarters of the human rate. Unprompted rebuttals match a measured habit only in part: in Boston Review essays, default models chained rebuttal to rebuttal at 52.0% against 32.4% for humans, but New York Times debate essays showed the reverse (10.9% against 21.2%) (Kim et al. 2026). Both corpora are public debate, so the transfer to papers is inference. The cutesy register is partly a stress-position failure: a punchline in the last words of a short sentence takes the emphasis that belongs to the claim (craft synthesis from Gopen and Swan 1990).

## The reader and the register

The reader is an expert in the field who reviews for its venues and has never seen this project. Write in formal academic prose, as in the method sections of good papers in the field, with no contractions.

Signposts follow one rule: organize the content and do not narrate the text. Content ordinals stay (First, Second, Third, In contrast). A long introduction may end with one sentence that gives the plan of the paper. Cut sentences whose subject is the paper or the section (`In this section, we will discuss`, `As mentioned above`, `It is worth noting`). Use "To our knowledge" at most once, attached to the search that supports it. Do not use `To address this gap` as a stock opener. In one 2026 study, Claude, Gemma and Qwen introductions gave 10.8 to 16.0% of segments to the gap step against 9.6% for humans, although GPT-5.5 gave it less (7.1 to 8.8%) (measured: CARS study 2026). Model essays also lean on transitions and endophoric markers (measured: Jiang and Hyland 2025), although a 2026 replication found fewer interactive markers under a plain prompt (Crosthwaite et al. 2026).

| Written for effect | Plain |
| --- | --- |
| "A tool that watches a few of them reports nothing for an app that uses the rest." | "Instrumentation limited to a subset of these channels does not observe flows through the others." |
| "The data did not always stay where it arrived." | "The data was subsequently included in a network request in 145 apps." |
| "Three obstacles stand in the way of an answer." | "Such a measurement faces three obstacles." |

Gopen and Swan's egg-extract revision shows commandment 9 at work. The original reads "Transcription of the 5S RNA genes in the egg extract is TFIIIA-dependent." The revision reads "In the egg extract, the availability of TFIIIA limits transcription of the 5S RNA genes." The action moved from an adjective into the verb.

## Introductions

Do not open the first sentence on a centrality claim (`In recent years, X has attracted increasing attention`, `X is central to`). Open on the specific problem, the specific prior result the paper builds on, or, where the venue allows, the present study's question. In one 2026 study, models opened on centrality in 58 to 84% of introductions against 46% for humans, and opened on the literature in 0 to 12% against 32% (measured: CARS study 2026). Since 46% of humans also open this way, treat the rule as a default to depart from with a reason.

Keep only the moves and steps this reader needs. Models used 6.1 to 7.4 of the 10 steps of Swales' CARS model against 5.3 for humans, and a blind reader who knew the CARS model and the study's findings told 54 of 60 Claude-written introductions from the originals, citing structure in almost every judgment (same study). Test: list the CARS steps the draft contains (centrality, generalization, review, gap, question, purpose, findings, value, structure). A draft that contains every step is over-complete, and a well-known problem needs no centrality paragraph.

State one gap, tied to the named prior work that leaves it open. Test: count gap statements (`little is known`, `remains underexplored`, `To our knowledge, no study has`). Fail on more than one per introduction, or on a gap the cited literature does not demonstrate.

Caution: never give a model the CARS template as a drafting checklist. In the same study, prompting with the template made all 30 test introductions detectable. Use the template to diagnose a draft and never to generate one.

The contribution sentence takes the form `We show that X, which matters because Y`. It belongs in the abstract, in the last paragraph of the introduction, and at the opening of the discussion. Fail when the abstract lists activities (we examine, we analyze, we discuss) without a result. In CS and ML venues a contribution list is a norm, so a list is acceptable, though a generic list fails the portability test in commandment 8.

## Related work

Related work synthesizes the literature. Each paragraph opens with what a group of studies shows or where it splits, cites studies as evidence for that sentence with one discriminating detail each (design, n, effect), and ends by naming what this paper adds.

Run three tests on each paragraph. First, count sentences whose subject is a single cited work (`Smith et al. found`). Three or more in sequence, joined only by `Similarly`, `In addition` or `In contrast`, is report-by-paper. Second, check whether the paragraph ranks evidence, saying which study is stronger and why. Third, check whether any sentence carries a specific number, quote or page from a source. A paragraph that fails all three matches the profile of model-written reviews, which "reported the literature" without synthesizing it, rarely quoted or gave page numbers, and did not separate stronger studies from weaker ones (measured, several studies: the 2026 review benchmark, Lahlou et al. 2026). The topic-string test in commandment 3 exposes the same failure, because the subject changes author in every sentence.

## Scope of results

For every result claim, compare tense, quantifier and population against the result as measured. A past-tense, sample-specific result restated as a present-tense generic is scope inflation. "The treatment was effective in this study" must not become "The treatment is effective". Keep the sample, condition and tense: "In our sample of 145 apps, X occurred in 31%".

The evidence is strong. Model summaries of research were about twice as likely as the original abstracts to state generalized conclusions, and 4.85 times as likely as expert-written summaries of the same articles (odds ratio, 95% CI 3.06 to 7.70). Prompts that asked for accuracy made overgeneralization nearly twice as likely, and most newer models did worse than older ones (measured: Peters and Chin-Yee 2025).

Two related checks apply in the Discussion. A paragraph that moves from one supporting sentence straight to `Practitioners should` or `Policymakers should` is a proposal rush, so state only the implication the results license, next to the result that licenses it. A limitation or implication that could appear unchanged in another paper on the topic is generic, so tie it to a number or design choice from this paper.

## Stance, hedging and self-mention

Default model text in academic genres carries fewer calibrated hedges than human text. In discussion and conclusion sections of applied linguistics articles, human authors used 30.02 hedges per 1,000 words against 21.04 for GPT-4 (measured: Shiraz study). In argumentative essays, performed epistemic markers ran at about twice the human rate, under a prompt that asked models to engage with uncertainty (measured: Bakhshi 2026). When a prompt asks for stance, hedges reach human levels but boosters overshoot (measured: Crosthwaite et al. 2026). The fix is functional:

- Hedge interpretations and generalizations ("which suggests", "in this sample"). Never hedge a measured value. Hedges on data statements weaken persuasion (measured, effect sizes not retrieved: Britt et al. 2008).
- Give each main claim one epistemic marker matched to its evidence.
- Put the author's judgment at decision points: "We excluded X because ...", "We read this difference as ...", "This is weaker evidence than ...".
- Do not sprinkle hedges, or boosters such as `clearly` and `indeed`, to sound human.
- In the humanities and social sciences, hedge norms run higher. No rule here is a quota.

Self-mention studies disagree on direction. Student-essay studies find fewer self-mentions in model text, and one research-article study finds GPT-4 over-uses them. A plausible reconciliation, untested, separates announcement "we" (`In this study, we propose`) from decision "we" (`We chose X because`). So test function and leave counts aside. Mark, for each paragraph, the main claim's commitment marker (hedge, booster, attitude, or none) and whether the author is the visible agent of any judgment. A section where most claim sentences carry no marker, and the only "we" sentences are announcements, matches the model profile.

Claim-sizing sentences such as `does not by itself establish` appear elsewhere as a 2026 disclaimer mold, and the catalogue holds them out of its academic profile on purpose. In a paper, a sizing sentence is what commandment 12 asks for when it bounds a specific claim and gives the reason. Cut it when it bounds nothing in particular (`These results should be interpreted with caution`).

Watch for scaffolding bundles used as connectors in place of reasoning (`in the context of`, `in terms of the`, `a wide range of`, `the role of`) in prose with few epistemic bundles (`this suggests that`, `we argue that`). Model essays use fewer bundles, in more rigid and formulaic forms, with more noun- and preposition-based bundles and fewer stance bundles (measured: Jiang and Hyland 2025, Applied Linguistics).

## Citations

A DOI resolver catches a fabricated reference, but it misses a real paper attached to a claim it does not make, and that second failure survives most checks. In one study, 46% of ChatGPT-3.5 medical references were authentic but inaccurate (measured: Bhattacharyya et al. 2023). With retrieval off, 55.0% of 300 references from three 2026 models had an inaccuracy and 28.3% were fabricated (measured: neurocritical care study 2026). About 1 in 20 accepted NeurIPS 2025 papers has two or more likely hallucinated references (measured: Phantom References 2026).

- Check each reference's metadata: authors, year, venue, title, pages.
- For each in-text citation, open the source and find the page, table or figure that supports the exact sentence. Record it in the fact sheet.
- Replace citation clumps (`[3-9]`, or five author-year pairs behind one sentence) with the two or three studies that matter, each with what it found and how: "A (n = 412, cohort) found X; B found the opposite under condition Y."
- Watch for canon skew. Model reference suggestions over-favor highly cited works (measured: Algaba et al. 2024). Cite the specific empirical source for a specific claim, and cite a review only for what the field broadly holds.
- When a sentence merges several sources, check that each fact is credited to the source it came from.
- No `studies have shown`, `research has shown` or `a growing body of literature` without named studies. The academic profile flags citation-clump attribution.

## Peer reviews

Model reviews are longer, more positive and more alike across papers, and they judge novelty less often than human reviews. GPT-4 commented on implications 7.27 times more often and on novelty 10.69 times less often than human reviewers, and humans requested ablations 6.71 times more often (measured: Liang et al., NEJM AI 2024). Fully AI-written ICLR 2026 reviews averaged 507 words against 424 for human or AI-assisted reviews and were more similar to each other across different papers (measured: Hivemind 2026). Use these content findings. The often-quoted share of AI-written ICLR 2026 reviews is contested on method, so do not cite it.

- Each weakness names a location (section, table, figure, equation, line) and its consequence for the paper's claim.
- One sentence judges novelty against the closest named prior work.
- Each request names the specific ablation, control or dataset and says what result would change the recommendation.
- The summary is two sentences in the reviewer's own framing, and it does not restate the abstract.
- Then come the one or two issues that decide the recommendation, in order of weight.
- No bold two-to-three-word tag headers.
- The score matches the text, and length is no measure of quality.

```
evaluate on more datasets | provide more details | discuss broader implications
                                   -> name the dataset, the detail, the result it would change
**Limited Evaluation:** (bold tag header)  -> a sentence naming the missing evaluation
laudable | cogent | ingenious | admirable | refreshing | intriguing | insightful | compelling
lucidly | aptly | methodically | commendably | impressively
                                   -> (delete), or name what the paper does well and where
Here is a revised version of your review   -> delete
```

## Leakage grep

Before submission, grep the draft for chat leakage and placeholders. Each hit is either an error or, for "I" and "you", a register break.

```
grep -n -i -E 'as of my last|real-time (data|information|access)|certainly, here|here is a revised version|improved clarity and (flow|structure)|\[insert|\[author name\]|\[citation needed\]' draft.tex
grep -n -E '\b(I|me|my)\b' draft.tex             # multi-author paper: first-person singular
grep -n -i -E '\byou(r)?\b' draft.tex            # second person outside quoted material
```

Also search for the chat UI's regenerate-button label, which the linter fails on. Do not flag referrals such as "consult a healthcare professional" by pattern, because human medical writing gives that advice routinely and the baseline corpus is full of it.

## Audit order and field differences

Audit the Discussion first, then the abstract and introduction, then the reference list. In December 2025 PubMed Central papers, 68% of Discussion paragraphs were LLM-assisted against 32% of Methods paragraphs (measured: Holzwarth et al. 2026). The Discussion is where to look hardest for unprompted rebuttals, generic implications and recap.

Fields differ:

- CS and ML have the highest LLM share, with 22.5% of abstract sentences LLM-modified by September 2024 (measured: Liang et al. 2025). Look hardest at abstracts, introductions and reviews.
- In biomedicine, audit the Discussion for scope drift and generic implications, and the reference list for fabricated or inaccurate clinical references.
- In the humanities and social sciences, stance and authorial voice carry the argument, so the stance deficit and neutral drift (SKILL.md, "When revising") matter most. Hedge norms are higher there.

## Sources

- Gopen and Swan, "The Science of Scientific Writing", American Scientist 78 (1990). https://cseweb.ucsd.edu/~swanson/papers/science-of-writing.pdf
- Mensh and Kording, "Ten simple rules for structuring papers", PLOS Comput Biol (2017). https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005619
- Hayot, The Elements of Academic Style (2014), the uneven U, via https://thesiswhisperer.com/2019/02/13/the-uneven-u/
- CARS introduction study (2026). https://arxiv.org/html/2610.01353v1
- Peters and Chin-Yee, overgeneralization in LLM summaries (2025). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12042776/
- Kim et al., argument structure in LLM essays (2026). https://arxiv.org/html/2606.01736v1
- Crosthwaite et al., Modern Language Journal (2026). https://onlinelibrary.wiley.com/doi/full/10.1111/modl.70089
- Jiang and Hyland, metadiscourse in ChatGPT and student essays, English for Specific Purposes 79 (2025). https://ueaeprints.uea.ac.uk/id/eprint/99123/
- Jiang and Hyland, bundles in ChatGPT and student argumentative essays, Applied Linguistics 46(3) (2025). https://academic.oup.com/applij/article-abstract/46/3/375/7736875
- Shiraz study of discussion sections, human against GPT-4. https://tesl.shirazu.ac.ir/article_8833_bd7da341b6c638e9f62814a8620ce174.pdf
- Bakhshi, rhetorical features of LLM essays (2026). https://arxiv.org/html/2604.19768
- Reinhart et al., PNAS (2025). https://arxiv.org/html/2410.16107v2
- Liang et al., LLM feedback on papers, NEJM AI (2024). https://arxiv.org/html/2310.01783
- Hivemind analysis of ICLR 2026 reviews. https://arxiv.org/html/2605.03202v2
- Bhattacharyya et al., reference accuracy (2023). https://pmc.ncbi.nlm.nih.gov/articles/PMC10277170/
- Phantom References (2026). https://arxiv.org/html/2607.00738
- Algaba et al., citation bias in LLM suggestions (2024). https://arxiv.org/html/2405.15739v1
- Academ-AI, leakage in published papers. https://arxiv.org/html/2411.15218
- Holzwarth, González-Márquez and Kobak, LLM use in PMC full texts (2026). https://arxiv.org/html/2608.10715v1
- Seifi and Seyfi, LLM citations in neurocritical care, Critical Care Explorations (2026). https://pmc.ncbi.nlm.nih.gov/articles/PMC13506236/
- Liang et al., LLM use in scientific papers, Nature Human Behaviour (2025). https://doi.org/10.1038/s41562-025-02273-8
- "How LLMs Distort Our Written Language" (2026). https://arxiv.org/html/2603.18161v1
