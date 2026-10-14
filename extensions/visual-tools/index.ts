/**
 * visual-tools
 *
 * omp extension providing the authoring loops for the two diagram-maker agents:
 *
 *   • write_mermaid / edit_mermaid / render_mermaid  (tools/mermaid_tools.ts)
 *       mermaid-maker's loop: write a Mermaid source, exact-match edit it,
 *       render it to a PNG (bundled @mermaid-js/mermaid-cli + installed Chrome)
 *       and return the PNG inline for inspection. `final: true` also returns
 *       the exact source in a ```mermaid fence for the maker to hand back.
 *   • write_svg / edit_svg / render_svg  (tools/svg_tools.ts)
 *       svg-maker's loop: same shape for hand-written SVG, rasterized by
 *       headless Chrome. `save_as` copies the SVG source into <cwd>/assets.
 *
 * All six tools are registered with `defaultInactive: true`: the main agent
 * never sees them; only agents that list them in their `tools:` frontmatter
 * (agents/mermaid-maker.md, agents/svg-maker.md) get them.
 *
 * omp runs this factory once per session (subagents included), so each register
 * function keeps its managed source file in its own closure — parallel makers
 * in one process never clobber each other.
 *
 * Setup: `bun install` in this directory (installs mmdc; bun skips puppeteer's
 * browser download, and rendering uses the installed Google Chrome).
 */

import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent"
import { registerMermaidTools } from "./tools/mermaid_tools.ts"
import { registerSvgTools } from "./tools/svg_tools.ts"

export default function visualTools(pi: ExtensionAPI): void {
  registerMermaidTools(pi)
  registerSvgTools(pi)
}
