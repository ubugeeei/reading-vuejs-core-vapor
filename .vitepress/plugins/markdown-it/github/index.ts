import type { PluginSimple } from "markdown-it";

import { isGithubUrl } from "./utils";
import { fetchGitHubSource } from "./fetch";
import { renderToHtml } from "./render";

export const previewGitHubSource: PluginSimple = (md) => {
  md.block.ruler.before("paragraph", "github_link_block", (state, startLine) => {
    const line = state
      .getLines(startLine, startLine + 1, state.blkIndent, false)
      .trim();

    if (!isGithubUrl(line)) {
      return false;
    }

    const token = state.push("github_link", "", 0);
    token.content = line;
    token.map = [startLine, startLine + 1];

    state.line = startLine + 1;

    return true;
  });

  md.renderer.rules.github_link = (tokens, idx) => {
    const url = tokens[idx].content;
    const data = fetchGitHubSource(url);

    if (!data) {
      return `<div class="github-source-error">Failed to load: ${url}</div>`;
    }

    return renderToHtml(data);
  };
};

export { warmCache } from "./cache";
