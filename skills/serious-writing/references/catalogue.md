# Catalogue (generated)

Generated from slop-lint.mjs catalogue 0.10.1 by `node build-skill.mjs`. Do not edit by hand: change the linter, then regenerate. Every entry is a ban for serious-writing, whatever its severity in the linter. Matching is case-insensitive and whole-word for words. Tells are listed only inside code blocks, which the linter skips, so this file lints clean.

Evidence grades: M1 large corpus or controlled study, M2 measured but weaker, P independent practitioner reports, A anecdote. An era label records when a tell peaked. It does not lift the ban: older models stay in use.

## Typography (always)

```
U+2014 em-dash                         FAIL. Use a comma, period, colon, or parentheses.
double hyphen used as a dash           warn. Same fix.
U+201C U+201D U+2018 U+2019 quotes     warn. Use straight quotes.
emoji, arrows, dingbats                warn. Use words ("to", "becomes").
U+202F narrow no-break space           warn. Use a plain space.
```

## Machine artifacts (FAIL, never allowed)

These are tokens a person never types. They fail even inside code blocks, so they are described here rather than spelled out.

```
ChatGPT citation residue (contentReference markers, turnNsearchN ids)
ChatGPT citation delimiter (Private Use Area U+E200-E202, U+EA01-EA02)
chatbot referral parameter in a link (utm_source=chatgpt.com)
Gemini citation residue (bracketed cite numbers, span markers)
Grok citation-card residue
Perplexity upload residue
chatbot source marker (lenticular brackets around a dagger)
the chat UI's regenerate-button label pasted along with an answer
```

## Words (always on)

```
# FSU 'delve' focal-word study; PubMed 135-term analysis
# since 0.1.0; evidence M1; era: GPT-3.5/4 (peak 2023-2024; declining on arXiv since spring 2024, Geng & Trotta)
delve delves delving intricate intricately commendable meticulous meticulously
underscore underscores underscoring pivotal paramount unwavering surpass surpasses
showcase showcases showcasing boast boasts tapestry realm resonate resonates testament
profound noteworthy notable versatile invaluable elevate foster garner
```

```
# Pangram / Grammarly / practitioner marketing-buzzword blacklists
# since 0.1.0; evidence P; era: GPT-4 (2023-2025; the GPT-4-era PR cluster fell from 11.4% to 1.5% of PR descriptions by Nov 2026)
leverage leveraging synergy robust seamless seamlessly transformative scalable
cutting-edge game-changer game changer paradigm holistic empower unleash unlock utilize
utilise supercharge state-of-the-art best-in-class vibrant multifaceted revolutionize
ever-evolving fast-paced comprehensive
```

```
# practitioner blacklists (vague metaphors / meta-discourse nouns)
# since 0.1.0; evidence P
landscape journey roadmap ecosystem beacon symphony myriad plethora facet illuminate
navigate navigating
```

```
# practitioner blacklists (booster adverbs / filler transitions)
# since 0.1.0; evidence P
# note: weak alone: Wikipedia lists transitions as an ineffective indicator, though 'additionally' and 'notably' are in Kobak's estimator
furthermore moreover additionally nonetheless nevertheless undoubtedly notably
strategically
```

```
# Wikipedia: Signs of AI writing (Words to watch) + practitioner blacklists
# since 0.3.0; evidence P; era: promotional words ('boasts', 'nestled') are 'historical (2023-2025)' on Wikipedia
bolster bolsters bolstered bolstering groundbreaking renowned exemplifies encompassing
enhance enhances enhancing enhanced innovative streamline streamlines streamlined
streamlining actionable nestled
```

```
# empirical: cross-model corpus discovery (--discover)
# since 0.5.0; evidence M2
incredibly
```

```
# empirical: reply-bot specimens (validate-open 'this really resonated')
# since 0.9.0; evidence P
resonated resonating
```

```
# Kobak et al. 2025 (Science Advances) excess-vocabulary list: inflections of catalogued stems
# since 0.10.0; evidence M1; era: GPT-3.5/4 (2023-2025)
delved showcased underscored fosters fostering garnering leverages harnessing empowers
unlocking revolutionizing realms encompass encompasses encompassed surpassing
illuminates illuminating utilizes intricacies
```

