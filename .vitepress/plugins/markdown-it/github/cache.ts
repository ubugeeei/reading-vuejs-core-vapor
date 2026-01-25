import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(new URL(import.meta.url).pathname);
const CACHE_FILE = resolve(
  __dirname,
  "../../../cache/markdown-it-github.cache.json"
);
const SRC_DIR = resolve(__dirname, "../../../../src");

interface CacheEntry {
  content: string;
  timestamp: number;
}

type Cache = Record<string, CacheEntry>;

let cache: Cache | null = null;

export function getCache(): Cache {
  if (cache !== null) return cache;

  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    if (existsSync(CACHE_FILE)) {
      cache = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    } else {
      cache = {};
    }
  } catch {
    cache = {};
  }
  return cache!;
}

export function saveCache(c: Cache): void {
  try {
    mkdirSync(dirname(CACHE_FILE), { recursive: true });
    writeFileSync(CACHE_FILE, JSON.stringify(c, null, 2));
  } catch (e) {
    console.warn("Failed to save cache:", e);
  }
}

export function getCacheFile(): string {
  return CACHE_FILE;
}

/**
 * Parse GitHub URL to extract owner, repo, commit, and path
 */
export function parseGitHubUrl(url: string): {
  owner: string;
  repo: string;
  commit: string;
  path: string;
  lineStart?: number;
  lineEnd?: number;
} | null {
  const match = url.match(
    /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+?)(?:#L(\d+)(?:-L(\d+))?)?$/
  );
  if (!match) return null;

  const [, owner, repo, commit, path, lineStart, lineEnd] = match;
  return {
    owner,
    repo,
    commit,
    path,
    lineStart: lineStart ? parseInt(lineStart, 10) : undefined,
    lineEnd: lineEnd ? parseInt(lineEnd, 10) : undefined,
  };
}

/**
 * Get raw GitHub URL for fetching content
 */
export function getRawUrl(owner: string, repo: string, commit: string, path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${commit}/${path}`;
}

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Extract GitHub URLs from markdown content
 */
function extractGitHubUrls(content: string): string[] {
  const urls: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("https://github.com/") && trimmed.includes("/blob/")) {
      urls.push(trimmed);
    }
  }

  return urls;
}

/**
 * Scan all markdown files and extract GitHub URLs
 */
export function scanAllGitHubUrls(): string[] {
  const mdFiles = findMarkdownFiles(SRC_DIR);
  const allUrls = new Set<string>();

  for (const file of mdFiles) {
    const content = readFileSync(file, "utf-8");
    const urls = extractGitHubUrls(content);
    for (const url of urls) {
      allUrls.add(url);
    }
  }

  return Array.from(allUrls);
}

/**
 * Warm the cache by fetching all GitHub URLs in parallel
 */
export async function warmCache(): Promise<void> {
  const urls = scanAllGitHubUrls();
  const cache = getCache();

  // Find URLs that need to be fetched
  const urlsToFetch: Array<{ url: string; rawUrl: string }> = [];

  for (const url of urls) {
    const parsed = parseGitHubUrl(url);
    if (!parsed) continue;

    const rawUrl = getRawUrl(parsed.owner, parsed.repo, parsed.commit, parsed.path);
    if (!cache[rawUrl]) {
      urlsToFetch.push({ url, rawUrl });
    }
  }

  if (urlsToFetch.length === 0) {
    console.log(`✓ Cache is up to date (${urls.length} URLs cached)`);
    return;
  }

  console.log(`Fetching ${urlsToFetch.length} GitHub sources...`);

  // Fetch all URLs in parallel with concurrency limit
  const CONCURRENCY = 10;
  const results: Array<{ rawUrl: string; content: string }> = [];

  for (let i = 0; i < urlsToFetch.length; i += CONCURRENCY) {
    const batch = urlsToFetch.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async ({ rawUrl }) => {
        try {
          const response = await fetch(rawUrl);
          if (!response.ok) {
            console.warn(`Failed to fetch ${rawUrl}: ${response.status}`);
            return { rawUrl, content: "" };
          }
          const content = await response.text();
          return { rawUrl, content };
        } catch (e) {
          console.warn(`Error fetching ${rawUrl}:`, e);
          return { rawUrl, content: "" };
        }
      })
    );
    results.push(...batchResults);
    process.stdout.write(`\r  ${Math.min(i + CONCURRENCY, urlsToFetch.length)}/${urlsToFetch.length}`);
  }

  console.log("");

  // Update cache
  for (const { rawUrl, content } of results) {
    if (content) {
      cache[rawUrl] = {
        content,
        timestamp: Date.now(),
      };
    }
  }

  saveCache(cache);
  console.log(`✓ Cached ${results.filter((r) => r.content).length} GitHub sources`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("cache.ts")) {
  warmCache().catch(console.error);
}
