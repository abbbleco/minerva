"use client";

import {
  useFieldArray,
  useFormContext,
  useWatch,
  type FieldArrayPath,
  type FieldPath,
} from "react-hook-form";

import type { SectionType } from "@/lib/cms/sections/schema";
import { docToText, textToDoc } from "./text-doc";
import TiptapEditor from "./TiptapEditor";
import MediaPicker from "./MediaPicker";
import { Field, Select, TextArea, TextInput } from "./controls";

export interface EditorSection extends Record<string, unknown> {
  _id: string;
  _type: SectionType;
}

export interface EditorFormValues {
  title: string;
  slug: string;
  seo: {
    title?: string;
    description?: string;
    noindex: boolean;
    ogImage?: Record<string, unknown>;
  };
  sections: EditorSection[];
}

type Form = ReturnType<typeof useFormContext<EditorFormValues>>;
type Name = FieldPath<EditorFormValues>;

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  rich_text: "Rich text",
  faq: "FAQ",
  reviews: "Reviews",
  team_grid: "Team grid",
  logo_wall: "Logo wall",
  cases_grid: "Cases grid",
  cta: "Call to action",
  video_embed: "Video embed",
};

/** Primary-text preview for a collapsed section card. */
export function sectionPreview(section: EditorSection): string {
  const s = section as Record<string, unknown>;
  for (const key of ["heading", "title", "question"]) {
    if (typeof s[key] === "string" && (s[key] as string).trim()) {
      return (s[key] as string).slice(0, 80);
    }
  }
  if (Array.isArray(s.items) && s.items.length > 0) {
    const first = s.items[0] as Record<string, unknown>;
    const q = first?.question ?? first?.quote ?? first?.name;
    if (typeof q === "string") return q.slice(0, 80);
    return `${s.items.length} item(s)`;
  }
  if (_type(section) === "rich_text") {
    const text = docToText(s.doc).slice(0, 80);
    if (text) return text;
  }
  return "Empty section";
}

function _type(section: EditorSection): SectionType {
  return section._type;
}

/**
 * Field renderer for ONE expanded section. All paths are dynamic strings
 * under `sections.${index}`; validation happens through the Zod resolver
 * at publish time and again server-side.
 */
export default function SectionFields({
  form,
  index,
  folder,
}: {
  form: Form;
  index: number;
  folder: string;
}) {
  const sections = useWatch({ control: form.control, name: "sections" });
  const section = (sections?.[index] ?? {}) as EditorSection;

  switch (section._type) {
    case "hero":
      return <HeroFields form={form} index={index} folder={folder} />;
    case "rich_text":
      return <RichTextFields form={form} index={index} />;
    case "faq":
      return <FaqFields form={form} index={index} />;
    case "reviews":
      return <ReviewsFields form={form} index={index} folder={folder} />;
    case "team_grid":
      return <TeamFields form={form} index={index} folder={folder} />;
    case "logo_wall":
      return <LogoWallFields form={form} index={index} folder={folder} />;
    case "cases_grid":
      return <CasesFields form={form} index={index} folder={folder} />;
    case "cta":
      return <CtaFields form={form} index={index} />;
    case "video_embed":
      return <VideoFields form={form} index={index} folder={folder} />;
    default:
      return (
        <p style={{ fontSize: "12px", color: "var(--m-text-secondary)" }}>
          Unknown section type.
        </p>
      );
  }
}

// ── shared helpers ────────────────────────────────────────────────────

function p(index: number, field: string): Name {
  return `sections.${index}.${field}` as Name;
}

// ── per-type renderers ───────────────────────────────────────────────

