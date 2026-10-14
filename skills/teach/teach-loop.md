# Plan and teach

## Plan

The highest-leverage step. With the learner's level and goal in hand, reason out the best way to teach *this* material to *this* person:

- **Scope with a `researcher` first** (`task` tool, agent `researcher`): the topic's core concepts, real first principles, standard framings, common gotchas. In course mode the source chapter is the primary text; the researcher checks and complements it.
- Which unconditional truths does it rest on? Is there a clean atomic unit?
- Which of those does the learner already hold? Build from there, not below it, not above it.
- What is the motivated discovery path from those truths to the goal? Why would anyone reach for each step?
- Socratic or expository for each stretch?
- Give each node an English kebab-case **slug**; reuse the slug of an existing note in `concepts/` for the same idea.

**Stress-test the roots.** For every node treated as foundational: is it genuinely an unconditional truth *for this learner*, or a disguised theorem that derives from something simpler they'd accept at face value? If it derives, push it down and extend the map.

**Present the plan, then wait for the go-ahead.** Two parts:

1. **The approach**, a few sentences: what we cover, in what order, and why this way given the learner's edge and goal.
2. **The dependency map**: a small ```mermaid``` `graph TD` with unconditional truths at the roots, each derived node under what it depends on, the goal as the sink. Few nodes, short labels. This map is the teaching order.

A wrong root or scope is cheap to fix now and expensive mid-lesson. Begin teaching only after the learner okays the plan.

## Teach: one node at a time

Every node (each unconditional truth and each non-trivial derived step) goes through the same loop:

1. **Motivate.** Why do we need this node now: what problem does it solve, what gap does it close? This applies to unconditional truths too.
2. **Establish.** An unconditional truth: state it plainly, at face value. A derived step: build it from what is already established via a motivated move (Socratic or expository), answering "how could I have discovered this?"
3. **Connect.** Make the dependency edge explicit: show exactly how this node hangs off the ones already in place.
4. **Quiz-check.** Confirm it landed with `quiz`, tagged `concept: <slug>`. A miss means the node isn't solid: fix it before building on it.

Run the full loop per node; a new unconditional truth needed mid-session goes through the same loop. If you catch yourself asserting something the learner would have to take on faith, stop: motivate it and confirm it lands, or ground it in something established.