```
# inflection completion of catalogued stems (graded by the stem's group)
# since 0.10.0; evidence P
fostered garners leveraged harnessed empowering empowered unlocks unleashing unleashed
unleashes revolutionized utilization boasting boasted exemplify exemplified exemplifying
navigates navigated testaments facets tapestries journeys landscapes supercharged
supercharging
```

```
# Kobak et al. 2025 excess style words (Fig. S6); Liang et al. 2024 peer-review adverbs; Yakura et al. 2024; Batalo et al. 2025 hype annotation ('unparalleled')
# since 0.10.0; evidence M1; screened 2026-11-25
elucidate elucidates elucidating unveil unveils unveiling burgeoning unparalleled
uncharted underexplored surmount interconnectedness interplay nuanced poised adept
pinpoint groundwork juxtaposed emphasizing lucidly aptly methodically innovatively
compellingly impressively excellently
```

```
# claude-code #53454; Abraham PR-description corpus (2025-2026); Wikipedia GPT-6 list ('quietly'); practitioner lists
# since 0.10.0; evidence M2; era: Claude Opus 4.7-5.x, GPT-5.x/6 (2025-2026)
load-bearing quietly genuinely
```

```
# Reinhart et al. 2025 (PNAS), Table 1, GPT-4o
# since 0.10.0; evidence M1; screened 2026-11-25
camaraderie palpable
```

## Phrases and constructions (always on)

Each entry is the linter's message, then its pattern. Rules marked `last` only apply to the last two sentences, `first` to the first sentence.

```
# Kobak et al. 2025 (harnesses); practitioner buzzword lists (harness); narrowed after the transcript sweep
# since 0.10.1; evidence M1
word "harness" (as a verb)
    /(?<!\b(the|a|an|our|your|their|its|this|that|each|every|new|test|eval|benchmark|integration) )\bharness(es)? (the|its|their|our|your|his|her|this|these|that|those|every|ai|data|technology|power|potential)\b|\bto harness\b/i
```

```
# Wikipedia 'Signs of AI writing' essay; practitioner blacklists
# since 0.1.0; evidence P
"in today's ... world" intro
    /\bin today'?s (fast[- ]paced )?(world|digital age|digital landscape)\b/i
"ever-evolving landscape" intro
    /\bin the (ever[- ]evolving|dynamic) (landscape|world) of\b/i
"as the world continues to evolve"
    /\bas the world continues to evolve\b/i
"imagine a world where"
    /\bimagine a world where\b/i
"at its core"
    /\bat its core\b/i
"plays a crucial role"
    /\bplays? an? (crucial|important|key|vital|pivotal|significant) role\b/i
"is a testament to"
    /\bis a testament to\b/i
"serves as a powerful tool"
    /\bserves? as a (powerful|valuable|vital) tool\b/i
"cannot be overstated"
    /\bcannot be overstated\b/i
"has become increasingly ..."
    /\bhas become increasingly (important|popular|common)\b/i
"when it comes to"
    /\bwhen it comes to\b/i
"whether you're X or Y" framing
    /\bwhether you'?re (a |an )?.+ or (a |an )?.+/i
"no matter where you are on your journey"
    /\bno matter where you are (on|in) your journey\b/i
"if you're looking to"
    /\bif you'?re looking to\b/i
"at the end of the day"
    /\bat the end of the day\b/i
"for all intents and purposes"
    /\bfor all intents and purposes\b/i
"with that in mind"
    /\bwith that in mind\b/i
"the fact of the matter is"
    /\bthe fact of the matter is\b/i
"in a nutshell"
    /\bin a nutshell\b/i
"needless to say"
    /\bneedless to say\b/i
"that being said"
    /\bthat being said\b/i
"deep dive"
    /\bdeep dive\b/i
hedge: "it's worth noting that ..."
    /\bit'?s (important|worth|essential) (to note|noting|to consider|considering|to recognize) that\b/i
"while it is true that"
    /\bwhile it is true that\b/i
"it could be argued that"
    /\bit could be argued that\b/i
"generally speaking"
    /\bgenerally speaking\b/i
"this article will explore"
    /\bthis (article|post|paper|piece) will (explore|examine|cover|delve into|look at)\b/i
"let's dive in / take a closer look"
    /\blet'?s (take a closer look|dive in|explore|unpack)\b/i
"here's the thing/why"
    /\bhere'?s (the thing|why)\b/i
conclusion ritual
    /\b(in conclusion|in summary|to sum up|to wrap up|to conclude)\b/i
"the possibilities are endless"
    /\bthe possibilities are endless\b/i
"the future is bright"
    /\bthe future (is|looks) (bright|promising)\b/i
"only time will tell"
    /\bonly time will tell\b/i
"the journey is just beginning"
    /\bthe journey (is just beginning|doesn'?t end here)\b/i
"not just X, but Y"
    /\b(not|don'?t|doesn'?t|didn'?t) (just|only)\b[^.?!]{0,60}\b(but|it'?s|they'?re|its)\b/i
"it's not X, it's Y" negated contrast
    /\b(it'?s|we'?re|they'?re)\s+(not|never)(\s+just)?\b[^.?!]{1,80}?\b(it'?s|we'?re|they'?re)\b/i
```

