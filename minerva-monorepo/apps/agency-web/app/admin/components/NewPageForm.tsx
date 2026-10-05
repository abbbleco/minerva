"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createPageAction } from "@/app/actions/cms-actions";
import { PAGE_GROUP_IDS, PAGE_GROUPS } from "@/lib/cms/page-groups";

import { Field, Select, TextInput } from "./editor/controls";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewPageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [group, setGroup] = useState<string>("custom");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createPageAction({
      title,
      slug: slug || slugify(title),
      group: group as (typeof PAGE_GROUP_IDS)[number],
    });

    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push(`/admin/pages/${result.data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="qcms-card tw:max-w-xl tw:p-6">
      <p className="qcms-mono tw:mb-3">NEW PAGE</p>
      <h1 className="tw:mb-6 tw-text-white" style={{ fontSize: "23px", fontWeight: 500 }}>
        Create a page
      </h1>

      <Field label="TITLE *">
        <TextInput
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => !slugTouched && setSlug(slugify(title))}
        />
      </Field>

      <Field label="SLUG">
        <TextInput
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="auto-generated from title"
        />
      </Field>

      <Field label="PAGE GROUP *">
        <Select value={group} onChange={(e) => setGroup(e.target.value)}>
          {PAGE_GROUP_IDS.map((id) => (
            <option key={id} value={id}>
              {PAGE_GROUPS[id].label}
              {PAGE_GROUPS[id].boundRoute ? ` (${PAGE_GROUPS[id].boundRoute})` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <p className="qcms-mono tw:mb-5" style={{ fontSize: "9px" }}>
        THE GROUP DECIDES WHICH SECTION TYPES THIS PAGE MAY CONTAIN.
      </p>

      {error ? (
        <p
          className="tw:mb-4"
          style={{
            fontSize: "12px",
            padding: "9px 12px",
            borderRadius: "var(--m-radius-md)",
            border: "1px solid rgba(255,71,87,.35)",
            background: "rgba(255,71,87,.08)",
            color: "#ffb3ba",
          }}
        >
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="qcms-btn">
        {pending ? "Creating…" : "Create & edit sections"}
      </button>
    </form>
  );
}
