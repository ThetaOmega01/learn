/**
 * learn — spaced-repetition bookkeeping and session commands for the teach skill.
 *
 *   learn_due     tool  list concept notes due for review (frontmatter only)
 *   learn_commit  tool  apply .learn/quiz-log.jsonl to concept-note frontmatter
 *   /wrap         cmd   ask the agent to run the wrap-up procedure
 *   /review       cmd   ask the agent to run a review-only session
 *
 * Project layout (cwd = a course project or the sprint vault):
 *   concepts/<slug>.md          concept notes; review state in frontmatter
 *   .learn/quiz-log.jsonl       uncommitted quiz results (written by quiz.ts)
 *   .learn/quiz-history.jsonl   committed results, append-only
 *
 * Box arithmetic lives in code (srs.ts), never in the model.
 */

import { appendFileSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import {
	localDate,
	nextReviewState,
	outcomesByConcept,
	type QuizLogEntry,
	readFlatFrontmatter,
	setFlatFrontmatter,
} from "./srs.ts";

const CONCEPTS_DIR = "concepts";
const LOG_FILE = join(".learn", "quiz-log.jsonl");
const HISTORY_FILE = join(".learn", "quiz-history.jsonl");

interface LogRead {
	entries: QuizLogEntry[];
	malformed: string[];
}

function readLog(cwd: string): LogRead {
	const path = join(cwd, LOG_FILE);
	if (!existsSync(path)) return { entries: [], malformed: [] };
	const entries: QuizLogEntry[] = [];
	const malformed: string[] = [];
	for (const line of readFileSync(path, "utf8").split("\n")) {
		if (!line.trim()) continue;
		try {
			const e = JSON.parse(line) as QuizLogEntry;
			if (typeof e.concept === "string" && e.concept && typeof e.correct === "boolean") entries.push(e);
			else malformed.push(line);
		} catch {
			malformed.push(line);
		}
	}
	return { entries, malformed };
}

interface ConceptRow {
	slug: string;
	box?: number;
	due?: string;
	chapter?: string;
}

function readConcepts(cwd: string): ConceptRow[] {
	const dir = join(cwd, CONCEPTS_DIR);
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((f) => f.endsWith(".md"))
		.map((f) => {
			const fm = readFlatFrontmatter(readFileSync(join(dir, f), "utf8"));
			const box = Number.parseInt(fm.box ?? "", 10);
			return {
				slug: f.slice(0, -3),
				box: Number.isFinite(box) ? box : undefined,
				due: /^\d{4}-\d{2}-\d{2}$/.test(fm.due ?? "") ? fm.due : undefined,
				chapter: fm.chapter?.replace(/^\[\[|\]\]$/g, "") || undefined,
			};
		});
}

export default function learn(pi: ExtensionAPI) {
	const z = pi.zod;

	pi.registerTool({
		name: "learn_due",
		label: "learn due",
		loadMode: "essential",
		description:
			"List concept notes in ./concepts due for spaced-repetition review (due date today or earlier), most overdue first, then lowest box. Reads frontmatter only. Also reports uncommitted quiz results in .learn/quiz-log.jsonl — if any exist, the previous session's wrap-up is unfinished.",
		parameters: z.object({
			limit: z.number().int().positive().optional().describe("Max concepts to return. Warm-up: 5. Omit for all."),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const today = localDate();
			const concepts = readConcepts(ctx.cwd);
			const due = concepts
				.filter((c) => c.due !== undefined && c.due <= today)
				.sort((a, b) => (a.due === b.due ? (a.box ?? 0) - (b.box ?? 0) : a.due! < b.due! ? -1 : 1));
			const unscheduled = concepts.filter((c) => c.due === undefined).map((c) => c.slug);
			const shown = params.limit ? due.slice(0, params.limit) : due;
			const { entries } = readLog(ctx.cwd);

			const lines = [`today: ${today}`, `concept notes: ${concepts.length}, due: ${due.length}`];
			if (entries.length > 0) {
				lines.push(
					`UNCOMMITTED: ${entries.length} quiz results in ${LOG_FILE} — the last wrap-up is unfinished; offer to finish it (skill://teach/wrap.md) before new material.`,
				);
			}
			for (const c of shown) {
				lines.push(`- ${c.slug} | box ${c.box ?? "?"} | due ${c.due}${c.chapter ? ` | ${c.chapter}` : ""}`);
			}
			if (unscheduled.length > 0) lines.push(`unscheduled (no due date): ${unscheduled.join(", ")}`);
			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { today, due: shown, dueTotal: due.length, uncommitted: entries.length, unscheduled },
			};
		},
	});

	pi.registerTool({
		name: "learn_commit",
		label: "learn commit",
		loadMode: "essential",
		description:
			"Apply uncommitted quiz results (.learn/quiz-log.jsonl) to concept-note frontmatter using Leitner boxes (1/3/7/14/30 days): per concept, all-correct moves it up one box, any miss or 'I don't know' resets it to box 1; a note without a box starts at box 1. Writes box/due/last_reviewed. Call during wrap-up AFTER writing every concept note. Results for concepts without a note stay in the log and are reported.",
		parameters: z.object({}),
		async execute(_id, _params, _signal, _onUpdate, ctx) {
			const today = localDate();
			const { entries, malformed } = readLog(ctx.cwd);
			if (entries.length === 0 && malformed.length === 0) {
				return { content: [{ type: "text", text: "Nothing to commit: quiz log is empty." }] };
			}

			const outcomes = outcomesByConcept(entries);
			const applied: string[] = [];
			const missing = new Set<string>();
			for (const [slug, { passed, count }] of outcomes) {
				const notePath = join(ctx.cwd, CONCEPTS_DIR, `${slug}.md`);
				if (!existsSync(notePath)) {
					missing.add(slug);
					continue;
				}
				const note = readFileSync(notePath, "utf8");
				const prevBox = Number.parseInt(readFlatFrontmatter(note).box ?? "", 10);
				const next = nextReviewState(Number.isFinite(prevBox) ? prevBox : undefined, passed, today);
				writeFileSync(notePath, setFlatFrontmatter(note, { ...next }), "utf8");
				const from = Number.isFinite(prevBox) ? `box ${prevBox}` : "new";
				applied.push(`- ${slug}: ${passed ? "pass" : "miss"} (${count} q) | ${from} → box ${next.box} | due ${next.due}`);
			}

			const kept = entries.filter((e) => missing.has(e.concept));
			const committed = entries.filter((e) => !missing.has(e.concept));
			if (committed.length > 0) {
				appendFileSync(join(ctx.cwd, HISTORY_FILE), committed.map((e) => `${JSON.stringify(e)}\n`).join(""), "utf8");
			}
			const logPath = join(ctx.cwd, LOG_FILE);
			if (kept.length > 0 || malformed.length > 0) {
				writeFileSync(logPath, [...kept.map((e) => JSON.stringify(e)), ...malformed].map((l) => `${l}\n`).join(""), "utf8");
			} else {
				rmSync(logPath, { force: true });
			}

			const lines = [`Committed ${committed.length} results (${today}):`, ...applied];
			if (missing.size > 0) {
				lines.push(
					`NOT committed — no note at concepts/<slug>.md for: ${[...missing].join(", ")}. Write those notes (or fix the slug in the log) and call learn_commit again.`,
				);
			}
			if (malformed.length > 0) lines.push(`${malformed.length} malformed log lines left in ${LOG_FILE} for manual repair.`);
			return {
				content: [{ type: "text", text: lines.join("\n") }],
				details: { applied: applied.length, missing: [...missing], malformed: malformed.length },
			};
		},
	});

	pi.registerCommand("wrap", {
		description: "Wrap up the learning session: write notes, commit review results, update COURSE.md and profile",
		handler: async (args, ctx) => {
			const extra = args.trim() ? `\nExtra instructions: ${args.trim()}` : "";
			pi.sendUserMessage(`Wrap up this learning session: read skill://teach/wrap.md and follow it.${extra}`, {
				deliverAs: ctx.isIdle() ? undefined : "followUp",
			});
		},
	});

	pi.registerCommand("review", {
		description: "Review-only session on concepts due for spaced repetition (optional: max count)",
		handler: async (args, ctx) => {
			const n = Number.parseInt(args.trim(), 10);
			const cap = Number.isFinite(n) && n > 0 ? ` Review at most ${n} concepts.` : "";
			pi.sendUserMessage(`Run a review-only session: read skill://teach/review.md and follow it.${cap}`, {
				deliverAs: ctx.isIdle() ? undefined : "followUp",
			});
		},
	});

	pi.on("session_start", async (_event, ctx) => {
		if (ctx.agent?.kind !== "main") return;
		const { entries } = readLog(ctx.cwd);
		if (entries.length > 0) {
			ctx.ui.notify(
				`${entries.length} quiz results from a previous session are not committed. Run /wrap to finish that wrap-up.`,
				"warning",
			);
		}
	});
}
