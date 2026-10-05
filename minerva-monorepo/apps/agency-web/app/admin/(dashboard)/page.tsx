import Link from "next/link";
import type { Metadata } from "next";

import {
  PAGE_GROUP_IDS,
  PAGE_GROUPS,
  getPageGroup,
  type PageGroupId,
} from "@/lib/cms/page-groups";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pages — Minerva CMS",
};

interface PageRow {
  id: string;
  slug: string;
  page_group: string;
  title: string;
  is_published: boolean;
  updated_at: string;
}

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_pages")
    .select("id, slug, page_group, title, is_published, updated_at")
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as PageRow[];

  const byGroup = new Map<PageGroupId, PageRow[]>();
  for (const id of PAGE_GROUP_IDS) {
    byGroup.set(id, []);
  }
  for (const row of rows) {
    byGroup.get(getPageGroup(row.page_group).id)?.push(row);
  }

  return (
    <div>
      <div className="tw:mb-6 tw:flex tw:items-center tw:justify-between">
        <div>
          <h1 className="tw:text-lg tw-font-semibold">Pages</h1>
          <p className="tw:text-sm" style={{ color: "var(--m-text-secondary)" }}>
            Pick a page to edit its sections. Groups mirror the live site map.
          </p>
        </div>
        <Link href="/admin/pages/new" className="qcms-btn">
          + New page
        </Link>
      </div>

      {error ? (
        <p
          className="tw:mb-6"
          style={{
            fontSize: "12px",
            padding: "10px 14px",
            borderRadius: "var(--m-radius-md)",
            border: "1px solid rgba(255,71,87,.35)",
            background: "rgba(255,71,87,.08)",
            color: "#ffb3ba",
          }}
        >
          Could not load pages ({error.message}). If you just signed up, ask an
          existing admin to set your profiles.is_admin flag.
        </p>
      ) : null}

      {!error && rows.length === 0 ? (
        <div className="qcms-card tw:mb-5 tw:p-6">
          <p className="qcms-mono tw:mb-2">EMPTY STATE</p>
          <p style={{ fontSize: "13px", color: "var(--m-text-secondary)" }}>
            No pages in the CMS yet. Seeding happens in P3/P6 — the shell is
            wired and reading the live table.
          </p>
        </div>
      ) : null}

      {/* Group tiles — bento rhythm: tall-left feel via auto-fit columns,
          20px gaps (never tighter per DESIGN.md whitespace philosophy). */}
      <div className="tw:grid tw:grid-cols-1 tw:gap-5 md:tw:grid-cols-2 xl:tw:grid-cols-3">
        {PAGE_GROUP_IDS.map((groupId) => {
          const group = PAGE_GROUPS[groupId];
          const groupRows = byGroup.get(groupId) ?? [];
          return (
            <article key={groupId} className="qcms-card">
              <header
                className="tw:flex tw:items-center tw:justify-between tw:border-b"
                style={{
                  padding: "16px 20px",
                  borderColor: "var(--m-card-stroke)",
                }}
              >
                <h2 style={{ fontSize: "15px", fontWeight: 600 }}>
                  {group.label}
                </h2>
                <span className="qcms-pill qcms-pill--draft">
                  {groupRows.length} PAGE{groupRows.length === 1 ? "" : "S"}
                </span>
              </header>

              {group.boundRoute ? (
                <p className="tw:px-5 tw:pt-3">
                  <span className="qcms-mono">BOUND → {group.boundRoute}</span>
                </p>
              ) : null}

              <ul className="tw:flex tw:flex-col tw:gap-1 tw:p-3">
                {groupRows.map((row) => (
                  <li key={row.id} className="tw-rounded-lg">
                    <Link
                      href={`/admin/pages/${row.id}`}
                      className="tw-flex tw:items-center tw:justify-between tw:gap-3"
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        borderRadius: "var(--m-radius-md)",
                        padding: "8px 10px",
                      }}
                    >
                      <span className="tw:min-w-0">
                        <span
                          className="tw:block tw:truncate"
                          style={{ fontSize: "13px", fontWeight: 500 }}
                        >
                          {row.title}
                        </span>
                        <span className="qcms-mono tw:block tw:truncate">
                          /{row.slug}
                        </span>
                      </span>
                      <span
                        className={`qcms-pill ${
                          row.is_published ? "qcms-pill--live" : "qcms-pill--draft"
                        }`}
                      >
                        {row.is_published ? "LIVE" : "DRAFT"}
                      </span>
                    </Link>
                  </li>
                ))}
                {groupRows.length === 0 ? (
                  <li
                    className="tw:px-2.5 tw:py-2"
                    style={{
                      fontSize: "11px",
                      color: "var(--m-text-muted)",
                    }}
                  >
                    No pages yet.
                  </li>
                ) : null}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
}
