import Link from "next/link";

import { PAGE_GROUPS, PAGE_GROUP_IDS, getPageGroup, type PageGroupId } from "@/lib/cms/page-groups";
import { listAllPages } from "@/lib/cms/page-service";

export const metadata = { title: "All pages — Minerva CMS" };

export default async function AllPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string }>;
}) {
  const { g } = await searchParams;
  const activeGroup: PageGroupId | null =
    g && getPageGroup(g).id === g ? (g as PageGroupId) : null;

  const result = await listAllPages();
  const rows = result.ok
    ? result.data.filter((r) => !activeGroup || r.page_group === activeGroup)
    : [];

  return (
    <div>
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-6">
        <div>
          <h1 className="tw:text-lg tw-font-semibold tw-text-white">All pages</h1>
          <p className="tw:text-sm" style={{ color: "var(--m-text-secondary)" }}>
            Every CMS-managed page across all groups.
          </p>
        </div>
        <Link href="/admin/pages/new" className="qcms-btn">
          + New page
        </Link>
      </div>

      {!result.ok ? (
        <p style={{ fontSize: "12px", color: "#ffb3ba" }}>{result.error}</p>
      ) : null}

      {/* group filter chips */}
      <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mb-5">
        <Link
          href="/admin/pages"
          className={`qcms-pill ${!activeGroup ? "qcms-pill--live" : "qcms-pill--draft"}`}
        >
          ALL
        </Link>
        {PAGE_GROUP_IDS.map((id) => (
          <Link
            key={id}
            href={`/admin/pages?g=${id}`}
            className={`qcms-pill ${activeGroup === id ? "qcms-pill--live" : "qcms-pill--draft"}`}
          >
            {PAGE_GROUPS[id].label.toUpperCase()}
          </Link>
        ))}
      </div>

      <div className="qcms-card">
        {rows.length === 0 ? (
          <p className="tw:p-6" style={{ fontSize: "13px", color: "var(--m-text-secondary)" }}>
            {result.ok
              ? "No pages match this filter yet."
              : "Could not load pages."}
          </p>
        ) : (
          <ul>
            {rows.map((row) => {
              const group = getPageGroup(row.page_group);
              return (
                <li
                  key={row.id}
                  className="tw:border-b last:tw:border-b-0"
                  style={{ borderColor: "var(--m-card-stroke)" }}
                >
                  <Link
                    href={`/admin/pages/${row.id}`}
                    className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:px-5 tw:py-3 hover:bg-tint"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <span className="tw:min-w-0">
                      <span className="tw:block tw:truncate" style={{ fontSize: "14px", fontWeight: 500 }}>
                        {row.title}
                      </span>
                      <span className="qcms-mono">/{row.slug}</span>
                    </span>
                    <span className="tw:flex tw:items-center tw:gap-2 tw:shrink-0">
                      <span className="qcms-pill qcms-pill--draft">{group.label.toUpperCase()}</span>
                      <span className={`qcms-pill ${row.is_published ? "qcms-pill--live" : "qcms-pill--draft"}`}>
                        {row.is_published ? "LIVE" : "DRAFT"}
                      </span>
                      <span className="qcms-mono" style={{ fontSize: "9px" }}>
                        {new Date(row.updated_at).toISOString().slice(0, 10)}
                      </span>
                      <span className="qcms-mono">EDIT →</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
