# Learner profile

Lives outside every project, in `~/.omp/agent/learner/`, and spans all courses. It grows over months, so it is split for progressive disclosure:

| File | Holds | Read when |
|---|---|---|
| `INDEX.md` | under ~40 lines: background, how they learn, dislikes, one line per domain with level and link | every session start |
| `domains/<domain>.md` | per domain (e.g. `rust`, `linear-algebra`, `operating-systems`): what is solid, known gaps, recurring misconceptions, courses and sprints | the topic touches that domain |

## INDEX.md shape

```markdown
# Learner profile

## Background
- <occupation, experience, languages>

## How I learn
- <Socratic vs expository default, analogies that work, pacing, time budget habits>

## Dislikes
- <what to avoid in explanations>

## Domains
| Domain | Level | File |
|---|---|---|
| rust | <one-line level: what is solid, where it ends> | domains/rust.md |
```

## Bootstrap

If `INDEX.md` does not exist, interview the learner in one `ask` batch: background, domains with self-rated level, Socratic vs expository preference, what kind of explanation works and what annoys them. Write `INDEX.md` (and a domain file per listed domain only when there is something beyond the one-line level) and show it.

## Upkeep at wrap

Update the domain file the session touched: newly solid strands, gaps found, misconceptions seen. Update `INDEX.md` only when a level line, a learning preference, or a dislike changed. Keep `INDEX.md` under ~40 lines by moving detail into domain files. Show the changes as a diff in the wrap report.
