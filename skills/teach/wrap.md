# Wrap-up

Turns the session into review material and schedules it. Run every step; the wrap is done when `learn_commit` reports no uncommitted results and every file below is written.

1. **Gather.** From this session: the plan's nodes actually taught (with slugs), the concepts reviewed, quiz outcomes (read `.learn/quiz-log.jsonl`), misconceptions observed, practice task and actual time against its estimate, where the next session resumes. A wrap left over from an earlier session: rebuild the same list from the log and the earlier session's notes, and say what could not be recovered.
2. **Concept notes.** Write or update `concepts/<slug>.md` for every concept taught or reviewed, per [notes-format.md](notes-format.md). An existing note is updated in place (new misconceptions appended, explanation sharpened), never duplicated. Every slug in the quiz log needs a note.
3. **Index note.** Course: write or update `chapters/chNN-<slug>.md` with the final concept map and links. Sprint: write `sprints/<slug>.md`.
4. **Commit.** Call `learn_commit`. If it lists concepts without notes, write those notes (or fix the slug) and call it again until it is clean.
5. **COURSE.md** (course only). Tick the chapter when it is fully covered; append one session line.
6. **Profile.** Update the learner profile per [profile.md](profile.md); show the diff in your reply.
7. **Report** in a few lines: files written, what moved between boxes, when the next reviews fall due, where the next session starts.
