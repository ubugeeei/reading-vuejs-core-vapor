import { parse as parseHtml, type HTMLElement } from "node-html-parser";

export interface GitHubSourceDescriptor {
  filename: string;
  lang: string;
  commitHashOrBranch: string;
  lines?: {
    start: number;
    end?: number;
  };
  codeLines: string[];
}

export function parse(html: string, url: string): GitHubSourceDescriptor {
  const lines = parseLines(url);

  const dom = parseHtml(html);
  const title = dom.querySelector("title")?.textContent;
  if (!title) {
    throw new Error("Title not found");
  }
  const { filename, commitHashOrBranch } = parseTitle(title);
  const lang = detectLang(filename);
  const payload = getEmbeddedCodePayload(dom);
  if (!payload) {
    throw new Error("Payload not found");
  }
  const { rawLines: codeLines } = payload.blob;

  return {
    filename: filename,
    lang,
    commitHashOrBranch: commitHashOrBranch || "main",
    lines,
    codeLines,
  };
}

function parseLines(url: string): { start: number; end?: number } {
  const [_, start, end] = url.match(/#L(\d+)(?:-L(\d+))?/) || [];
  const s = parseInt(start);
  const e = parseInt(end);
  return { start: s - 1, end: isNaN(e) ? s : e };
}

function parseTitle(raw: string): {
  filename: string;
  commitHashOrBranch?: string;
} {
  // format: path/to/file.ext at commitHash(or branch)　・ repositoryName　・ GitHub
  const [filename, _at, commitHashOrBranch, _dot, repoName, _dot2, _github] =
    raw.split(" ");

  return {
    filename: `${repoName.split("/")[0]}/${filename}`,
    commitHashOrBranch,
  };
}

function detectLang(fileName: string): string {
  return fileName.split(".").pop() ?? "plaintext";
}

type PayLoad = { blob: { rawLines: string[] } };
function getEmbeddedCodePayload(dom: HTMLElement): PayLoad | null {
  try {
    const content = dom.querySelector(
      "[data-target='react-app.embeddedData']"
    )?.innerHTML;
    if (!content) {
      return null;
    }
    return JSON.parse(content).payload;
  } catch {
    return null;
  }
}