```
# Wikipedia: Signs of AI writing (assistant leakage + high-signal cliches)
# since 0.3.0; evidence P
"as an AI/large language model" (assistant leakage)
    /\bas an? (ai|large) language model\b/i
"I hope this helps" (assistant sign-off)
    /\bi hope this helps\b/i
"in the heart of"
    /\bin the heart of\b/i
"a diverse array of"
    /\ba diverse array of\b/i
"valuable insights"
    /\bvaluable insights\b/i
"stands/serves as a testament"
    /\b(stands|serves) as a testament\b/i
"setting the stage for"
    /\bsetting the stage for\b/i
"indelible mark"
    /\bindelible mark\b/i
"deeply rooted in"
    /\bdeeply rooted in\b/i
"rich cultural heritage/tapestry"
    /\brich (cultural )?(tapestry|heritage)\b/i
```

```
# empirical: reply-bot specimens (corpus/specimens), two independent sightings each
# since 0.9.0; evidence P; screened 2026-11-25
validate-then-restate opener ("That is/That's the ...")
    /^\s*that('?s| is) the [^.?!]{1,40}\.(\s|$)/i
validate-then-restate ("what you're describing")
    /\b(you'?re describing|what you (just )?described)\b/i
concessive validation ("you're right that ...")
    /\byou'?re (absolutely right|right that)\b/i
"a sharp addition/point" compliment-open
    /\b(such )?a sharp (addition|point|observation|framing|distinction|question|way)\b/i
"A isn't the X. It is the Y." negated contrast (uncontracted)
    /^[^.?!]{1,45}\b(isn'?t|is not|aren'?t|are not) (the|an?|about|just)\b[^.?!]{1,100}[.?!]\s+it(?:'?s| is)\b/i
"doesn't X, it just Y" contrast
    /\b(doesn'?t|does not) [^.?!]{1,60}, it (just|only|simply|actually)\b/i
"can X ... can't X" modal antithesis (verb echo)
    /\bcan (\w{3,})\b[^.?!]{0,80}[.?!]\s+(?!if |when |unless )(?:\w+ ){0,2}can(?:'t|not)\b (?:\w+ )?\1\b/i
"the real question/test" pivot
    /\bthe real (open )?(question|test) (of|is|isn'?t|will be)\b/i
"Which means/might ..." fragment opener
    /^\s*which (means|might|may|is why|is where|is what)\b/i
hedge: "worth noting ..." (clause-initial)
    /(^|[.?!]\s+)worth noting\b/i
"the uncomfortable question/truth" framing
    /\bthe (uncomfortable|deeper|harder|honest|quiet) (question|truth|answer|reality|tension)\b/i
"the most important form of X" hedged superlative
    /\bthe most (important|powerful|dangerous) form of\b/i
"X is what keeps A from becoming B" aphorism mold
    /\bis what keeps [^.?!]{1,50}from (becoming|turning into)\b/i
"is measured by how" aphorism mold
    /\bis measured by how\b/i
"lowers X without lowering Y" parallel antithesis
    /\b(\w{3,}?)e?s\b[^.?!]{1,50}\bwithout \1ing\b/i
"as a hypothesis, not a promise" antithesis close
    /\bas an? \w+, not an? \w+[.!]/i
corrective anaphora ("nobody polices X, they police Y")
    /\bnobody (\w{3,}?)e?s\b[^.?!]{1,60}\bthey \1/i
```

