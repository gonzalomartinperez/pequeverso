import { parseSync } from "oxc-parser";
import postcss from "postcss";

/** Return missing issue references from actual comments, never strings containing fixtures. */
export function missingIssueReferences(file: string, source: string): string[] {
  let comments: string[];
  if (file.endsWith(".css")) {
    comments = [];
    postcss.parse(source).walkComments((comment) => {
      comments.push(comment.text);
    });
  } else if (file.endsWith(".json")) {
    comments = [...source.matchAll(/\/\*([\s\S]*?)\*\/|^\s*\/\/(.*)$/gm)].map(
      (match) => match[1] ?? match[2] ?? "",
    );
  } else comments = parseSync(file, source).comments.map((comment) => comment.value);
  return comments.flatMap((comment) => {
    const text = comment.trim();
    // `-end` closes a range and carries no reason, so it has no place for an issue.
    if (/^biome-ignore-end\b/.test(text)) return [];
    const match = text.match(/^biome-ignore(?:-all|-start)?\s+([^:]+):\s*(.*)$/s);
    if (!match) return /^biome-ignore\b/.test(text) ? [`${file} malformed`] : [];
    const valid = /\S.*\s(?:#\d+|https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+)\s*$/.test(
      match[2] ?? "",
    );
    return valid ? [] : [`${file} ${match[1]}`];
  });
}
