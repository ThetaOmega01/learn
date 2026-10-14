# Sprint mode

Learn one topic fast enough to apply it at work now. Same principles and the same probe → plan → teach shape, bounded by the task. Run the steps in order.

## 1. The application

Ask (`ask`) what the learner will apply the topic to: the concrete task, the system or codebase (note its path), and the deadline. This task is the sink of the plan; every node must serve it.

## 2. Time budget

Use the stated budget or ask for it. Record the start time with `date` via `bash`.

## 3. Probe

Run [probe.md](probe.md) over **only** the strands the application depends on. Each strand still needs both a floor and a ceiling; strands the task does not touch are skipped.

## 4. Plan and teach

Run [teach-loop.md](teach-loop.md). The plan is short (about 6 nodes or fewer) and its sink is the application. Check `concepts/` first and reuse existing slugs.

## 5. Apply

Work the learner's real problem with them. Read the relevant code or material from the path they gave. The learner drives; you hint, review, and connect each move back to the nodes just taught. Implement for them only when asked.

## 6. Wrap

Suggest `/wrap`. The wrap writes a cheat sheet in `sprints/<slug>.md` plus concept notes ([wrap.md](wrap.md)).