```
# empirical: reply-bot feed mining (2026-07), two independent sightings each
# since 0.9.0; evidence P; screened 2026-11-25
"X isn't the A, it's B" negated contrast (noun subject)
    /\b\w+ isn'?t (really )?(the|an?) [^.?!]{1,60}, it'?s\b/i
"will be those who ..." superlative prediction
    /\b(will|are going to) be (those|the ones) who\b/i
"as an X rather than a Y" reframe
    /\bas an? [\w-]+( [\w-]+){0,3} rather than an?\b/i
"a tech problem, a change-management one" echo
    /\ban? [\w-]+( [\w-]+)? (problem|failure|issue|question)\b[^.?!]{0,40}\ban? [\w-]+( [\w-]+)? one\b/i
"True X requires/lies in ..." aphorism open
    /\btrue \w+ (requires|lies in|demands|means)\b/i
corrective anaphora ("don't mark X, they mark Y")
    /\b(don'?t|doesn'?t) (\w{3,})\b[^.?!]{1,60},\s*(they|it|we) \2/i
```

```
# Pangram phrase rates; Sun et al. 2025 (Idiosyncrasies in LLMs); Academ-AI (768 cases); Wikipedia
# since 0.10.0; evidence M2; screened 2026-11-25
assistant opener ("Certainly!")
    /^\s*(certainly|absolutely|of course|sure)!/i
assistant leakage ("Certainly, here is")
    /\bcertainly,? here (is|are)\b/i
praise-before-answer ("Great question!")
    /(^|[.!?]\s+)(great|good|excellent) (question|point|catch)[!.]/i
assistant voice ("I'd be happy to help")
    /\bi'?d be (more than )?happy to (help|assist)\b|\bi am happy to (help|assist)\b/i
offer-of-help close ("let me know if you'd like")  [last]
    /\b(let me know if you('d| would)? (like|want|need)|would you like me to|is there anything else (i|we) can)\b/i
offer-of-help close ("Happy to ...", "feel free to ask")  [last]
    /\b(happy to (help|walk you through|go deeper|dig (in|deeper)|elaborate|expand)|feel free to (ask|reach out|let me know))\b/i
knowledge-cutoff disclaimer (assistant leakage)
    /\b(as of|up to|until) my (last|latest) (knowledge|training)( (update|cutoff|cut-off|data))?\b|\bmy knowledge cut-?off\b/i
capability disclaimer (assistant leakage)
    /\bi (don'?t|do not) have (access to real-time|real-time|personal (opinions|experiences|feelings))\b/i
revision-request leakage ("Here is a revised version", "improved clarity and flow")
    /\bhere is (a|the) revised version\b|\bimproved (the )?(clarity|readability|flow)(,? (and )?(clarity|readability|flow|structure|consistency|concision))+\b|\bpreserv(ed|ing) (the )?existing (behaviou?r|structure|formatting|content|wording)\b/i
```

```
# Pangram phrase ratios (21,000x-49,000x); Wikipedia AILEGACY / FACESCHALLENGES; slop-score
# since 0.10.0; evidence M2; screened 2026-11-25
puffery ("a poignant reminder")
    /\bas a (poignant|powerful|stark|sobering) reminder\b|\breminder of the (enduring|potential)\b/i
"despite these challenges" formula
    /\bfaced numerous challenges\b|\bdespite these challenges\b|\bfaces (several|numerous|significant) challenges\b/i
"the complex interplay"
    /\bthe (complex|intricate|delicate) interplay\b/i
"a newfound sense of purpose"
    /\b(newfound|renewed) sense of (purpose|hope|belonging)\b/i
"become a focal point"
    /\bbec(ome|ame|omes|oming) a focal point\b/i
vague attribution ("experts argue"): name the source
    /\bexperts (argue|say|agree|note)\b|\bobservers (note|say)\b|\ba growing body of (research|literature|evidence)\b/i
```

```
# Wikipedia: Signs of AI writing (Words to watch); contributed in PR #9
# since 0.10.0; evidence P; screened 2026-11-25
advice disclaimer (assistant leakage)
    /\bi can(no|')?t (offer|provide|give) (medical|legal|financial|professional) advice\b/i
"in the provided sources" (retrieval leakage)
    /\bin the (provided|available) (sources|search results|documents|context)\b/i
"based on available information" hedge
    /\bbased on (the )?available information\b/i
"while specific details are limited" hedge
    /\bwhile (specific )?details (are|remain) (limited|scarce)\b/i
"not widely documented" hedge
    /\bnot widely (documented|disclosed|reported)\b/i
"marks a broader shift" significance inflation
    /\b(represents|marks|reflects|signals) a (broader |wider |fundamental )?shift\b/i
```

