"use client";

import { useEffect, useMemo, useState } from "react";

interface ModelRow {
  id: string;
  name: string;
  inPer1M: number | null;
  outPer1M: number | null;
  free: boolean;
  context?: number | null;
  promoPct?: number | null;
}

const FALLBACK: ModelRow[] = [
  { id: "minerva/openrouter-free", name: "Free Models Router (auto)", inPer1M: 0, outPer1M: 0, free: true, context: 128000 },
  { id: "minerva/qwen-qwen3.8-27b:free", name: "Qwen3.8 27B (free)", inPer1M: 0, outPer1M: 0, free: true, context: 262144 },
  { id: "minerva/anthropic-claude-opus-4.6", name: "Claude Opus 4.6", inPer1M: 5, outPer1M: 25, free: false, context: 200000 },
  { id: "minerva/anthropic-claude-sonnet-4.6", name: "Claude Sonnet 4.6", inPer1M: 3, outPer1M: 15, free: false, context: 200000 },
  { id: "minerva/google-gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", inPer1M: 2, outPer1M: 12, free: false, context: 1048576 },
  { id: "minerva/google-gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", inPer1M: 0.25, outPer1M: 1.5, free: false, context: 1048576 },
];

function fmt(n: number | null): string {
  if (n == null) return "—";
  if (n === 0) return "FREE";
  return `$${n.toFixed(2)}`;
}

export default function ModelsClient({ routerBase }: { routerBase: string }) {
  const [rows, setRows] = useState<ModelRow[]>(FALLBACK);
  const [live, setLive] = useState(false);
  const [q, setQ] = useState("");
  const [provider, setProvider] = useState("all");
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portal/models", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { models?: ModelRow[] };
        if (!cancelled && Array.isArray(json.models) && json.models.length > 0) {
          setRows(json.models);
          setLive(true);
        }
      } catch {
        // Catalog fallback stays.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const slug = r.id.replace(/^minerva\//, "");
      const prov = slug.includes("-") ? slug.split("-")[0] : slug.split("/")[0] || "other";
      set.add(prov);
    }
    return ["all", ...[...set].sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "free" && !r.free) return false;
      if (filter === "paid" && r.free) return false;
      if (provider !== "all") {
        const slug = r.id.replace(/^minerva\//, "").toLowerCase();
        if (!slug.startsWith(provider.toLowerCase())) return false;
      }
      if (needle && !`${r.id} ${r.name}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, q, provider, filter]);

  const promos = useMemo(() => rows.filter((r) => (r.promoPct ?? 0) >= 25).slice(0, 9), [rows]);
  const free = useMemo(() => rows.filter((r) => r.free), [rows]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  function resetPage() {
    setPage(0);
  }

  return (
    <div className="px-6 pt-8 md:px-10">
      <h1 className="nous-display text-[40px] md:text-[52px]">Active Promos</h1>
      <p className="mt-2 font-mono text-[11px] text-white/40">
        {live ? `LIVE · ${routerBase}/v1/models` : "CATALOG SNAPSHOT · sign in for live prices"} · US dollars per
        one million tokens, updated every minute from the live model catalog.
      </p>

      {promos.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {promos.map((m) => (
            <div key={m.id} className="nous-card-flat p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-white">{m.name}</p>
                {m.promoPct != null && (
                  <span className="rounded-[2px] bg-[#f5b942] px-1.5 py-0.5 font-mono text-[10px] font-bold text-black">
                    {m.promoPct}% OFF
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-[10px] text-white/40 uppercase">{m.id}</p>
              <p className="mt-2 font-mono text-[11px] text-white/70">
                in {fmt(m.inPer1M)} / out {fmt(m.outPer1M)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-[13px] text-white/50">
          No promo beats the list rate by ≥25% right now — the full table below always shows live
          portal vs list pricing.
        </p>
      )}

      <h2 className="nous-display mt-10 text-[40px] md:text-[52px]">Free Models</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {free.map((m) => (
          <span key={m.id} className="nous-chip">
            {m.name}
          </span>
        ))}
        {free.length === 0 && <p className="text-[13px] text-white/50">No free models in this snapshot.</p>}
      </div>

      <h2 className="nous-display mt-10 text-[40px] md:text-[52px]">All Models</h2>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[11px] tracking-widest text-white/50 uppercase">
          Search
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              resetPage();
            }}
            placeholder="provider/model-name"
            className="nous-input !w-64 !border !border-white/15"
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] tracking-widest text-white/50 uppercase">
          Provider
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              resetPage();
            }}
            className="nous-input !w-48 !border !border-white/15"
          >
            {providers.map((p) => (
              <option key={p} value={p} className="bg-[#0a0a2b]">
                {p === "all" ? "All Providers" : p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] tracking-widest text-white/50 uppercase">
          Per page
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              resetPage();
            }}
            className="nous-input !w-28 !border !border-white/15"
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n} className="bg-[#0a0a2b]">
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 pb-0.5">
          {(["all", "free", "paid"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                resetPage();
              }}
              className={`nous-chip !cursor-pointer ${filter === f ? "!border-white !text-white" : ""}`}
            >
              {f === "all" ? "All models" : f}
            </button>
          ))}
        </div>
        <p className="ml-auto font-mono text-[11px] text-white/40">
          Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + pageSize, filtered.length)} of{" "}
          {filtered.length} models
        </p>
      </div>

      <div className="nous-card-flat mt-4 overflow-x-auto p-0">
        <table className="nous-table min-w-[760px]">
          <thead>
            <tr>
              <th>Model</th>
              <th>Type</th>
              <th>Portal price</th>
              <th>List price</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((m) => (
              <tr key={m.id}>
                <td>
                  <p className="font-semibold text-white">{m.name}</p>
                  <p className="font-mono text-[10px] text-white/40">{m.id}</p>
                </td>
                <td className="font-mono text-[11px] uppercase">{m.free ? "FREE" : "TEXT"}</td>
                <td className="font-mono text-[11px]">
                  IN {fmt(m.inPer1M)} / OUT {fmt(m.outPer1M)}
                </td>
                <td className="font-mono text-[11px] text-white/40">—</td>
                <td className="font-mono text-[11px]">
                  {m.promoPct != null ? (
                    <span className="rounded-[2px] bg-[#f5b942] px-1.5 py-0.5 font-bold text-black">
                      {m.promoPct}% OFF
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-center gap-6 font-mono text-[11px] tracking-widest text-white/60 uppercase">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={safePage === 0}
          className="uppercase underline-offset-4 hover:text-white hover:underline disabled:opacity-30 disabled:hover:no-underline"
        >
          Previous
        </button>
        <span>
          Page {safePage + 1} of {pageCount}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={safePage >= pageCount - 1}
          className="uppercase underline-offset-4 hover:text-white hover:underline disabled:opacity-30 disabled:hover:no-underline"
        >
          Next
        </button>
      </div>
      <p className="mt-4 pb-10 text-[11px] leading-relaxed text-white/40">
        Prices are US dollars per one million tokens{live ? " from the live catalog" : " from the pinned catalog snapshot"}.
        A per-model promo appears when both input and output rates beat the list rate by at least
        25%.
      </p>
    </div>
  );
}
