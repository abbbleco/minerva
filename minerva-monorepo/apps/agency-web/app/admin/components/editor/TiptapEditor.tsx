"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import type { RichTextDoc } from "@/lib/cms/sections/schema";

/**
 * TipTap rich-text leaf. Persists TipTap JSON via getJSON() — the stored
 * format is always a ProseMirror document, never an HTML string (Rule 9).
 */
export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Write content…",
}: {
  value?: RichTextDoc;
  onChange: (doc: RichTextDoc) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: value ?? undefined,
    immediatelyRender: false,
    onUpdate({ editor: instance }) {
      onChange(instance.getJSON() as RichTextDoc);
    },
  });

  // Keep external resets (e.g. section swap) in sync.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON() as unknown as RichTextDoc;
    const incoming = value;
    if (incoming && JSON.stringify(current) !== JSON.stringify(incoming)) {
      editor.commands.setContent(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      className="ProseMirror-host tw:min-h-32"
      style={{
        border: "1px solid var(--m-card-stroke)",
        borderRadius: "var(--m-radius-md)",
        padding: "10px 12px",
        fontSize: "13px",
        color: "var(--m-text-bright)",
        background: "rgba(255,255,255,.02)",
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
