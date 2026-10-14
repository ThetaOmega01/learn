# learn

A personal learning system for [omp](https://github.com/can1357/oh-my-pi): a teaching skill, a few extensions, and subagent definitions. It does long-horizon study of a book or lecture notes one chapter per session, plus quick sprints on topics needed at work. Each session ends in linked Obsidian review notes, and spaced repetition keeps those notes alive.

Forked from [amosblomqvist/learn](https://github.com/amosblomqvist/learn), built for the video [How I Use AI to Learn Things](https://www.youtube.com/watch?v=kzcI5F4tGiU).

## How it works

The repo root has the layout of an omp config directory, so a project uses it by linking `<project>/.omp` to this repo.

- `skills/teach/`: the pedagogy (unconditional truths first; "how could I have discovered this?") and the session procedures. `SKILL.md` is the short core; the mode and format files load only when needed.
- `skills/visualize/`: adds one verified diagram (Mermaid) or figure (SVG) to a lesson.
- `extensions/quiz.ts`: `quiz`, a graded multiple-choice tool with instant feedback. Questions tagged with a `concept` are logged for review.
- `extensions/learn/`: `learn_due` and `learn_commit` (Leitner boxes, 1/3/7/14/30 days), plus the `/wrap` and `/review` commands.
- `extensions/visual-tools/`: write, edit, and render tools for Mermaid and SVG. Only the maker agents see them.
- `agents/`: `researcher` (fact checks, topic scoping), `mermaid-maker`, `svg-maker`.

Non-graded questions use omp's built-in `ask` tool.

## Setup

Requirements: omp, Bun, Google Chrome (renders previews), Node (runs the installed `mmdc`).

```bash
cd extensions/visual-tools && bun install   # mermaid-cli for Mermaid previews
```

Create a course project, which is also an Obsidian vault:

```bash
scripts/new-course.sh ~/workspace/local/learn-os ~/Downloads/ostep.pdf
cd ~/workspace/local/learn-os && omp
```

The first session builds `COURSE.md` (goal and syllabus) from the source and asks you to confirm it. For an existing directory, the script only adds the `.omp` link and `review.base`. If a `.omp` already exists and points somewhere else, the script stops and leaves it alone.

The learner profile lives in `~/.omp/agent/learner/` (`INDEX.md` plus one file per domain). It is shared across all projects and created through a short interview on the first run.

## Use

| You say | What happens |
|---|---|
| "I want to learn chapter 3 today" | Course session: time budget → warm-up review → probe → plan (dependency map; waits for your OK) → teach loop with a quiz per concept → practice task sized to the budget |
| "I read chapter 3" | Same session, but it consolidates what you read instead of teaching from scratch |
| "I need X for <work task>" | Sprint: probes only what the task needs, short plan, teach, then apply it to your real problem |
| `/review [n]` | Review-only session on concepts due for spaced repetition |
| `/wrap` | Writes concept, chapter, and sprint notes; commits quiz results to the review schedule; updates `COURSE.md` and your profile |

If a session ends without `/wrap`, the next session start warns you and offers to finish it.

## Project layout

```
<project>/
  .omp -> this repo
  COURSE.md            goal, syllabus, session log
  sources/             book / lecture notes
  chapters/            one index note per chapter (concept map + links)
  concepts/            one note per concept; review state in frontmatter
  sprints/             sprint cheat sheets
  practice/            exercises
  assets/              SVG figures
  review.base          Obsidian table of concepts due for review
  .learn/              quiz log (machine state)
```
