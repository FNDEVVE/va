import { markdownToMdast } from "satteri";

interface MdastNode {
  type: string;
  value?: string;
  children?: MdastNode[];
  alt?: string;
  checked?: boolean | null;
}

/** Convert markdown to plain spoken prose via Sätteri's MDAST parser. */
export function stripMarkdown(input: string): string {
  const tree = markdownToMdast(input, { features: { gfm: true } });
  return walk(tree as unknown as MdastNode).replace(/[ \t]+/g, " ").trim();
}

/** Collect inline text from a node's children (no structural formatting). */
function inlineText(node: MdastNode): string {
  return (node.children ?? [])
    .map((c) => (c.type === "text" ? c.value : c.type === "image" ? c.alt : inlineText(c)))
    .filter(Boolean)
    .join("");
}

function walk(node: MdastNode): string {
  switch (node.type) {
    case "root":
    case "list":
      return (node.children ?? []).map(walk).join("\n");
    case "heading":
    case "paragraph":
    case "blockquote":
      return inlineText(node);
    case "listItem": {
      const text = inlineText(node);
      if (!text) return "";
      if (node.checked === true) return `Done: ${text}`;
      if (node.checked === false) return `Todo: ${text}`;
      return text;
    }
    case "table":
      return (node.children ?? [])
        .map((row) => (row.children ?? []).map(inlineText).filter(Boolean).join(", "))
        .join("\n");
    default:
      return node.value ?? (node.children ?? []).map(walk).join("\n");
  }
}
