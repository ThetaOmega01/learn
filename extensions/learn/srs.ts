/**
 * Leitner-box scheduling and concept-note frontmatter I/O for the learn
 * extension. Pure functions only; index.ts owns the filesystem walk.
 *
 * Review state lives in each concept note's YAML frontmatter as flat scalars:
 *
 *   box: 2                 # 1..5
 *   due: 2026-10-17        # YYYY-MM-DD, local calendar date
 *   last_reviewed: 2026-10-14
 *
 * Only flat `key: value` lines are read or written; other frontmatter (lists,
 * nested maps) is preserved byte-for-byte.
 */

/** Days until the next review, indexed by box - 1 (boxes 1..5). */
export const INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
export const MAX_BOX = INTERVAL_DAYS.length;

export interface QuizLogEntry {
	ts: string;
	concept: string;
	correct: boolean;
	dontKnow?: boolean;
	question?: string;
}

export interface ReviewState {
	box: number;
	due: string;
	last_reviewed: string;
}

/** Local calendar date as YYYY-MM-DD. */
export function localDate(now: Date = new Date()): string {
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/** Calendar arithmetic on YYYY-MM-DD strings (UTC math, so no DST drift). */
export function addDays(date: string, days: number): string {
	const [y, m, d] = date.split("-").map(Number);
	const t = new Date(Date.UTC(y, m - 1, d + days));
	return t.toISOString().slice(0, 10);
}

/**
 * One commit's outcome for one concept. A concept with no box yet is new and
 * starts in box 1 whatever the result. Otherwise a pass moves it up one box
 * (capped at MAX_BOX) and any miss sends it back to box 1.
 */
export function nextReviewState(prevBox: number | undefined, passed: boolean, today: string): ReviewState {
	const box = prevBox === undefined || !passed ? 1 : Math.min(prevBox + 1, MAX_BOX);
	return { box, due: addDays(today, INTERVAL_DAYS[box - 1]), last_reviewed: today };
}

/**
 * Collapse a commit's log entries per concept: the concept passes only if
 * every tagged answer in the batch was correct ("I don't know" is a miss).
 * Several quizzes on one concept in one session therefore move it at most one
 * box.
 */
export function outcomesByConcept(entries: QuizLogEntry[]): Map<string, { passed: boolean; count: number }> {
	const out = new Map<string, { passed: boolean; count: number }>();
	for (const e of entries) {
		const prev = out.get(e.concept) ?? { passed: true, count: 0 };
		out.set(e.concept, { passed: prev.passed && e.correct && !e.dontKnow, count: prev.count + 1 });
	}
	return out;
}

const FM_OPEN = /^---\r?\n/;
const FM_CLOSE = /\r?\n---[ \t]*(\r?\n|$)/;
const FLAT_LINE = /^([A-Za-z_][\w-]*):[ \t]*(.*)$/;

function frontmatterBounds(text: string): { bodyStart: number; bodyEnd: number } | undefined {
	const open = FM_OPEN.exec(text);
	if (!open) return undefined;
	const bodyStart = open[0].length;
	const close = FM_CLOSE.exec(text.slice(bodyStart - 1));
	if (!close) return undefined;
	return { bodyStart, bodyEnd: bodyStart - 1 + close.index };
}

/** Top-level flat scalar fields of the frontmatter; quotes stripped. */
export function readFlatFrontmatter(text: string): Record<string, string> {
	const bounds = frontmatterBounds(text);
	if (!bounds) return {};
	const fields: Record<string, string> = {};
	for (const line of text.slice(bounds.bodyStart, bounds.bodyEnd).split(/\r?\n/)) {
		const m = FLAT_LINE.exec(line);
		if (!m) continue;
		fields[m[1]] = m[2].trim().replace(/^(["'])(.*)\1$/, "$2");
	}
	return fields;
}

/**
 * Set flat scalar fields, replacing existing top-level lines in place and
 * appending missing keys at the end of the frontmatter. A note without
 * frontmatter gets one.
 */
export function setFlatFrontmatter(text: string, updates: Record<string, string | number>): string {
	const bounds = frontmatterBounds(text);
	if (!bounds) {
		const block = Object.entries(updates)
			.map(([k, v]) => `${k}: ${v}`)
			.join("\n");
		return `---\n${block}\n---\n${text}`;
	}
	const lines = text.slice(bounds.bodyStart, bounds.bodyEnd).split("\n");
	const pending = new Map(Object.entries(updates));
	for (let i = 0; i < lines.length; i++) {
		const m = FLAT_LINE.exec(lines[i]);
		if (m && pending.has(m[1])) {
			lines[i] = `${m[1]}: ${pending.get(m[1])}`;
			pending.delete(m[1]);
		}
	}
	for (const [k, v] of pending) lines.push(`${k}: ${v}`);
	return text.slice(0, bounds.bodyStart) + lines.join("\n") + text.slice(bounds.bodyEnd);
}
