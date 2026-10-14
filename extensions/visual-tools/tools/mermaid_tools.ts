/**
 * Mermaid authoring loop for the mermaid-maker agent — three tools sharing one
 * session-scoped source file:
 *
 *   write_mermaid   — write the full Mermaid source to the session's file
 *   edit_mermaid    — exact-match old_text→new_text on that file
 *   render_mermaid  — render whatever is in the file → PNG, returned inline;
 *                     with `final: true`, also return the exact source text in
 *                     a ```mermaid fence for the maker to hand back verbatim
 *
 * Nothing is ever written into the project: the caller embeds the returned
 * Mermaid source directly in its note.
 *
 * Rendering shells out to the bundled @mermaid-js/mermaid-cli (`mmdc`) with a
 * puppeteer config pointing at an installed Chrome, so no Chromium download is
 * needed.
 */

import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  applyEdit,
  findChrome,
  run,
  type Session,
  snippetAround,
  tailOutput,
  type ToolContent,
  newSession,
  writeBody,
} from "./_common.ts"

const EXTENSION_DIR = dirname(dirname(fileURLToPath(import.meta.url)))
const MMDC_BIN = join(EXTENSION_DIR, "node_modules", ".bin", "mmdc")
const RENDER_TIMEOUT_MS = 120_000

