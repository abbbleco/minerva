import type { RichTextDoc } from "@/lib/cms/sections/schema";

/**
 * Plain-text ↔ TipTap JSON bridges. Used where a full editor is overkill
 * (FAQ answers): stored format stays TipTap JSON — never raw HTML (Rule 9).
 */
export function emptyDoc(): RichTextDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function textToDoc(text: string): RichTextDoc {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  if (blocks.length === 0) return emptyDoc();
  return {
    type: "doc",
    content: blocks.map((block) => ({
      type: "paragraph",
      content: [{ type: "text", text: block }],
    })),
  };
}

export function docToText(doc: unknown): string {
  if (typeof doc !== "object" || doc === null) return "";
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node !== "object" || node === null) return;
    const n = node as Record<string, unknown>;
    if (n.type === "text" && typeof n.text === "string") {
      out.push(n.text);
      return;
    }
    if (Array.isArray(n.content)) {
      const paraBreak = n.type === "paragraph" && out.length > 0 ? "\n\n" : "";
      out.push(paraBreak);
      n.content.forEach(walk);
    }
  };
  walk(doc);
  return out.join("").trim();
}