```
# Bennett/Arize Opus 5 vs 5.5 study; Anthropic Fable 5.1 prompting guide (platform.claude.com); Wikipedia GPT-6 list; tropes.fyi; deslop; humanizer; practitioner lists
# since 0.10.0; evidence P; era: 2025-2026; screened 2026-11-25
staging: "let that sink in"
    /\blet (that|this|it) sink in\b/i
staging: "read that again"
    /\bread (that|this|it) again\b|\bfor (the people|those) in the back\b|\bsay it louder\b/i
staging: "here's the kicker"
    /\bhere'?s (the kicker|the twist|the catch|the deal|the best part|the part|where it gets|what (nobody|no one))\b/i
staging: self-answered fragment question ("The result? ...")
    /(^|[.!?]\s+)[Tt]he (result|catch|kicker|twist|best part|reason|answer|problem|truth|secret)\?\s+[A-Z]/
staging: "Honestly?" fragment
    /(^|[.!?]\s+)honestly\?/i
mannered prose: "earns its keep"
    /\bearn(s|ed|ing)? (its|their|his|her) (keep|place|spot|seat)\b/i
mannered prose: "doing a lot of work"
    /\b(is |are )?doing a lot of (the )?(work|heavy lifting)\b|\bdoes (the |a lot of the )?heavy lifting\b|\bdoes real work\b/i
salience flag: "This matters."
    /(^|[.!?]\s+)(this|that|it) (really |still |genuinely )?matters\.(\s|$)/i
verdict intensifier ("that's the whole point")
    /\b(that'?s|that is|which is) (exactly |precisely )?the (whole )?point\b|\b(that|this)( i|')s not an accident\b|\bthis is not an accident\b/i
verdict intensifier: "Full stop."
    /(^|[.!?]\s+)full stop\.(\s|$)/i
"let's break this down / be real"
    /\blet'?s (break (this|it) down|be real|be honest|get real)\b/i
"the real unlock/story" pivot
    /\bthe real (unlock|story|issue|win|work|problem|risk|cost|lesson)\b|\bthe tension is real\b/i
signpost: "the hard part is"
    /\bthe (hard|tricky|surprising|interesting) part is\b|\bthe part (nobody|no one)\b/i
arguing with no one ("I'm not saying X, but")
    /\bi'?m not saying [^.?!]{1,60}, but\b|\ba tempting (approach|answer|move) would be\b/i
stock metaphor: "a dial worth turning"
    /\ba (dial|knob|lever) worth (turning|pulling)\b/i
```

```
# Antislop 2025 ('It's not X, it's Y' ~6.3x human in some models' creative writing); tropes.fyi; remove-ai-slop; Wikipedia; PENDING.md specimen
# since 0.10.0; evidence P; screened 2026-11-25
"Not because X. Because Y." contrast
    /\bnot because\b[^.?!]{1,60}[.,]\s+(but )?because\b/i
countdown "Not X. Not Y. Z."
    /(^|[.!?]\s+)(Not|No) [^.?!,]{1,30}\.\s+(Not|No) [^.?!,]{1,30}\.\s+(Just |Only )?[A-Z]/
countdown "no X, no Y, just Z"
    /\bno [^.?!,]{1,25}, no [^.?!,]{1,25}, (just|only)\b/i
noun-echo contrast ("The question isn't X. The question is Y.")
    /\bthe (question|problem|issue|answer) (isn'?t|is not) [^.?!]{1,60}[.?!]\s+the \1 is\b/i
"is no longer X. It is Y." contrast
    /\bis no longer (a|an|the|about|just) [^.?!]{1,60}[.?!]\s+it(?:'s| is)\b/i
"You're not X. You're Y." contrast
    /\byou'?re not [^.?!]{1,60}[.?!,]\s+you'?re\b/i
participial tail (", ensuring ...")
    /,\s+(ensuring|highlighting|reflecting|underscoring|emphasizing|showcasing|fostering|paving)\b[^.?!]{3,}[.!]/i
```

## Layout rules (always on)

