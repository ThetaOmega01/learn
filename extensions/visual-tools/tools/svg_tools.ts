/**
 * SVG authoring loop for the svg-maker agent — three tools sharing one
 * session-scoped source file:
 *
 *   write_svg   — write the full SVG source to the session's file
 *   edit_svg    — exact-match old_text→new_text on that file
 *   render_svg  — rasterize whatever is in the file → PNG, returned inline;
 *                 with `save_as`, also copy the SVG SOURCE into
 *                 <cwd>/assets/<slug>-<timestamp>.svg
 *
 * Previews are rasterized by headless Chrome: the SVG is loaded as an <img> in
 * a white HTML page sized to the SVG's width/height (or viewBox), then
 * screenshotted at 2x. Before that, Chrome parses the raw SVG once so XML
 * errors come back as text instead of a broken-image picture.
 */

import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import {
  applyEdit,
  findChrome,
  newSession,
  run,
  type Session,
  snippetAround,
  tailOutput,
  type ToolContent,
  writeBody,
} from "./_common.ts"

const RENDER_TIMEOUT_MS = 60_000
const FALLBACK_SIZE = { width: 800, height: 600 }
const MAX_SIDE = 4096

/** CSS-pixel size of the root <svg>: width/height attrs, else viewBox, else 800x600. */
function svgSize(source: string): { width: number; height: number } {
  const open = /<svg\b[^>]*>/i.exec(source)?.[0] ?? ""
  // Only unitless or px lengths are usable as pixels; `%`, `cm`, `em`… fall through.
  const length = (attr: string): number | undefined => {
    const m = new RegExp(`\\s${attr}\\s*=\\s*["']\\s*([0-9.]+)\\s*(?:px)?\\s*["']`).exec(open)
    const n = m ? Number(m[1]) : NaN
    return n > 0 ? n : undefined
  }
  let width = length("width")
  let height = length("height")
  const vb = /\sviewBox\s*=\s*["']\s*[-0-9.e]+[\s,]+[-0-9.e]+[\s,]+([0-9.e]+)[\s,]+([0-9.e]+)\s*["']/i.exec(open)
  const vbW = vb ? Number(vb[1]) : NaN
  const vbH = vb ? Number(vb[2]) : NaN
  if (vbW > 0 && vbH > 0) {
    if (width === undefined && height === undefined) {
      width = vbW
      height = vbH
    } else if (width === undefined) {
      width = (height! * vbW) / vbH
    } else if (height === undefined) {
      height = (width * vbH) / vbW
    }
  }
  if (width === undefined || height === undefined) return FALLBACK_SIZE
  const clamp = (n: number) => Math.min(MAX_SIDE, Math.max(1, Math.ceil(n)))
  return { width: clamp(width), height: clamp(height) }
}

type Rasterized = { ok: true } | { ok: false; error: string }

/** Rasterize `svgPath` to `outPath` (2x PNG on white) with headless Chrome. */
async function rasterize(
  chrome: string,
  svgPath: string,
  outPath: string,
  workDir: string,
  signal: AbortSignal | undefined,
): Promise<Rasterized> {
  const opts = { cwd: workDir, timeoutMs: RENDER_TIMEOUT_MS, signal }
  const headless = ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check"]

  // 1. Parse check: Chrome's XML parser reports malformed SVG as a <parsererror> element.
  const dom = await run(chrome, [...headless, "--dump-dom", pathToFileURL(svgPath).href], opts)
  if (dom.code !== 0) return { ok: false, error: `Chrome failed to load the SVG:\n${tailOutput(dom)}` }
  const parseError = /<parsererror\b[\s\S]*?<\/parsererror>/i.exec(dom.stdout)
  if (parseError) {
    const text = parseError[0]
      .replace(/<[^>]+>/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n")
    return { ok: false, error: `SVG is not well-formed XML:\n${text}` }
  }

  // 2. Screenshot a white page holding exactly the SVG at its intrinsic size.
  const { width, height } = svgSize(readFileSync(svgPath, "utf8"))
  const htmlPath = join(workDir, "preview.html")
  writeFileSync(
    htmlPath,
    `<!doctype html><html><head><meta charset="utf-8"><style>` +
      `html,body{margin:0;padding:0;background:#fff;overflow:hidden}img{display:block}` +
      `</style></head><body><img src="${pathToFileURL(svgPath).href}" width="${width}" height="${height}"></body></html>`,
    "utf8",
  )
  const shot = await run(
    chrome,
    [
      ...headless,
      `--screenshot=${outPath}`,
      `--window-size=${width},${height}`,
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      pathToFileURL(htmlPath).href,
    ],
    opts,
  )
  if (shot.code !== 0 || !existsSync(outPath)) {
    const note = shot.timedOut ? "Chrome timed out.\n\n" : ""
    return { ok: false, error: `${note}Chrome screenshot failed:\n${tailOutput(shot)}` }
  }
  return { ok: true }
}

export function registerSvgTools(pi: ExtensionAPI): void {
  const z = pi.zod
  // Per-session: this function runs once per omp session, so parallel makers never share a file.
  const session: Session = newSession("svg", "diagram.svg")
  let hasSource = false

  const requireSource = (tool: string): void => {
    if (!hasSource || !existsSync(session.bodyPath)) {
      throw new Error(`${tool}: no source yet — call write_svg first.`)
    }
  }

  // ── write_svg ──────────────────────────────────────────────────────────────
  pi.registerTool({
    name: "write_svg",
    label: "Write SVG",
    defaultInactive: true,
    description:
      "Write the FULL SVG source to this session's managed file (your first draft " +
      "or a complete rewrite). You do NOT name the file — edit_svg and render_svg " +
      "act on the same one.\n\n" +
      "`source` is a complete `<svg ...>…</svg>` document with an explicit width/" +
      "height (or viewBox), readable font sizes, and a light or transparent " +
      "background. Writing does NOT render — call render_svg when ready. For a " +
      "small fix, prefer edit_svg over rewriting.",
    parameters: z.object({
      source: z.string().describe("The complete SVG document, from `<svg` to `</svg>`."),
    }),
    async execute(_id, params) {
      const source = (params.source ?? "").trim()
      if (!source) throw new Error("`write_svg` requires a non-empty `source`.")
      if (!source.includes("<svg")) throw new Error("`write_svg`: source must be a complete <svg>…</svg> document.")
      writeBody(session, source)
      hasSource = true
      const lines = source.split("\n").length
      return {
        content: [
          { type: "text", text: `Wrote ${lines}-line SVG source.\nCall render_svg to render it, or edit_svg to tweak it.` },
        ],
        details: { ok: true, path: session.bodyPath, lines },
      }
    },
  })

  // ── edit_svg ───────────────────────────────────────────────────────────────
  pi.registerTool({
    name: "edit_svg",
    label: "Edit SVG",
    defaultInactive: true,
    description:
      "Make a single exact-match replacement in this session's SVG source — the " +
      "same contract as the built-in edit, locked to the one managed file. " +
      "`old_text` must appear EXACTLY ONCE (include surrounding context for " +
      "uniqueness); on 0 or >1 matches the call fails and nothing changes. Call " +
      "write_svg first. Editing does NOT render.",
    parameters: z.object({
      old_text: z.string().describe("Exact substring of the current source to replace (must match once)."),
      new_text: z.string().describe("Replacement text for `old_text`."),
    }),
    async execute(_id, params) {
      requireSource("edit_svg")
      const current = readFileSync(session.bodyPath, "utf8")
      const { updated, index } = applyEdit(current, String(params.old_text ?? ""), String(params.new_text ?? ""))
      writeFileSync(session.bodyPath, updated, "utf8")
      return {
        content: [
          {
            type: "text",
            text: "Applied edit. Updated region:\n```\n" + snippetAround(updated, index) + "\n```\nCall render_svg to see it.",
          },
        ],
        details: { ok: true, path: session.bodyPath },
      }
    },
  })

  // ── render_svg ─────────────────────────────────────────────────────────────
  pi.registerTool({
    name: "render_svg",
    label: "Render SVG",
    defaultInactive: true,
    description:
      "Render the CURRENT session SVG source to a PNG and return it inline so you " +
      "can SEE the picture and iterate. You do NOT pass the source here — it comes " +
      "from the managed file; call write_svg first.\n\n" +
      "Iterate freely with no `save_as` (preview only). When the picture is " +
      "correct and clean, call once more with `save_as` set to a short kebab-case " +
      "topic slug: that copies the SVG source into <cwd>/assets with a unique " +
      "filename and returns the filename and absolute path. On a render error this " +
      "returns the error text instead of an image — fix with edit_svg and re-render.",
    parameters: z.object({
      save_as: z
        .string()
        .optional()
        .describe(
          "Short kebab-case topic slug (e.g. 'number-line'). When set, the SVG source " +
            "is saved to <cwd>/assets/<slug>-<timestamp>.svg and the filename and path " +
            "are returned. Omit for a preview-only render.",
        ),
    }),
    async execute(_id, params, signal, _onUpdate, ctx) {
      requireSource("render_svg")
      const { workDir, bodyPath } = session

      const chrome = findChrome()
      if (!chrome) {
        return {
          content: [
            {
              type: "text",
              text:
                "SVG render unavailable: no Google Chrome or Chromium found " +
                "(looked in /Applications). Tell the user to install Google Chrome.",
            },
          ],
          details: { ok: false },
        }
      }

      const outPath = join(workDir, `render-${Date.now()}.png`)
      const result = await rasterize(chrome, bodyPath, outPath, workDir, signal)
      if (!result.ok) {
        return {
          content: [
            {
              type: "text",
              text: `SVG render FAILED — no image produced. Fix the source with edit_svg and call render_svg again.\n\n${result.error}`,
            },
          ],
          details: { ok: false },
        }
      }

      const image = { type: "image" as const, data: readFileSync(outPath).toString("base64"), mimeType: "image/png" }
      const content: ToolContent = []

      if (params.save_as) {
        const slug =
          String(params.save_as)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "diagram"
        const assetsDir = join(ctx.cwd, "assets")
        mkdirSync(assetsDir, { recursive: true })
        const filename = `${slug}-${Date.now()}.svg`
        const path = join(assetsDir, filename)
        copyFileSync(bodyPath, path)
        content.push({
          type: "text",
          text: `Saved SVG to assets/.\nfilename: ${filename}\npath: ${path}\n\nLOOK at the picture below to confirm the geometry is correct before returning it.`,
        })
        content.push(image)
        return { content, details: { ok: true, path, filename } }
      }

      content.push({
        type: "text",
        text:
          "Preview render (not yet saved). LOOK: are coordinates, angles, directions, and proportions correct? " +
          "Labels clear and unclipped? Fix with edit_svg, or re-render with `save_as` to save it.",
      })
      content.push(image)
      return { content, details: { ok: true, path: outPath } }
    },
  })
}