function HeroFields({
  form,
  index,
  folder,
}: {
  form: Form;
  index: number;
  folder: string;
}) {
  const ctas = useFieldArray<EditorFormValues, FieldArrayPath<EditorFormValues>>({ control: form.control, name: p(index, "ctas") as FieldArrayPath<EditorFormValues> });
  return (
    <div>
      <Field label="Eyebrow">
        <TextInput {...form.register(p(index, "eyebrow"))} />
      </Field>
      <Field label="Heading *">
        <TextInput {...form.register(p(index, "heading"))} />
      </Field>
      <Field label="Subheading">
        <TextArea {...form.register(p(index, "subheading"))} rows={2} />
      </Field>
      <MediaPickerRhf
        form={form}
        path={p(index, "image")}
        folder={folder}
        label="Hero image"
      />
      <div className="tw:flex tw:items-center tw:justify-between tw:mt-2">
        <span style={{ fontSize: "10px", color: "var(--m-text-muted)", letterSpacing: ".6px" }}>
          CALLS TO ACTION (MAX 2)
        </span>
        <button
          type="button"
          className="qcms-btn"
          disabled={ctas.fields.length >= 2}
          onClick={() =>
            ctas.append({ label: "", href: "", style: "primary" } as never)
          }
        >
          + CTA
        </button>
      </div>
      {ctas.fields.map((field, i) => (
        <div
          key={field.id}
          className="tw:grid tw:grid-cols-[1fr_1fr_auto_auto] tw:gap-2 tw:items-start tw:mb-2"
          style={{
            border: "1px solid var(--m-card-stroke)",
            borderRadius: "var(--m-radius-md)",
            padding: "10px",
          }}
        >
          <TextInput placeholder="Label" {...form.register(p(index, `ctas.${i}.label`))} />
          <TextInput placeholder="/path or https://" {...form.register(p(index, `ctas.${i}.href`))} />
          <Select {...form.register(p(index, `ctas.${i}.style`))}>
            <option value="primary">primary</option>
            <option value="ghost">ghost</option>
          </Select>
          <RemoveBtn onClick={() => ctas.remove(i)} />
        </div>
      ))}
    </div>
  );
}

function RichTextFields({ form, index }: { form: Form; index: number }) {
  const value = useWatch({ control: form.control, name: p(index, "doc") });
  return (
    <TiptapEditor
      value={value as Record<string, unknown> | undefined}
      onChange={(doc) =>
        form.setValue(p(index, "doc"), doc as never, { shouldDirty: true })
      }
    />
  );
}

function FaqFields({ form, index }: { form: Form; index: number }) {
  const items = useFieldArray<EditorFormValues, FieldArrayPath<EditorFormValues>>({ control: form.control, name: p(index, "items") as FieldArrayPath<EditorFormValues> });
  return (
    <div>
      <Field label="Heading *">
        <TextInput {...form.register(p(index, "heading"))} />
      </Field>
      <ListHeader
        label={`QUESTIONS (${items.fields.length})`}
        onAdd={() => items.append({ question: "", answer: textToDoc("") } as never)}
      />
      {items.fields.map((field, i) => (
        <ItemBox key={field.id} onRemove={() => items.remove(i)}>
          <Field label="Question *">
            <TextInput {...form.register(p(index, `items.${i}.question`))} />
          </Field>
          <AnswerArea form={form} indexPath={p(index, `items.${i}.answer`)} />
        </ItemBox>
      ))}
    </div>
  );
}

/** FAQ answers stay TipTap JSON but edit as plain text. */
function AnswerArea({
  form,
  indexPath,
}: {
  form: Form;
  indexPath: Name;
}) {
  const value = useWatch({ control: form.control, name: indexPath });
  return (
    <Field label="Answer">
      <TextArea
        rows={3}
        defaultValue={docToText(value)}
        key={`${indexPath}-${docToText(value).length}`}
        onChange={(e) =>
          form.setValue(indexPath, textToDoc(e.target.value) as never, {
            shouldDirty: true,
          })
        }
      />
    </Field>
  );
}

