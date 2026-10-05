"use client";

import type { ReactNode } from "react";

/** Shared bento-styled control primitives for the page editor (DESIGN.md). */

export const inputStyle = {
  border: "1px solid var(--m-card-stroke)",
  borderRadius: "var(--m-radius-md)",
  padding: "8px 10px",
  fontSize: "13px",
  color: "var(--m-text-bright)",
  background: "rgba(255,255,255,.02)",
} as const;

export const labelStyle = {
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.6px",
  color: "var(--m-text-muted)",
  marginBottom: "4px",
  display: "block",
} as const;

const inputCls =
  "tw:w-full tw:bg-transparent tw:outline-none focus:border-color-transition";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="tw:mb-3">
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`${inputCls} ${props.className ?? ""}`}
      style={{ ...inputStyle, ...(props.style ?? {}) }}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      rows={props.rows ?? 3}
      className={`${inputCls} ${props.className ?? ""}`}
      style={{ ...inputStyle, resize: "vertical", ...(props.style ?? {}) }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputCls} ${props.className ?? ""}`}
      style={inputStyle}
    />
  );
}

export function HintError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="tw:mt-1" style={{ fontSize: "11px", color: "#ffb3ba" }}>
      {message}
    </p>
  );
}
