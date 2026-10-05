"use client";

import { useRef, useState } from "react";

import { uploadImageAction } from "@/app/actions/cms-actions";
import type { ResponsiveImage } from "@/lib/cms/sections/schema";

import { labelStyle } from "./controls";

/**
 * Uploads through the sharp pipeline (uploadImageAction) and hands back a
 * ResponsiveImage — images are always by-reference Storage URLs, 3× WebP
 * widths (skill Rule 4). RHF-agnostic; the owner binds it via useWatch/setValue.
 */
export default function MediaPicker({
  value,
  onChange,
  folder,
  label = "Image",
}: {
  value?: ResponsiveImage;
  onChange: (image: ResponsiveImage | undefined) => void;
  folder: string;
  label?: string;
}) {
  const [alt, setAlt] = useState(value?.alt ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("alt", alt || file.name);
    fd.set("folder", folder);
    const result = await uploadImageAction(fd);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChange(result.data);
  }

  return (
    <div className="tw:mb-3">
      <span style={labelStyle}>{label.toUpperCase()}</span>

      <div
        className="tw:flex tw:items-center tw:gap-3 tw:mb-2"
        style={{
          border: "1px solid var(--m-card-stroke)",
          borderRadius: "var(--m-radius-md)",
          padding: "10px",
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.base.src}
            alt={value.alt}
            width={64}
            height={64}
            style={{
              width: 64,
              height: 64,
              objectFit: "cover",
              borderRadius: "var(--m-radius-md)",
              background: "var(--m-card-stroke)",
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "var(--m-radius-md)",
              border: "1px dashed var(--m-card-stroke)",
            }}
          />
        )}

        <div className="tw:flex-1 tw:min-w-0">
          <input
            placeholder="Alt text (required)"
            value={alt}
            onChange={(e) => {
              setAlt(e.target.value);
              if (value) onChange({ ...value, alt: e.target.value });
            }}
            className="tw:w-full tw:bg-transparent tw:outline-none tw:mb-2"
            style={{
              border: "1px solid var(--m-card-stroke)",
              borderRadius: "var(--m-radius-md)",
              padding: "6px 8px",
              fontSize: "12px",
              color: "var(--m-text-bright)",
            }}
          />
          <button
            type="button"
            className="qcms-btn"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
          </button>
          {value ? (
            <span className="qcms-mono tw:ml-2" style={{ fontSize: "9px" }}>
              {`3×WEBP ${value.responsive.map((r) => r.width).join("/")}`}
            </span>
          ) : null}
          {value ? (
            <button
              type="button"
              className="tw:ml-2"
              style={{
                fontSize: "11px",
                color: "var(--m-text-secondary)",
                textDecoration: "underline",
              }}
              onClick={() => onChange(undefined)}
            >
              remove
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p style={{ fontSize: "11px", color: "#ffb3ba" }}>{error}</p>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="tw:hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
