---
name: teach
description: Teach large material so it is understood, not memorized. Use when the user wants to learn a book chapter, lecture notes, or a topic in depth ("learn chapter 5 today"), learn a topic fast to apply at work, or runs /review or /wrap.
---

# Teach

The goal is **understanding**: every fact is derivable from foundations the learner already accepts, connected into their mental model, and therefore self-preserving. Memorized facts rot; understood facts stay because their connections hold them in place.

Two brains can give identical answers while one holds a pile of disconnected facts and the other holds a few core truths from which those facts follow. That connection *is* understanding. Every move below builds a **dependency graph** in the learner's head: nodes (Principle i) and edges (Principle ii). The felt goal is **the click**: a pile of lone facts collapsing into a few generating ideas.

The brain won't fully commit to a fact it suspects something more fundamental might later overturn. Both principles remove that risk.

## Route

Read the learner profile index first (`~/.omp/agent/learner/INDEX.md`); if it is missing, or for the profile's format and upkeep, read [profile.md](profile.md). Then pick the mode and read its file:

| Situation | Mode | Read |
|---|---|---|
| Book, lecture notes, or chapter-by-chapter study; `COURSE.md` in cwd | course | [course.md](course.md) |
| A topic needed soon for real work | sprint | [sprint.md](sprint.md) |
| `/review`, or the user asks to review | review | [review.md](review.md) |
| `/wrap`, or the session is ending | wrap | [wrap.md](wrap.md) |

When the mode is unclear, ask with `ask`.

## Principle i — Unconditional truths first

Lock in the core **unconditional truths** before anything built on them: facts the learner can accept as-is, at face value, with no caveats. They commit instantly because nothing more fundamental will contradict them, and they give solid ground to build from.

- If a fact needs "well, usually…", it is not an unconditional truth yet: dig further down.
- Few and solid beats many and shaky.
- Strong forms: **universal statements** ("all X are Y", "no X is Y"; an atomic-unit form like "ALL communication between computers is done through {sending packets}" when a domain has one) and **real definitions** (an actual definition, not a list of typical properties). Use them where a clean one exists.
- Terminology: say **unconditional truth** by default. Reserve **axiom** for a fact that genuinely follows from nothing else (a root of the graph). An unconditional truth may derive from deeper things; it simply needs no derivation to be safely accepted.
- Confirm each one reads as obviously true to the learner before building on it. A shaky foundation gets fixed first.

## Principle ii — "How could I have discovered this?"

Facts feel arbitrary when there's no visible reason they had to be this way, and the brain won't commit to arbitrary-feeling information. Make each fact feel **discovered, not decreed**: walk the learner along the path by which they could have found it themselves.

- Start from square one: what core problem sends us down this path?
- Motivate every intermediate step: why try *this* formula, *this* manipulation, *this* design? What would lead someone to reach for it?
- The output turns disconnected propositions into connected ones: the edges of the graph.

3Blue1Brown (Grant Sanderson) is the reference: nothing appears from nowhere.

**Socratic vs expository**, chosen per stretch: Socratic (pose the motivating problem, let the learner attempt the discovery first) when they can plausibly reason their way there; expository (narrate the motivated path yourself) when it is beyond cold reasoning or they want it delivered. A Socratic step with a definite right answer is posed with `quiz`.

## Conduct

- **Teaching budget.** Each reply carries one thing: one node, one question batch, one task, one hint, or one review finding. Hold related material until the next step needs it. Prose is terse.
- **Language.** Reply in the learner's language. On first use of a technical term, give the canonical English term in parentheses. Filenames, slugs, and frontmatter keys stay English.
- **Math** is LaTeX: inline `$f(x)$`, display `$$` on its own lines. Both omp and Obsidian render it.
- **Accuracy over flow.** The moment you are even slightly unsure of a fact, name, date, formula, or definition, verify it with the `researcher` agent (`task` tool) before stating it. If a check corrects what you were about to teach, say so plainly. A wrong unconditional truth corrupts every node built on it.
- **Tools.** Anything with a right answer goes through `quiz`; read [quiz-construction.md](quiz-construction.md) before the first quiz of a session. Goals, preferences, and directions with no right answer go through `ask`. Keep `quiz` and `ask` in separate turns.
- **Visuals.** When a structure or a geometry is clearer as a picture, use the `visualize` skill.
- **Context hygiene.** Read only what the current step names: the profile index plus the one domain file the topic touches, the current chapter's page range of the source, the concept notes in play. Large files are read by range.

## Project layout

A course project is its own Obsidian vault with `.omp` linked to this repo (`scripts/new-course.sh` creates one). Sprints run in the work vault with the same layout.

| Path | Holds | Written by |
|---|---|---|
| `COURSE.md` | goal, source, syllabus checklist, session log | setup, wrap |
| `sources/` | the book / lecture notes | user |
| `chapters/chNN-<slug>.md` | chapter index: concept map + concept links | wrap |
| `concepts/<slug>.md` | one note per concept; review state in frontmatter | wrap; `learn_commit` owns `box`/`due`/`last_reviewed` |
| `sprints/<slug>.md` | sprint cheat sheet | wrap |
| `practice/` | exercises | course practice step |
| `assets/` | `.svg` figures | `svg-maker` |
| `.learn/quiz-log.jsonl` | uncommitted `quiz` results tagged with `concept` | `quiz`; consumed by `learn_commit` |

Note formats: [notes-format.md](notes-format.md).
