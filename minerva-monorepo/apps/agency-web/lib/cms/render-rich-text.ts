import "server-only";

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

/**
 * Server-side TipTap JSON → sanitized HTML (skill Rule 9).
 * generateHTML rebuilds markup from the ProseMirror document, so only
 * schema-known tags/attributes survive — stored raw HTML never reaches the DOM.
 */
export function renderRichText(doc: unknown): string {
  if (
    typeof doc !== "object" ||
    doc === null ||
    (doc as Record<string, unknown>).type !== "doc"
  ) {
    return "";
  }
  try {
    return generateHTML(doc as Parameters<typeof generateHTML>[0], [StarterKit]);
  } catch {
    // ProseMirror throws on unknown node/mark types (corrupt or hostile
    // JSONB) — drop the block instead of 500-ing a public route.
    return "";
  }
}
