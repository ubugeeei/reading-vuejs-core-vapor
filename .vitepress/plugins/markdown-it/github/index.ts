import type { PluginSimple } from "markdown-it";

import { isGithubUrl } from "./utils";
import { parse } from "./parse";
import { renderToHtml } from "./render";
import { fetchHtmlSync } from "./fetch";

export const previewGitHubSource: PluginSimple = (md) => {
  md.renderer.rules.text = (tokens, idx) => {
    let c = tokens[idx].content;
    if (isGithubUrl(c)) {
      const rawHtml = fetchHtmlSync(c);
      const parsed = parse(rawHtml, c);
      const res = renderToHtml(parsed);
      return res;
    }
    return c;
  };
};
