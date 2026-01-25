import { getCache, parseGitHubUrl, getRawUrl } from "./cache";

export interface GitHubSourceData {
  owner: string;
  repo: string;
  commit: string;
  path: string;
  filename: string;
  lang: string;
  lines: string[];
  lineStart: number;
  lineEnd: number;
  url: string;
}

/**
 * Fetch GitHub source from cache (must be pre-warmed)
 */
export function fetchGitHubSource(url: string): GitHubSourceData | null {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    console.warn(`Invalid GitHub URL: ${url}`);
    return null;
  }

  const { owner, repo, commit, path, lineStart, lineEnd } = parsed;
  const rawUrl = getRawUrl(owner, repo, commit, path);
  const cache = getCache();

  const cached = cache[rawUrl];
  if (!cached) {
    console.warn(`Cache miss for ${rawUrl}. Run 'bun run cache' first.`);
    return null;
  }

  const allLines = cached.content.split("\n");
  const start = lineStart ? lineStart - 1 : 0;
  const end = lineEnd ?? (lineStart ?? allLines.length);
  const lines = allLines.slice(start, end);

  const filename = `${owner}/${repo}/${path}`;
  const lang = path.split(".").pop() ?? "plaintext";

  return {
    owner,
    repo,
    commit,
    path,
    filename,
    lang,
    lines,
    lineStart: start + 1,
    lineEnd: end,
    url,
  };
}
