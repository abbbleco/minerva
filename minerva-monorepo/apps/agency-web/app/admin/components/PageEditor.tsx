"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type Resolver,
} from "react-hook-form";

import {
  deletePageAction,
  publishPageAction,
  saveDraftAction,
  unpublishPageAction,
} from "@/app/actions/cms-actions";
import type { PageGroupId } from "@/lib/cms/page-groups";
import type { SectionType } from "@/lib/cms/sections/schema";
import { cmsPageInputSchema } from "@/lib/cms/sections/schema";

import {
  SECTION_LABELS,
  MediaPickerRhf,
  sectionPreview,
  type EditorFormValues,
  type EditorSection,
} from "./editor/SectionFields";

const SectionFieldsLazy = dynamic(() => import("./editor/SectionFields"), {
  ssr: false,
  loading: () => (
    <p className="qcms-mono" style={{ fontSize: "10px", padding: "12px 0" }}>
      LOADING FIELDS…
    </p>
  ),
});

const EMPTY_SECTIONS: Record<
  SectionType,
  () => Record<string, unknown>
> = {
  hero: () => ({ heading: "", ctas: [] }),
  rich_text: () => ({
    doc: { type: "doc", content: [{ type: "paragraph" }] },
  }),
  faq: () => ({ heading: "", items: [] }),
  reviews: () => ({ items: [] }),
  team_grid: () => ({ members: [] }),
  logo_wall: () => ({ logos: [] }),
  cases_grid: () => ({ items: [] }),
  cta: () => ({ heading: "", buttonLabel: "", buttonHref: "" }),
  video_embed: () => ({ url: "" }),
};

export interface PageEditorProps {
  page: {
    id: string;
    slug: string;
    group: PageGroupId;
    groupLabel: string;
    title: string;
    isPublished: boolean;
    allowedSections: SectionType[];
    seo: {
      title?: string;
      description?: string;
      noindex?: boolean;
      ogImage?: Record<string, unknown>;
    };
  };
  initialSections: EditorSection[];
}

