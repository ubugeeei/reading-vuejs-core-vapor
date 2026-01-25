import hljs from "highlight.js";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";

import type { GitHubSourceData } from "./fetch";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);

export function renderToHtml(data: GitHubSourceData): string {
  const { owner, repo, commit, path, filename, lang, lines, lineStart, lineEnd, url } = data;

  const commitLink = `https://github.com/${owner}/${repo}/commit/${commit}`;
  const codeLink = url;

  const codeContent = lines.join("\n");

  const highlighted = hljs
    .highlight(codeContent, { language: lang })
    .value.split("\n")
    .map((line, i) => {
      return `<span class="line-number">${i + lineStart}</span>${line}`;
    });

  return `
<div class="github-source">
  <div class="meta">
    <img src="https://cdn0.iconfinder.com/data/icons/shift-logotypes/32/Github-512.png" width="25px" style="display: inline; margin-right: 0.5rem; vertical-align: middle;">
    <span class="file-info">
      <a href="${codeLink}" target="_blank"
        ><span class="filename">${filename}</span></a
      ><span class="line-info"
        >Lines ${lineStart} to ${lineEnd} in <a href="${commitLink}" target="_blank"><span class="commit">${commit.slice(0, 10)}</span></a></span>
    </span>
  </div>
  <pre class="code">${highlighted.join("\n")}</pre>
</div>`;
}
