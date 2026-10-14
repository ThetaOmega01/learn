# Review

Spaced repetition over concept notes. `learn_due` lists what is due; `quiz` with `concept` records the results; `learn_commit` moves boxes. You never edit `box`, `due`, or `last_reviewed` yourself.

## Per due concept

1. Read the concept note (`concepts/<slug>.md`): its claim, derivation, prerequisites, and recorded misconceptions.
2. Ask **one fresh** `quiz` question on it, tagged `concept: <slug>`. Vary the angle from the note's self-test questions (apply, discriminate from a neighbour, predict a consequence) so the learner recalls the idea, not a memorized answer. Target recorded misconceptions when present.
3. On a miss or "I don't know": re-derive the concept briefly from its prerequisites (Principle ii), then one more tagged question. Note the misconception for the wrap.

## Warm-up (inside a course session)

The concepts `learn_due` returned with `limit: 5`, about 10% of the session budget. No commit here: the session's wrap commits everything together.

## Review-only session (`/review`)

1. Call `learn_due` (respect a count the user gave; otherwise all due, and offer to stop after every 10).
2. Run the per-concept steps for each.
3. Finish: append newly observed misconceptions to the concept notes, call `learn_commit`, and append one line to the session log in `COURSE.md` (or skip that line in the sprint vault). Report what moved and when the next concepts fall due.
