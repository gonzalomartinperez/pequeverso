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
    const match = comment.trim().match(/^biome-ignore\s+([^:]+):\s*(.*)$/s);
    if (!match) return /^biome-ignore\b/.test(comment.trim()) ? [`${file} malformed`] : [];
    const valid = /\S.*\s(?:#\d+|https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+)\s*$/.test(
      match[2] ?? "",
    );
    return valid ? [] : [`${file} ${match[1]}`];
  });
}
