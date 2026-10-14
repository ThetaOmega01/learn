---
name: visualize
description: "Add one correct, minimal visual to a lesson when an idea is genuinely clearer as a picture: a dependency graph, flow, sequence, state machine, tree, or comparison (Mermaid), or a spatial/geometric figure such as coordinates, a number line, vectors, or a plot (SVG). A maker subagent renders it and verifies it by looking before you show it."
---

# Visualize

A picture earns its place only when it shows something words can't: shape, structure, direction, relationship, geometry. This skill produces ONE such picture, guarantees it is **correct** (the maker renders it and looks at it before returning), and puts it in the lesson.

You are the **creative director**: you decide the exact idea and distill it to its fewest carrying elements. A **maker subagent** authors, renders, inspects, and returns the result.

## When

Reach for a visual when the idea is:

- a **structure or relationship**: dependencies, parts and arrows, a pipeline, a sequence of exchanges, a state machine, a hierarchy, a comparison, containment;
- **spatial or geometric**: coordinate geometry, a number line, vectors, a function's shape, a physical arrangement.

Prose or a single equation that already carries the idea needs no picture: a decorative diagram adds noise and a chance to be wrong. A missing visual is cheaper than a false one.

The plan's dependency map (teach skill) is plain mermaid you write yourself; this skill is for figures inside the lesson.

## Choose the maker

- **`mermaid-maker`**: nodes and edges, relationships. `graph TD`/`LR`, sequence, state, ER, class, mindmap, timeline.
- **`svg-maker`**: positions and shapes, geometry Mermaid's auto-layout can't place.

## Brief: one idea, fewest elements

Cramming is the most common failure. Before briefing, prune: for each element ask "if I delete this, is the idea still clear?" If yes, delete it. Give the concept AND the concrete elements, not a vague topic and not a long checklist; past ~5–7 elements, cut first.

- Vague: "make a diagram about how TCP works"
- Concrete: "graph TD: node 'packet' at the top; arrows down to 'ordering' and 'retransmit on loss'; both arrows into 'reliable stream'. No title. Shows reliability is built FROM packets, not alongside them."

Labels in the session language; keep them short.

## Dispatch

Use the `task` tool with `agent: "mermaid-maker"` or `agent: "svg-maker"` and the brief as the task.

## Use the result

- **mermaid-maker** returns `RESULT:` followed by a ```mermaid fence. Put that fence verbatim in your reply; omp renders it inline, and the wrap copies it into the notes, where Obsidian renders it.
- **svg-maker** returns `RESULT:` with `filename` and `path` of an `.svg` saved in `assets/`. Read the file and show it in your reply as a ```svg fence; the wrap embeds it in notes as `![[<filename>|500]]`.
- `RESULT: NONE` means the maker could not draw the brief correctly: simplify it, switch makers, or drop the visual. Visuals come only from a maker's render-and-inspect loop.

Introduce the visual in one sentence, then let it carry the idea instead of narrating every element.

Rendering needs Google Chrome, plus `bun install` in `extensions/visual-tools` for Mermaid (`@mermaid-js/mermaid-cli`).
