import type { PluginSimple } from "markdown-it";

import { isGithubUrl } from "./utils";
import { parse } from "./parse";
import { renderToHtml } from "./render";
import { fetchHtmlSync } from "./fetch";

export const previewGitHubSource: PluginSimple = (md) => {
  md.block.ruler.before('paragraph', 'github_link_block', (state, startLine) => {
    const line = state.getLines(startLine, startLine + 1, state.blkIndent, false).trim()

    if (!isGithubUrl(line)) {
      return false
    }

    const token = state.push('github_link', '', 0)
    token.content = line
    token.map = [startLine, startLine + 1]

    state.line = startLine + 1

    return true
  })

  md.renderer.rules.github_link = (tokens, idx) => {
    const c = tokens[idx].content
    const rawHtml = fetchHtmlSync(c)
    const parsed = parse(rawHtml, c)
    const res = renderToHtml(parsed)
    return res
  }
}