```
stock headings (Key takeaways, Why it matters, Challenges and future directions, Future outlook)
Title Case on 60%+ of 3+ subheadings: use sentence case
colon-subtitle headings on 40%+ of 3+ subheadings
3+ consecutive list items that open with a bold label
any phrase rule matched across a soft line break inside a paragraph
```

## Rate advisories (documents of 15+ sentences)

Advisories never fail the linter. serious-writing treats each one as a finding to fix or justify. Thresholds sit at or beyond the human extreme on the repo's baseline corpus.

```
sentenceCV       0.45
participial      10
nominalization   0.06
tricolon         0.27
hedge            0.03
contrast         2.6
copula           2
bold             4
oneSentencePars  0.85
intensifier      4
```

## Profiles (opt-in: `--profile <name>`)

### pr

pull-request descriptions and commit text: template headings, boilerplate test claims, PR-era vocabulary.

```
# Abraham PR-description corpus, rising 2025-2026 clusters (unlabelled; attribution inferred)
# since 0.10.0; evidence M2; era: 2025-2026
# note: testing jargon overlaps ('vacuous truth', 'fail loudly'); run --discover on your own PR text before trusting
plainly vacuous vacuously provably wedged chokepoint tripwire carve-out backstop papered
structurally loudly
```

```
# Abraham PR-description corpus, GPT-4-era cluster (fell from 11.4% to 1.5% of descriptions)
# since 0.10.0; evidence M2; era: 2023-2025
enterprise-grade production-ready ai-powered
```

```
# ACM agentic-PR study (boilerplate in 18.8% of high-inconsistency PRs); HN; practitioner reports
# since 0.10.0; evidence P
boilerplate test claim ("comprehensive tests ... to ensure")
    /\b(comprehensive|extensive|thorough) (unit |integration )?tests?( coverage| suite)?\b[^.?!]{0,60}\bto ensure\b/i
boilerplate: "to ensure correct functionality"
    /\bto ensure (correct|proper|expected) (functionality|behaviou?r)\b/i
```

### email

email: stock openers and closers.

```
# Presend; TextSight; Iro (detector-vendor guides, 1-5 sightings each; 'don't hesitate to reach out' has 1)
# since 0.10.0; evidence P
email opener: "I hope this email finds you well"
    /\bi hope (this|my) (email|message|note) finds you well\b/i
email opener: "I wanted to reach out"
    /\bi wanted to reach out\b|\bi am writing to (provide|inform|follow up)\b/i
email closer: "don't hesitate to reach out"
    /\bdon'?t hesitate to (reach out|contact)\b/i
cold-email opener: "I came across your profile"
    /\bi came across your profile\b/i
cold-email ask: "quick 15-minute call"
    /\bquick \d+[- ]minute (call|chat)\b/i
email closer: "I look forward to hearing from you"
    /\bi look forward to hearing from you\b/i
```

### social

social posts (LinkedIn-style): announcement and engagement-bait formulas.

```
# newsreel; Taplio; plain-language-editor (LinkedIn slop lists)
# since 0.10.0; evidence P
announcement formula ("I'm thrilled to announce")
    /\bi'?m (thrilled|humbled|excited|honored) to (announce|share)\b/i
"Unpopular opinion:" / "Hot take:"
    /\bunpopular opinion:|\bhot take:/i
engagement-bait closer ("Agree?")  [last]
    /(^|[.!?]\s+)(agree|thoughts|what do you think)\?\s*$/i
engagement bait ("repost if", "follow for more")
    /\brepost if\b|\bfollow (me )?for more\b/i
```

### fiction

fiction: creative-writing slop vocabulary (Antislop).

```
# Antislop / slop-score (Paech 2025: 'flickered' in the top list of 98.5% of 67 models)
# since 0.10.0; evidence M1
flickered shimmered unease newfound unspoken etched unsettlingly elara kael
```

```
# Antislop / slop-score phrase lists
# since 0.10.0; evidence M1
fiction slop: "voice barely above a whisper"
    /\bvoice (barely|little more than) (above )?a whisper\b/i
fiction slop: "heart hammered against her ribs"
    /\bheart (hammered|pounded) (against )?(his|her|their|my) ribs\b/i
```

### wiki

encyclopedic prose: notability padding, legacy puffery, stock sections.

