import { XMLHttpRequest } from "xmlhttprequest";

export function fetchHtmlSync(url: string): string {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, false, undefined, undefined);
  xhr.send(undefined);
  return xhr.responseText;
}
