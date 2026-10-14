/**
 * Shared helpers for the visual-tools authoring loops (mermaid_tools.ts,
 * svg_tools.ts): a subprocess runner, Chrome discovery, a per-session managed
 * source file, and an exact-match editor (built-in edit semantics).
 *
 * Session state is NOT kept here: each register function owns its `Session`
 * in its own closure, so every omp session (including parallel subagents in
 * one process) gets its own work dir, and mermaid and svg never share a file.
 */

import { spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/** Transient session/preview files live under the OS temp dir, never the project. */
const STAGING_ROOT = join(tmpdir(), "omp-visual-tools")

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
]

export function findChrome(): string | undefined {
  for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c
  return undefined
}

export interface RunResult {
  code: number | null
  stdout: string
  stderr: string
  timedOut: boolean
}

export function run(
  cmd: string,
  args: string[],
  opts: { cwd: string; timeoutMs: number; env?: Record<string, string>; signal?: AbortSignal },
): Promise<RunResult> {
  const { promise, resolve } = Promise.withResolvers<RunResult>()
  const child = spawn(cmd, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env ?? {}) },
    signal: opts.signal,
  })
  let stdout = ""
  let stderr = ""
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    child.kill("SIGKILL")
  }, opts.timeoutMs)
  child.stdout.on("data", (d) => (stdout += d.toString()))
  child.stderr.on("data", (d) => (stderr += d.toString()))
  child.on("error", (err) => {
    clearTimeout(timer)
    resolve({ code: null, stdout, stderr: stderr + String(err), timedOut })
  })
  child.on("close", (code) => {
    clearTimeout(timer)
    resolve({ code, stdout, stderr, timedOut })
  })
  return promise
}

/** The last `n` lines of a failed command's output, for error reports. */
export function tailOutput(res: RunResult, n = 30): string {
  return (res.stderr || res.stdout || "unknown error").split("\n").slice(-n).join("\n")
}

/** One session's managed source file inside its private work dir. */
export interface Session {
  workDir: string
  bodyPath: string
}

/** A fresh, unique session for `group`; nothing touches disk until writeBody. */
export function newSession(group: string, bodyFileName: string): Session {
  const workDir = join(STAGING_ROOT, `${group}-${randomUUID()}`)
  return { workDir, bodyPath: join(workDir, bodyFileName) }
}

/** Write the full source to the session's managed file, creating its work dir. */
export function writeBody(session: Session, source: string): void {
  mkdirSync(session.workDir, { recursive: true })
  writeFileSync(session.bodyPath, source, "utf8")
}

/**
 * Exact-match single replacement on the current source, matching the built-in
 * edit: old_text must appear exactly once. Returns the updated content and the
 * match offset, or throws a precise error.
 */
export function applyEdit(current: string, oldText: string, newText: string): { updated: string; index: number } {
  if (oldText === "") throw new Error("`old_text` must be non-empty.")
  if (oldText === newText) throw new Error("`old_text` and `new_text` are identical.")
  const first = current.indexOf(oldText)
  if (first === -1) {
    throw new Error("`old_text` not found in the current source — match it exactly.")
  }
  if (current.indexOf(oldText, first + 1) !== -1) {
    let n = 0
    for (let i = first; i !== -1; i = current.indexOf(oldText, i + oldText.length)) n++
    throw new Error(`\`old_text\` appears ${n} times — add surrounding context to make it unique.`)
  }
  const updated = current.slice(0, first) + newText + current.slice(first + oldText.length)
  return { updated, index: first }
}

/** A small numbered window of `content` around char offset `index`. */
export function snippetAround(content: string, index: number, contextLines = 3): string {
  const hitLine = content.slice(0, index).split("\n").length - 1
  const lines = content.split("\n")
  const start = Math.max(0, hitLine - contextLines)
  const end = Math.min(lines.length - 1, hitLine + contextLines)
  const width = String(end + 1).length
  const out: string[] = []
  for (let i = start; i <= end; i++) out.push(`${String(i + 1).padStart(width)}  ${lines[i]}`)
  return out.join("\n")
}

export type ToolContent = Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }>