function ReviewsFields({
  form,
  index,
  folder,
}: {
  form: Form;
  index: number;
  folder: string;
}) {
  const items = useFieldArray<EditorFormValues, FieldArrayPath<EditorFormValues>>({ control: form.control, name: p(index, "items") as FieldArrayPath<EditorFormValues> });
  return (
    <div>
      <Field label="Heading">
        <TextInput {...form.register(p(index, "heading"))} />
      </Field>
      <ListHeader
        label={`REVIEWS (${items.fields.length})`}
        onAdd={() => items.append({ quote: "", author: "" } as never)}
      />
      {items.fields.map((field, i) => (
        <ItemBox key={field.id} onRemove={() => items.remove(i)}>
          <Field label="Quote *">
            <TextArea {...form.register(p(index, `items.${i}.quote`))} rows={3} />
          </Field>
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <Field label="Author *">
              <TextInput {...form.register(p(index, `items.${i}.author`))} />
            </Field>
            <Field label="Role">
              <TextInput {...form.register(p(index, `items.${i}.role`))} />
            </Field>
          </div>
          <Field label="Source">
            <TextInput {...form.register(p(index, `items.${i}.source`))} />
          </Field>
          <MediaPickerRhf
            form={form}
            path={p(index, `items.${i}.avatar`) as Name}
            folder={folder}
            label="Avatar"
          />
        </ItemBox>
      ))}
    </div>
  );
}

function TeamFields({
  form,
  index,
  folder,
}: {
  form: Form;
  index: number;
  folder: string;
}) {
  const members = useFieldArray<EditorFormValues, FieldArrayPath<EditorFormValues>>({ control: form.control, name: p(index, "members") as FieldArrayPath<EditorFormValues> });
  return (
    <div>
      <Field label="Heading">
        <TextInput {...form.register(p(index, "heading"))} />
      </Field>
      <ListHeader
        label={`MEMBERS (${members.fields.length})`}
        onAdd={() => members.append({ name: "", role: "", photo: undefined } as never)}
      />
      {members.fields.map((field, i) => (
        <ItemBox key={field.id} onRemove={() => members.remove(i)}>
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <Field label="Name *">
              <TextInput {...form.register(p(index, `members.${i}.name`))} />
            </Field>
            <Field label="Role *">
              <TextInput {...form.register(p(index, `members.${i}.role`))} />
            </Field>
          </div>
          <Field label="Bio">
            <TextArea {...form.register(p(index, `members.${i}.bio`))} rows={2} />
          </Field>
          <Field label="LinkedIn URL">
            <TextInput {...form.register(p(index, `members.${i}.linkedin`))} />
          </Field>
          <MediaPickerRhf
            form={form}
            path={p(index, `members.${i}.photo`) as Name}
            folder={folder}
            label="Photo"
          />
        </ItemBox>
      ))}
    </div>
  );
}

function LogoWallFields({
  form,
  index,
  folder,
}: {
  form: Form;
  index: number;
  folder: string;
}) {
  const logos = useFieldArray<EditorFormValues, FieldArrayPath<EditorFormValues>>({ control: form.control, name: p(index, "logos") as FieldArrayPath<EditorFormValues> });
  return (
    <div>
      <Field label="Heading">
        <TextInput {...form.register(p(index, "heading"))} />
      </Field>
      <ListHeader
        label={`LOGOS (${logos.fields.length})`}
        onAdd={() => logos.append({ alt: "logo", base: { src: "", width: 0, height: 0 }, responsive: [{ src: "", width: 640 }, { src: "", width: 1024 }, { src: "", width: 1920 }] } as never)}
      />
      {logos.fields.map((field, i) => (
        <ItemBox key={field.id} onRemove={() => logos.remove(i)}>
          <MediaPickerRhf
            form={form}
            path={p(index, `logos.${i}`) as Name}
            folder={folder}
            label={`Logo ${i + 1}`}
          />
        </ItemBox>
      ))}
    </div>
  );
}