export function registerMermaidTools(pi: ExtensionAPI): void {
  const z = pi.zod
  // Per-session: this function runs once per omp session, so parallel makers never share a file.
  const session: Session = newSession("mermaid", "diagram.mmd")
  let hasSource = false

  const requireSource = (tool: string): void => {
    if (!hasSource || !existsSync(session.bodyPath)) {
      throw new Error(`${tool}: no source yet — call write_mermaid first.`)
    }
  }

  // ── write_mermaid ──────────────────────────────────────────────────────────
  pi.registerTool({
    name: "write_mermaid",
    label: "Write Mermaid",
    defaultInactive: true,
    description:
      "Write the FULL Mermaid source to this session's managed file (your first " +
      "draft or a complete rewrite). You do NOT name the file — edit_mermaid and " +
      "render_mermaid act on the same one.\n\n" +
      "`source` is a complete Mermaid diagram, e.g. a `graph TD` / `graph LR` " +
      "flow, `sequenceDiagram`, `stateDiagram-v2`, `erDiagram`, `classDiagram`, " +
      "`mindmap`, or `timeline`. Writing does NOT render — call render_mermaid " +
      "when ready. For a small fix, prefer edit_mermaid over rewriting.",
    parameters: z.object({
      source: z
        .string()
        .describe("The complete Mermaid diagram source (starts with the diagram type, e.g. `graph TD`)."),
    }),
    async execute(_id, params) {
      const source = (params.source ?? "").trim()
      if (!source) throw new Error("`write_mermaid` requires a non-empty `source`.")
      writeBody(session, source)
      hasSource = true
      const lines = source.split("\n").length
      return {
        content: [
          {
            type: "text",
            text: `Wrote ${lines}-line Mermaid source.\nCall render_mermaid to render it, or edit_mermaid to tweak it.`,
          },
        ],
        details: { ok: true, path: session.bodyPath, lines },
      }
    },
  })

  // ── edit_mermaid ───────────────────────────────────────────────────────────
  pi.registerTool({
    name: "edit_mermaid",
    label: "Edit Mermaid",
    defaultInactive: true,
    description:
      "Make a single exact-match replacement in this session's Mermaid source — " +
      "the same contract as the built-in edit, locked to the one managed file. " +
      "`old_text` must appear EXACTLY ONCE (include surrounding context for " +
      "uniqueness); on 0 or >1 matches the call fails and nothing changes. Call " +
      "write_mermaid first. Editing does NOT render.",
    parameters: z.object({
      old_text: z.string().describe("Exact substring of the current source to replace (must match once)."),
      new_text: z.string().describe("Replacement text for `old_text`."),
    }),
    async execute(_id, params) {
      requireSource("edit_mermaid")
      const current = readFileSync(session.bodyPath, "utf8")
      const { updated, index } = applyEdit(current, String(params.old_text ?? ""), String(params.new_text ?? ""))
      writeFileSync(session.bodyPath, updated, "utf8")
      return {
        content: [
          {
            type: "text",
            text:
              "Applied edit. Updated region:\n```\n" + snippetAround(updated, index) + "\n```\nCall render_mermaid to see it.",
          },
        ],
        details: { ok: true, path: session.bodyPath },
      }
    },
  })

  // ── render_mermaid ─────────────────────────────────────────────────────────
  pi.registerTool({
    name: "render_mermaid",
    label: "Render Mermaid",
    defaultInactive: true,
    description:
      "Render the CURRENT session Mermaid source to a PNG and return it inline so " +
      "you can SEE the diagram and iterate. You do NOT pass the source here — it " +
      "comes from the managed file; call write_mermaid first.\n\n" +
      "Iterate freely without `final` (preview only). When the diagram is correct " +
      "and clean, call once more with `final: true`: that renders it one last time " +
      "and returns the exact current source in a ```mermaid fence, which you must " +
      "return verbatim. Nothing is written into the project. On a render error " +
      "this returns the error text instead of an image — fix with edit_mermaid and " +
      "re-render.",
    parameters: z.object({
      final: z
        .boolean()
        .optional()
        .describe(
          "Set true once the diagram is correct and clean: returns the exact current " +
            "source in a ```mermaid fence for you to return verbatim. Omit for a preview.",
        ),
    }),
    async execute(_id, params, signal) {
      requireSource("render_mermaid")
      const { workDir, bodyPath } = session

      if (!existsSync(MMDC_BIN)) {
        return {
          content: [
            {
              type: "text",
              text:
                `Mermaid render unavailable: ${MMDC_BIN} is missing. ` +
                `Tell the user to run \`bun install\` in ${EXTENSION_DIR}.`,
            },
          ],
          details: { ok: false },
        }
      }

      const chrome = findChrome()
      const cfgPath = join(workDir, "puppeteer.json")
      writeFileSync(
        cfgPath,
        JSON.stringify(chrome ? { executablePath: chrome, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] }),
        "utf8",
      )

      const outPath = join(workDir, `render-${Date.now()}.png`)
      const res = await run(MMDC_BIN, ["-i", bodyPath, "-o", outPath, "-p", cfgPath, "-s", "2", "-b", "white"], {
        cwd: workDir,
        timeoutMs: RENDER_TIMEOUT_MS,
        env: { PUPPETEER_SKIP_DOWNLOAD: "1" },
        signal,
      })

      if (res.code !== 0 || !existsSync(outPath)) {
        const note = res.timedOut ? "mmdc timed out.\n\n" : ""
        return {
          content: [
            {
              type: "text",
              text: `${note}Mermaid render FAILED — no image produced. Fix the source with edit_mermaid and call render_mermaid again.\n\nError:\n${tailOutput(res)}`,
            },
          ],
          details: { ok: false },
        }
      }

      const image = { type: "image" as const, data: readFileSync(outPath).toString("base64"), mimeType: "image/png" }
      const content: ToolContent = []

      if (params.final) {
        const source = readFileSync(bodyPath, "utf8")
        content.push({
          type: "text",
          text:
            "Final render. LOOK at the diagram below to confirm it is correct. If it is, " +
            "return EXACTLY this source, verbatim, as your RESULT:\n\n```mermaid\n" +
            source +
            "\n```",
        })
        content.push(image)
        return { content, details: { ok: true, path: outPath, final: true } }
      }

      content.push({
        type: "text",
        text:
          "Preview render. LOOK: are arrows/relationships correct, labels right, nothing cramped? " +
          "Fix with edit_mermaid, or re-render with `final: true` once it is right.",
      })
      content.push(image)
      return { content, details: { ok: true, path: outPath } }
    },
  })
}
