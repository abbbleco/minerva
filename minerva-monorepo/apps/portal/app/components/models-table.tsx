"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ModelRow {
  id: string;
  name: string;
  inPer1M: number | null;
  outPer1M: number | null;
  free: boolean;
}

function price(n: number | null): string {
  if (n == null) return "—";
  if (n === 0) return "FREE";
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

/** What's Included → 300+ MODELS: live full catalog in a scrollable box. */
export default function ModelsTable() {
  const [rows, setRows] = useState<ModelRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/portal/models", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { models?: ModelRow[] };
        if (!cancelled && Array.isArray(json.models)) setRows(json.models);
      } catch {
        // Loading snapshot stays.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="nous-card-flat overflow-hidden p-0">
      <table className="nous-table">
        <thead className="sticky top-0 bg-[#181850]">
          <tr>
            <th colSpan={2}>{rows ? `${rows.length}+ MODELS` : "300+ MODELS"}</th>
          </tr>
        </thead>
      </table>
      <div className="max-h-[320px] overflow-y-auto">
        <table className="nous-table">
          <tbody>
            {(rows ?? []).map((m) => (
              <tr key={m.id}>
                <td>
                  <p className="!text-white">{m.name}</p>
                  <p className="font-mono text-[10px] text-white/40">{m.id}</p>
                </td>
                <td className="text-right font-mono text-[11px] whitespace-nowrap text-white/50">
                  IN {price(m.inPer1M)} / OUT {price(m.outPer1M)} PER 1M
                </td>
              </tr>
            ))}
            {!rows && (
              <tr>
                <td colSpan={2} className="py-6 text-center text-white/40">
                  Loading live catalog…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="border-t border-white/10 p-3">
        <Link href="/models" className="nous-input flex items-center gap-2 !border !border-white/15 text-white/50">
          <span aria-hidden="true">⌕</span> Search provider / model
        </Link>
      </div>
    </div>
  );
}