function CasesFields({
  form,
  index,
  folder,
}: {
  form: Form;
  index: number;
  folder: string;
}) {
  const items = useFieldArray<EditorFormValues, FieldArrayPath<EditorFormValues>>({ control: form.control, name: p(index, "items") as FieldArrayPath<EditorFormValues> });
  return (
    <div>
      <Field label="Heading">
        <TextInput {...form.register(p(index, "heading"))} />
      </Field>
      <ListHeader
        label={`CASES (${items.fields.length})`}
        onAdd={() => items.append({ title: "", client: "", href: "/works", tags: [] } as never)}
      />
      {items.fields.map((field, i) => (
        <ItemBox key={field.id} onRemove={() => items.remove(i)}>
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <Field label="Title *">
              <TextInput {...form.register(p(index, `items.${i}.title`))} />
            </Field>
            <Field label="Client *">
              <TextInput {...form.register(p(index, `items.${i}.client`))} />
            </Field>
          </div>
          <Field label="Link *">
            <TextInput {...form.register(p(index, `items.${i}.href`))} />
          </Field>
          <TagsInput form={form} indexPath={p(index, `items.${i}.tags`)} />
          <MediaPickerRhf
            form={form}
            path={p(index, `items.${i}.cover`) as Name}
            folder={folder}
            label="Cover"
          />
        </ItemBox>
      ))}
    </div>
  );
}

function TagsInput({ form, indexPath }: { form: Form; indexPath: Name }) {
  const value = useWatch({ control: form.control, name: indexPath });
  const text = Array.isArray(value) ? (value as string[]).join(", ") : "";
  return (
    <Field label="Tags (comma separated)">
      <TextInput
        defaultValue={text}
        key={`${indexPath}-${text}`}
        onChange={(e) =>
          form.setValue(
            indexPath,
            e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean) as never,
            { shouldDirty: true }
          )
        }
      />
    </Field>
  );
}

function CtaFields({ form, index }: { form: Form; index: number }) {
  return (
    <div>
      <Field label="Heading *">
        <TextInput {...form.register(p(index, "heading"))} />
      </Field>
      <Field label="Body">
        <TextArea {...form.register(p(index, "body"))} rows={2} />
      </Field>
      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        <Field label="Button label *">
          <TextInput {...form.register(p(index, "buttonLabel"))} />
        </Field>
        <Field label="Button link *">
          <TextInput {...form.register(p(index, "buttonHref"))} />
        </Field>
      </div>
    </div>
  );
}

function VideoFields({
  form,
  index,
  folder,
}: {
  form: Form;
  index: number;
  folder: string;
}) {
  return (
    <div>
      <Field label="YouTube / Vimeo URL *">
        <TextInput {...form.register(p(index, "url"))} />
      </Field>
      <MediaPickerRhf
        form={form}
        path={p(index, "poster")}
        folder={folder}
        label="Poster image"
      />
    </div>
  );
}

// ── glue ─────────────────────────────────────────────────────────────

/** Binds MediaPicker to an arbitrary RHF path via watch/setValue. */
export function MediaPickerRhf({
  form,
  path,
  folder,
  label,
}: {
  form: Form;
  path: Name;
  folder: string;
  label: string;
}) {
  const value = useWatch({ control: form.control, name: path }) as
    | Record<string, unknown>
    | undefined;
  return (
    <MediaPicker
      value={value as import("@/lib/cms/sections/schema").ResponsiveImage | undefined}
      onChange={(img) => form.setValue(path, img as never, { shouldDirty: true })}
      folder={folder}
      label={label}
    />
  );
}

function ListHeader({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="tw:flex tw:items-center tw:justify-between tw:mt-2 tw:mb-1">
      <span
        style={{
          fontSize: "10px",
          letterSpacing: ".6px",
          color: "var(--m-text-muted)",
        }}
      >
        {label}
      </span>
      <button type="button" className="qcms-btn" onClick={onAdd}>
        + Add
      </button>
    </div>
  );
}

function ItemBox({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <div
      className="tw:mb-2"
      style={{
        border: "1px solid var(--m-card-stroke)",
        borderRadius: "var(--m-radius-md)",
        padding: "10px",
      }}
    >
      {children}
      <div className="tw:flex tw:justify-end">
        <RemoveBtn onClick={onRemove} />
      </div>
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: "11px",
        color: "var(--m-text-secondary)",
        textDecoration: "underline",
        padding: "8px 4px",
      }}
    >
      remove
    </button>
  );
}
