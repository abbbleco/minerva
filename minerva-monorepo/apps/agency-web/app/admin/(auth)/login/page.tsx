"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setPending(false);
      return;
    }

    const requested = new URLSearchParams(window.location.search).get("next");
    const target =
      requested && requested.startsWith("/admin") ? requested : "/admin";
    router.replace(target);
    router.refresh();
  }

  return (
    <div className="qcms tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:p-8">
      <div className="qcms-atmosphere qcms-atmosphere--vignette" />
      <div className="qcms-atmosphere qcms-atmosphere--grain" />

      <form
        onSubmit={onSubmit}
        className="qcms-card qcms-card--glow tw:relative tw:z-10 tw:w-full tw:max-w-sm tw:p-7"
        style={{ borderRadius: "var(--m-radius-card)" }}
      >
        <p className="qcms-mono tw:mb-3">MINERVA · CONTENT OS</p>
        <h1
          className="tw:mb-1 tw:text-white"
          style={{
            fontSize: "27px",
            fontWeight: 600,
            letterSpacing: "0.2px",
            textShadow: "0 2px 12px rgba(6,40,20,.6)",
          }}
        >
          Sign in
        </h1>
        <p
          className="tw:mb-7"
          style={{ fontSize: "12px", color: "var(--m-text-muted)" }}
        >
          Manage abbble.co.za pages and sections.
        </p>

        <label
          htmlFor="email"
          className="tw:mb-1.5 tw:block"
          style={{
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.6px",
            color: "var(--m-text-muted)",
          }}
        >
          EMAIL
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="tw:mb-4 tw:w-full tw:bg-transparent tw:outline-none"
          style={{
            border: "1px solid var(--m-card-stroke)",
            borderRadius: "var(--m-radius-md)",
            padding: "10px 12px",
            fontSize: "13px",
            color: "var(--m-text-bright)",
          }}
        />

        <label
          htmlFor="password"
          className="tw:mb-1.5 tw:block"
          style={{
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.6px",
            color: "var(--m-text-muted)",
          }}
        >
          PASSWORD
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="tw:mb-5 tw:w-full tw:bg-transparent tw:outline-none"
          style={{
            border: "1px solid var(--m-card-stroke)",
            borderRadius: "var(--m-radius-md)",
            padding: "10px 12px",
            fontSize: "13px",
            color: "var(--m-text-bright)",
          }}
        />

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

        <button type="submit" disabled={pending} className="qcms-btn tw:w-full tw:justify-center">
          {pending ? "Signing in…" : "Enter CMS"}
        </button>
      </form>
    </div>
  );
}