```
# Wikipedia: Signs of AI writing (Words to watch, AIDISCLAIMER); contributed in PR #9
# since 0.10.0; evidence P; screened 2026-11-25
"does not by itself establish" hedge
    /\bdoes not (by itself|in itself) establish\b/i
```

```
# Wikipedia: Signs of AI writing (AILEGACY, ITSHAPESDISCUSSIONS, AIATTR, AIIDENTIFY), 2026 examples
# since 0.10.0; evidence P
significance inflation ("marks a pivotal shift")
    /\b(marks?|represents?) a (pivotal|significant|major) (shift|turning point|moment|milestone)\b/i
legacy puffery ("reflects the broader ...")
    /\breflects the (broader|growing|wider)\b|\bforms part of the (wider|broader)\b|\benduring legacy\b/i
"has shaped discussions about"
    /\bhas (shaped|sparked|fueled|informed) (broader )?(discussions|debates|conversations) (about|on|around)\b/i
notability padding ("maintains an active online presence")
    /\bmaintains an active (online|digital|social media) presence\b|\bholds the distinction of\b/i
notability padding ("has been featured in")
    /\bhas been (featured|profiled|documented) (in|by)\b|\bindependent coverage\b/i
"his website identifies him as"
    /\b(his|her|their) (personal |official )?website (identifies|describes) (him|her|them) as\b/i
```

### review

peer reviews: second-tier praise adjectives, bold tag headers.

```
# Liang et al. 2024 (ICLR/NeurIPS review vocabulary, top-100 appendix)
# since 0.10.0; evidence M1
laudable cogent ingenious admirable refreshing intriguing insightful
```

```
# practitioner reports of AI-written reviews (bold tag headers)
# since 0.10.0; evidence A
bold tag header ("**Strengths:**")
    /^\s*(\*\*|__)[A-Z][\w-]*( [\w-]+){0,2}:?(\*\*|__):?\s/
```

### academic

papers: centrality-claim openers, gap formulas, citation clumps.

```
# CARS introduction study (arXiv 2610.01353: centrality openers 58-84% models vs 46% humans); Pangram; serious-writing S7/S16
# since 0.10.0; evidence M2
centrality-claim opener ("In recent years, X has attracted increasing attention")
    /\bin recent (years|decades),? [^.?!]{1,60}\b(has|have) (garnered|attracted|received|gained|drawn) (significant|increasing|growing|considerable|much) (attention|interest)\b/i
"provides new insights into"
    /\b(provides?|offers?|yields?) (new|novel|valuable|deeper) insights? into\b/i
gap formula ("To address this gap")
    /\bto (address|fill|bridge) (this|the|these) gaps?\b/i
vague attribution ("studies have shown"): name the study
    /\b(studies|research) (have|has) (shown|demonstrated|found)\b/i
citation clump ("[3-9]"): name the two or three studies that matter
    /\[\d+\s*[-\u2013]\s*\d+\]/
```

### code

code files: lint comments only, plus code-comment rules (chat leakage, step narration, history comments, placeholders).

```
# JCarterJohnson Reddit mining (11,906 posts, 11,306 comments); AI-SIGNALS; SynthScan; agent-failure-modes
# since 0.10.0; evidence P
code comment: chat leakage ("Here's the updated ...", "I've added")
    /\b(here'?s the (updated|revised|modified|corrected|fixed)|as (you )?requested|i'?ve (added|updated|modified|changed|fixed|refactored|implemented))\b/i
code comment: step narration ("Step 1:", "Now we")
    /^\s*(step \d+[:.)]|now we\b|first,? we\b|next,? we\b|finally,? we\b)/i
code comment: history narration (describe the code, not its change; that belongs in the commit)
    /\bthis (function|method|class|component|module|code|file|helper) (was|has been|is now) (added|changed|updated|modified|refactored|introduced|moved|renamed)\b|\b(was|were) (added|changed|updated|modified|refactored) (to|in order to) (replace|fix|support|handle|address)\b|^\s*(added|updated|changed|fixed|removed|new):\s/i
code comment: placeholder ("rest of your code here")
    /\b(rest of (your|the) (code|implementation|logic)|(your|existing) (code|logic|implementation) goes here|implementation goes here|add your [\w ]{1,30} here)\b/i
code comment: "This function handles ..." (name what it does)
    /^\s*this (function|method|class|component|module|helper) (handles|is responsible for|serves to|ensures|provides a (way|mechanism))\b/i
```
