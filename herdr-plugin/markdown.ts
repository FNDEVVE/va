import { markdownToMdast } from "satteri";

interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
  alt?: string;
  checked?: boolean | null;
}

/**
 * Convert markdown to plain spoken prose via Sätteri's MDAST parser.
 * Drops code blocks, thematic breaks, and raw HTML; tables become
 * comma-separated rows; lists flatten to prose.
 */
export function stripMarkdown(input: string): string {
  const tree = markdownToMdast(input, { features: { gfm: true } });
  return walk(tree as unknown as MdastNode)
    .replace(/[ \t]+/g, " ")
    .trim();
}

function collectText(node: MdastNode): string {
  if (node.type === "text" || node.type === "inlineCode")
    return node.value ?? "";
  if (node.type === "image") return node.alt ?? "";
  if (node.type === "link" || node.type === "list" || node.type === "listItem")
    return (node.children ?? []).map(collectText).filter(Boolean).join(" ");
  if (node.children) return node.children.map(collectText).join("");
  return node.value ?? "";
}

function walk(node: MdastNode): string {
  switch (node.type) {
    case "root":
      return (node.children ?? []).map(walk).join("\n");
    case "heading":
    case "paragraph":
    case "blockquote":
      return collectText(node);
    case "list":
      return (node.children ?? []).map(walk).join("\n");
    case "listItem": {
      const text = (node.children ?? [])
        .map(collectText)
        .filter(Boolean)
        .join(" ");
      if (!text) return "";
      if (node.checked === true) return `Done: ${text}`;
      if (node.checked === false) return `Todo: ${text}`;
      return text;
    }
    case "table":
      return (node.children ?? [])
        .map((row) =>
          (row.children ?? []).map(collectText).filter(Boolean).join(", "),
        )
        .join("\n");
    default:
      return node.value ?? (node.children ?? []).map(walk).join("\n");
  }
}

/** Truncate to maxChars, cutting at a word boundary. */
export function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (
    (lastSpace > maxChars * 0.7 ? cut.slice(0, lastSpace) : cut).trim() + "…"
  );
}