export default function PageEditor({
  page,
  initialSections,
}: PageEditorProps) {
  const router = useRouter();
  const [published, setPublished] = useState(page.isPublished);
  // Expansion keyed by the section's own _id → survives reorders.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{
    kind: "ok" | "err";
    text: string;
  } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const lastSavedRef = useRef(
    JSON.stringify(initialSnapshot(page, initialSections))
  );
  const busyRef = useRef(false);

  const form = useForm<EditorFormValues>({
    defaultValues: {
      title: page.title,
      slug: page.slug,
      seo: { noindex: false, ...page.seo },
      sections: initialSections,
    },
    resolver: zodResolver(
      cmsPageInputSchema
    ) as unknown as Resolver<EditorFormValues>,
    mode: "onSubmit",
  });

  const sectionsArray = useFieldArray({ control: form.control, name: "sections" });
  const watched = useWatch({ control: form.control });

  // ── autosave: draft semantics, 2s debounce, snapshot-diffed ──────────
  const snapshot = JSON.stringify(watched);
  useEffect(() => {
    if (busyRef.current || snapshot === lastSavedRef.current) return;
    const timer = setTimeout(() => {
      void persist("draft");
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (JSON.stringify(form.getValues()) !== lastSavedRef.current) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist(
    mode: "draft" | "publish"
  ): Promise<{ ok: boolean }> {
    if (busyRef.current) return { ok: false };
    busyRef.current = true;
    if (mode === "draft") setSaveState("saving");

    const values = form.getValues();
    const payload = {
      title: values.title,
      slug: values.slug,
      seo: values.seo,
      sections: values.sections,
    };
    const result =
      mode === "publish"
        ? await publishPageAction(page.id, page.group, payload)
        : await saveDraftAction(page.id, page.group, payload);

    busyRef.current = false;

    if (!result.ok) {
      setBanner({ kind: "err", text: result.error });
      setSaveState("idle");
      return { ok: false };
    }

    lastSavedRef.current = JSON.stringify(form.getValues());
    setBanner(null);
    setSaveState("saved");
    if (mode === "publish") {
      setPublished(true);
    }
    router.refresh();
    setTimeout(() => setSaveState("idle"), 1500);
    return { ok: true };
  }

  const onPublish = form.handleSubmit(
    async () => {
      await persist("publish");
    },
    (errors) => {
      const sectionErrors = errors.sections;
      const count = Array.isArray(sectionErrors)
        ? sectionErrors.filter(Boolean).length
        : 0;
      const seoMessage = (
        errors.seo as { message?: string } | undefined
      )?.message;
      const root = [errors.title?.message, errors.slug?.message, seoMessage].find(
        (m): m is string => typeof m === "string"
      );
      setBanner({
        kind: "err",
        text:
          root ??
          (count > 0
            ? `Cannot publish: ${count} section${count === 1 ? "" : "s"} have validation errors (marked below).`
            : "Cannot publish — fix validation errors."),
      });
    }
  );

  async function onUnpublish() {
    const res = await unpublishPageAction(page.id);
    if (res.ok) {
      setPublished(false);
      router.refresh();
    } else {
      setBanner({ kind: "err", text: res.error });
    }
  }

  async function onDelete() {
    if (!window.confirm(`Delete "${page.title}" permanently?`)) return;
    const res = await deletePageAction(page.id);
    if (res.ok) {
      router.push("/admin/pages");
    } else {
      setBanner({ kind: "err", text: res.error });
    }
  }

  // ── dnd-kit vertical reorder through native array methods ────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sectionsArray.fields.map((f) => f.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1 || from === to) return;

    const reordered = arrayMove(sectionsArray.fields, from, to);
    const targetOrderIds = new Set(reordered.map((f) => f.id));
    // Reapply the visual order one swap at a time via move().
    let guard = 0;
    while (
      sectionsArray.fields.some((f, i) => f.id !== reordered[i]?.id) &&
      guard < 200
    ) {
      for (let i = 0; i < sectionsArray.fields.length; i += 1) {
        const wanted = reordered[i];
        if (!wanted || targetOrderIds.size === 0) break;
        const currentIndex = sectionsArray.fields.findIndex(
          (f) => f.id === wanted.id
        );
        if (currentIndex > i) {
          sectionsArray.move(currentIndex, i);
          break;
        }
      }
      guard += 1;
    }
  }

  function addSection(type: SectionType) {
    const _id = crypto.randomUUID();
    sectionsArray.append({
      _id,
      _type: type,
      ...EMPTY_SECTIONS[type](),
    } as EditorSection);
    setExpandedId(_id);
  }

  const values = watched as Partial<EditorFormValues>;
  const expandedIndex = (values.sections ?? []).findIndex(
    (s) => s?._id === expandedId
  );
  const folder = `page-${page.id.slice(0, 8)}`;

  return (
    <div className="tw:pb-24">
      {/* ── sticky action bar ── */}
      <header
        className="tw:sticky tw:top-0 tw:z-20 tw:-mx-8 tw:px-8 tw:py-3 tw:mb-6 tw:border-b"
        style={{
          borderColor: "var(--m-card-stroke)",
          background: "linear-gradient(180deg,#0a0f0d,#080c0a)",
        }}
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <Link href="/admin/pages" className="qcms-mono" style={{ fontSize: "10px" }}>
            ← PAGES
          </Link>

          <input
            {...form.register("title")}
            aria-label="Page title"
            className="tw:flex-1 tw:min-w-0 tw:bg-transparent tw:outline-none tw:text-white"
            style={{ fontSize: "16px", fontWeight: 600 }}
          />

          <span className={`qcms-pill ${published ? "qcms-pill--live" : "qcms-pill--draft"}`}>
            {published ? "LIVE" : "DRAFT"}
          </span>

          <span className="qcms-mono tw:w-14 tw:text-right" style={{ fontSize: "9px" }}>
            {saveState === "saving"
              ? "SAVING…"
              : saveState === "saved"
                ? "SAVED ✓"
                : ""}
          </span>

          <button type="button" className="qcms-btn" onClick={() => void persist("draft")}>
            Save draft
          </button>

          {published ? (
            <button type="button" className="qcms-btn" onClick={() => void onUnpublish()}>
              Unpublish
            </button>
          ) : null}

          <button
            type="button"
            className="qcms-btn"
            onClick={() => void onPublish()}
            style={{
              background: "var(--m-mint-ramp)",
              color: "var(--m-text-inverse)",
              border: "none",
            }}
          >
            Publish
          </button>
        </div>
      </header>

      {banner ? (
        <p
          className="tw:mb-4"
          role="status"
          style={{
            fontSize: "12px",
            padding: "10px 14px",
            borderRadius: "var(--m-radius-md)",
            border: `1px solid ${banner.kind === "err" ? "rgba(255,71,87,.35)" : "var(--m-glow-ring)"}`,
            background:
              banner.kind === "err"
                ? "rgba(255,71,87,.08)"
                : "rgba(52,211,153,.08)",
            color: banner.kind === "err" ? "#ffb3ba" : "var(--m-primary-text)",
          }}
        >
          {banner.text}
        </p>
      ) : null}

      {/* ── page settings ── */}
      <div className="qcms-card tw:p-5 tw:mb-5">
        <p className="qcms-mono tw:mb-3">
          PAGE SETTINGS · GROUP: {page.groupLabel.toUpperCase()}
        </p>
        <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-[1fr_1fr_auto] tw:gap-3 tw:items-end">
          <div>
            <span
              style={{
                fontSize: "10px",
                color: "var(--m-text-muted)",
                letterSpacing: ".6px",
                display: "block",
                marginBottom: 4,
              }}
            >
              SLUG
            </span>
            <div className="tw:flex tw:items-center tw:gap-1">
              <span className="qcms-mono">/</span>
              <input
                {...form.register("slug")}
                aria-label="Slug"
                className="tw:flex-1 tw:bg-transparent tw:outline-none"
                style={{
                  border: "1px solid var(--m-card-stroke)",
                  borderRadius: "var(--m-radius-md)",
                  padding: "7px 10px",
                  fontSize: "13px",
                  color: "var(--m-text-bright)",
                }}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="seo-title"
              style={{
                fontSize: "10px",
                color: "var(--m-text-muted)",
                letterSpacing: ".6px",
                display: "block",
                marginBottom: 4,
              }}
            >
              SEO TITLE OVERRIDE
            </label>
            <input
              id="seo-title"
              {...form.register("seo.title")}
              className="tw:w-full tw:bg-transparent tw:outline-none"
              style={{
                border: "1px solid var(--m-card-stroke)",
                borderRadius: "var(--m-radius-md)",
                padding: "7px 10px",
                fontSize: "13px",
                color: "var(--m-text-bright)",
              }}
            />
          </div>
          <label
            className="tw:flex tw:items-center tw:gap-2 tw:pb-2"
            style={{ fontSize: "12px" }}
          >
            <input type="checkbox" {...form.register("seo.noindex")} />
            noindex
          </label>
        </div>

        <div className="tw:mt-3">
          <span
            style={{
              fontSize: "10px",
              color: "var(--m-text-muted)",
              letterSpacing: ".6px",
              display: "block",
              marginBottom: 4,
            }}
          >
            META DESCRIPTION
          </span>
          <textarea
            {...form.register("seo.description")}
            rows={2}
            className="tw:w-full tw:bg-transparent tw:outline-none"
            style={{
              border: "1px solid var(--m-card-stroke)",
              borderRadius: "var(--m-radius-md)",
              padding: "8px 10px",
              fontSize: "13px",
              color: "var(--m-text-bright)",
              resize: "vertical",
            }}
          />
        </div>

        <MediaPickerRhf
          form={form}
          path={"seo.ogImage" as never}
          folder={folder}
          label="Social share image (og)"
        />
      </div>

      {/* ── list-based section builder (skill Rule 5) ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={sectionsArray.fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="tw:flex tw:flex-col tw:gap-3">
            {sectionsArray.fields.map((field, index) => {
              const section = values.sections?.[index];
              const type: SectionType = section?._type ?? "rich_text";
              const isOpen = index === expandedIndex && expandedIndex >= 0;

              return (
                <SortableSectionCard
                  key={field.id}
                  id={field.id}
                  collapsed={!isOpen}
                  label={SECTION_LABELS[type]}
                  preview={
                    section
                      ? sectionPreview(section)
                      : ""
                  }
                  onToggle={() =>
                    setExpandedId(isOpen ? null : (section?._id ?? null))
                  }
                  onRemove={() => {
                    if (window.confirm("Remove this section?")) {
                      sectionsArray.remove(index);
                    }
                  }}
                >
                  {isOpen ? (
                    <SectionFieldsLazy
                      form={form}
                      index={index}
                      folder={folder}
                    />
                  ) : null}
                </SortableSectionCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* ── add section — constrained by this page's group allow-list ── */}
      <details className="qcms-card tw:mt-4 tw:p-4">
        <summary className="qcms-btn tw:inline-flex" style={{ listStyle: "none" }}>
          + Add section
        </summary>
        <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mt-4">
          {page.allowedSections.map((type) => (
            <button
              key={type}
              type="button"
              className="qcms-btn"
              onClick={() => addSection(type)}
            >
              {SECTION_LABELS[type]}
            </button>
          ))}
        </div>
        <p className="qcms-mono tw:mt-3" style={{ fontSize: "9px" }}>
          ALLOW-LIST ENFORCED BY THE PAGE GROUP REGISTRY (UI + SERVER ACTIONS)
        </p>
      </details>

      {/* ── danger zone ── */}
      <div className="tw:mt-8 tw:flex tw:justify-end">
        <button
          type="button"
          onClick={() => void onDelete()}
          style={{
            fontSize: "11px",
            color: "#ffb3ba",
            textDecoration: "underline",
          }}
        >
          Delete this page
        </button>
      </div>
    </div>
  );
}

function initialSnapshot(
  page: PageEditorProps["page"],
  sections: EditorSection[]
): Record<string, unknown> {
  return {
    title: page.title,
    slug: page.slug,
    seo: { noindex: false, ...page.seo },
    sections,
  };
}

function SortableSectionCard({
  id,
  collapsed,
  label,
  preview,
  children,
  onToggle,
  onRemove,
}: {
  id: string;
  collapsed: boolean;
  label: string;
  preview: string;
  children: React.ReactNode;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <article
      ref={setNodeRef}
      className="qcms-card"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 30 : undefined,
      }}
    >
      <div
        className="tw:flex tw:items-center tw:gap-3"
        style={{ padding: "14px 18px" }}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="qcms-mono"
          style={{ cursor: "grab", fontSize: "14px", lineHeight: 1 }}
        >
          ⠿
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="tw:flex-1 tw:text-left tw:min-w-0"
        >
          <span className="qcms-pill qcms-pill--draft" style={{ marginRight: 8 }}>
            {label.toUpperCase()}
          </span>
          {collapsed ? (
            <span style={{ fontSize: "12px", color: "var(--m-text-secondary)" }}>
              {preview}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="qcms-mono"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "▾" : "▴"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove section"
          style={{
            fontSize: "11px",
            color: "var(--m-text-secondary)",
            textDecoration: "underline",
          }}
        >
          remove
        </button>
      </div>

      {!collapsed ? <div style={{ padding: "4px 18px 18px" }}>{children}</div> : null}
    </article>
  );
}
