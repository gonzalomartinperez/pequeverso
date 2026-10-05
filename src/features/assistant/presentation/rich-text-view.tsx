import { memo, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { type Inline, parseRichText } from "../domain/rich-text";

function inline(nodes: Inline[]): ReactNode[] {
  return nodes.map((node, index) =>
    // biome-ignore lint/suspicious/noArrayIndexKey: positional segments of an immutable text have no other identity
    node.kind === "strong" ? <strong key={index}>{node.text}</strong> : node.text,
  );
}

/** Renders the API's text format as React text elements only: no HTML, no links, no embeds. */
export const RichTextView = memo(function RichTextView({
  text,
  className,
}: {
  text: string;
  className?: string | undefined;
}) {
  const blocks = parseRichText(text);
  return (
    <div className={cx("flex flex-col gap-3 text-base text-body [overflow-wrap:anywhere]", className)}>
      {blocks.map((block, index) => {
        if (block.kind === "paragraph")
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional segments of an immutable text have no other identity
            <p key={index}>
              {block.lines.map((line, lineIndex) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: positional segments of an immutable text have no other identity
                <span key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  {inline(line)}
                </span>
              ))}
            </p>
          );
        const List = block.ordered ? "ol" : "ul";
        return (
          <List
            // biome-ignore lint/suspicious/noArrayIndexKey: positional segments of an immutable text have no other identity
            key={index}
            className={cx(
              "flex flex-col gap-1.5 ps-5",
              block.ordered ? "list-decimal" : "list-disc marker:text-icon",
            )}
          >
            {block.items.map((item, itemIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: positional segments of an immutable text have no other identity
              <li key={itemIndex} className="ps-1">
                {inline(item)}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
});
