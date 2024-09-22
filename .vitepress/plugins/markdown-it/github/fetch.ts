import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { XMLHttpRequest } from "xmlhttprequest";

const __dirname = dirname(new URL(import.meta.url).pathname);
const CACHE_FILE = resolve(
  __dirname,
  "../../../cache/markdown-it-github.cache.json"
);

/** url(string) - content(string) */
type Cache = Record<string, string>;
const cache: Cache = JSON.parse(
  (() => {
    try {
      mkdirSync(dirname(CACHE_FILE), { recursive: true });
      return readFileSync(CACHE_FILE, "utf-8");
    } catch {
      return "{}";
    }
  })()
);

export function fetchHtmlSync(url: string): string {
  const c = cache[url];
  if (c) {
    return c;
  }

  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, false, undefined, undefined);
  xhr.send(undefined);

  const res = xhr.responseText;
  cache[url] = res;
  writeFileSync(CACHE_FILE, JSON.stringify(cache));
  return xhr.responseText;
}
