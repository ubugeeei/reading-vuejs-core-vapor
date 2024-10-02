import hljs from "highlight.js";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";

import type { GitHubSourceDescriptor } from "./parse";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);

export function renderToHtml(descriptor: GitHubSourceDescriptor): string {
  const { filename, lang, commitHashOrBranch, lines, codeLines } = descriptor;
  const [org, repo, ...rest] = filename.split("/");

  let codeLink = `https://github.com/${org}/${repo}/blob/${commitHashOrBranch}/${rest.join(
    "/"
  )}`;
  if (lines) {
    codeLink += `#L${lines.start + 1}`;
    if (lines.end && lines.end !== lines.start) {
      codeLink += `-L${lines.end}`;
    }
  }

  const c = lines
    ? codeLines.slice(lines.start, lines.end).join("\n")
    : codeLines.join("\n");

  const code = hljs.highlight(c, {
    language: lang,
  }).value.split("\n").map((line, i) => {
    return `<span class="line-number">${i + 1 + (lines?.start ?? 0)}</span>${line}`
  }).join("\n");

  return `
<div class="github-source">
  <div class="meta">
    <img src="https://cdn0.iconfinder.com/data/icons/shift-logotypes/32/Github-512.png" width="14px" style="display: inline; margin-right: 0.5rem; vertical-align: middle;">
    <a href="${codeLink}" target="_blank"
      ><span class="filename">${filename}</span></a
    > <span class="at">at</span> <a href="${codeLink}" target="_blank"
      ><span class="commit">${commitHashOrBranch.slice(0, 10)}</span>
    </a>
  </div>
  <pre class="code">${code}</pre>
</div>`;
}
