# Course mode

Long-horizon study of a book or lecture notes, one session at a time. Run the steps in order; scale each step's size to the material, never its shape.

## 0. Orient

Read `COURSE.md`. If it does not exist, this is the first session: run **Setup** below, then continue only if the learner wants to start today.

### Setup (first session)

1. Find the source in `sources/`. With no source file, ask whether to use an online table of contents (e.g. an official online book) and confirm the edition.
2. Extract the table of contents with page ranges. For a PDF, read only the outline/contents pages.
3. Ask (`ask`) for the learner's goal and scope: whole book or selected chapters, depth, and what "done" looks like.
4. Write `COURSE.md` ([notes-format.md](notes-format.md)) and show it. The learner confirms or corrects the syllabus and goal before any teaching.

## 1. Check for an unfinished wrap

Call `learn_due` with `limit: 5`. If it reports UNCOMMITTED results, offer to finish that wrap-up first ([wrap.md](wrap.md)); do it if accepted.

## 2. Time budget

Use the budget the learner stated, or ask for it (`ask`, e.g. 30 min / 1 h / 2 h / 3 h). Record the start time with `date` via `bash`. Every later sizing decision spends from this budget; check `date` before starting each new node.

## 3. Warm-up review

If `learn_due` listed due concepts, run the warm-up in [review.md](review.md), at most 5 concepts and about 10% of the budget.

## 4. Today's material

Locate the requested chapter in `COURSE.md` and read **only that chapter's page range** from the source. Two variants:

- **Teach** (default, "learn chapter X"): the agent teaches the chapter from the source.
- **Consolidate** ("I read chapter X"): the learner has read it. The probe targets the chapter's own content to find what stuck; solid nodes are confirmed with one quiz each and not re-taught; teaching covers the gaps.

Check `concepts/` for notes from earlier chapters that today's material rests on: reuse their slugs and link to them.

## 5. Probe

Run [probe.md](probe.md) over the strands this chapter depends on. Skip strands the profile marks as solid unless the chapter pushes past what the profile records.

## 6. Plan and teach

Run [teach-loop.md](teach-loop.md). When the remaining budget cannot fit the rest of the plan plus practice, stop at a node boundary and say where the next session resumes.

## 7. Practice

After teaching, set one practice task sized to the remaining budget with about 20% slack: a coding task for CS (in `practice/chNN-<slug>/`), a problem set for math (`practice/chNN-<slug>.md`).

- The task is self-contained: objective, expected behavior or input/output, constraints, acceptance criteria and edge cases, a way to check the result, and the time it is sized for. Larger tasks split into milestones with time estimates; optional stretch goals come last.
- Size it from demonstrated readiness (probe and quiz results), not from the learner's choice. Favour problem-solving with the chapter's concepts over copying examples from the source.
- The learner implements it. On request: review their work, give progressively stronger hints, explain a concept. A full solution only when asked.
- Note how long it actually took against the estimate; the next session sizes up or down from that.

## 8. Wrap

When the chapter is done or the budget is spent, suggest `/wrap`.
