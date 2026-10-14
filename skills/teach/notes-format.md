# Note formats

Notes are **review material**, read weeks later in Obsidian: distilled, self-contained, linked. They are not a transcript. Prose and headings follow the session language; filenames, slugs, and frontmatter keys are English. Math is LaTeX. Diagrams are ```mermaid``` fences; SVG figures embed as `![[<file>.svg|500]]`.

## Concept note: `concepts/<slug>.md`

One concept per note: an unconditional truth or one derived step from the plan.

```markdown
---
aliases: [<title in the session language>]
chapter: "[[chNN-<slug>]]"
tags: [concept]
---
# <Title>

**Claim.** <one sentence, at face value>

## Why we need it
<the problem it solves or the gap it closes>

## How you could have discovered it
<the motivated derivation; for an unconditional truth, why it is safe to accept as-is>

## Rests on
- [[<prerequisite-slug>]]: <how this depends on it>

## Misconceptions caught
- <YYYY-MM-DD>: <the wrong belief, the distractor that exposed it, what is actually true>

## Self-test
> [!question]- <question>
> <answer with a one-line why>
```

- `chapter` points at the chapter note; in the sprint vault use `sprint: "[[<sprint-slug>]]"` instead.
- `box`, `due`, and `last_reviewed` are written by `learn_commit` only; leave them untouched when updating a note.
- 2–3 self-test questions, each probing a different angle. "Misconceptions caught" is omitted when there are none.

## Chapter note: `chapters/chNN-<slug>.md`

~~~markdown
---
aliases: [<chapter title in the session language>]
source: "<book>, ch. NN, pp. X–Y"
tags: [chapter]
---
# <Chapter title>

<2–4 sentences: what this chapter builds and the click it aims for>

```mermaid
graph TD
  <the final dependency map, nodes labelled with concept titles>
```

## Concepts (teaching order)
1. [[<slug>]]: <one line>

## Practice
- `practice/chNN-<slug>/`: <task, estimate vs actual time, outcome>
~~~

## Sprint note: `sprints/<slug>.md`

A cheat sheet for the application, usable without the conversation.

~~~markdown
---
aliases: [<title in the session language>]
applied_to: "<the work task>"
tags: [sprint]
---
# <Topic>

**Goal.** <what it was learned for>

```mermaid
graph TD
  <dependency map, sink = the application>
```

## Key concepts
- [[<slug>]]: <one line>

## How it applies
<the pattern, decision, or snippet used on the real task>

## Pitfalls
- <gotchas met or flagged>
~~~

## `COURSE.md`

Small by design: read at every session start.

```markdown
---
source: "sources/<file>"
started: <YYYY-MM-DD>
---
# <Book or course title>

**Goal.** <what done looks like, in the learner's words>

## Syllabus
- [x] [[ch01-<slug>]] Ch 1 <title> (pp. 1–20)
- [ ] Ch 2 <title> (pp. 21–44)

## Sessions
- <YYYY-MM-DD> · ch02 · 90 min · 6 concepts · practice <name> (est. 60 / actual 75 min) · resume at <node>
```

Keep the last 10 session lines; move older ones to `sessions.md` (linked from here).
