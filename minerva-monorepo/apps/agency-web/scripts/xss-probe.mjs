// P7 security probe: TipTap generateHTML must sanitize hostile JSON
// (no script tags, no event handlers, no javascript: hrefs).
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";

const malicious = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "hello", marks: [{ type: "bold" }] },
        // Attribute-injection attempts — unknown attrs must be dropped.
        {
          type: "text",
          text: " world",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    },
    {
      type: "previously_unknown_block",
      attrs: { onerror: "alert(1)" },
      content: [{ type: "text", text: "<script>alert(2)</script>" }],
    },
  ],
};

// Vector A: unknown node type must be rejected (throw → renderer drops it).
let threw = false;
try {
  generateHTML(malicious, [StarterKit]);
} catch {
  threw = true;
}
if (!threw) {
  // If it didn't throw, whatever came out must still be clean.
  const outA = (() => { try { return generateHTML(malicious, [StarterKit]); } catch { return ""; } })();
  if (/<script|onerror|previously_unknown/i.test(outA)) {
    console.error("XSS PROBE FAILED: hostile doc rendered unsanitized");
    process.exit(1);
  }
}

// Vector B: attribute/mark injection in a VALID doc must be stripped.
const html = generateHTML(
  {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "hello", marks: [{ type: "bold" }] },
          {
            type: "text",
            text: " world",
            marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
          },
        ],
      },
    ],
  },
  [StarterKit]
);
console.log("HTML:", html);

const failures = [];
if (/<script/i.test(html)) failures.push("raw <script> survived");
if (/onerror\s*=/i.test(html)) failures.push("onerror handler survived");
if (/javascript:/i.test(html)) failures.push("javascript: href survived");
if (!/hello/.test(html)) failures.push("legit content lost");

if (failures.length) {
  console.error("XSS PROBE FAILED:", failures.join("; "));
  process.exit(1);
}
console.log("XSS PROBE PASSED — unknown nodes rejected, attrs sanitized");
