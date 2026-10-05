import "@/css/admin.css";

import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import SignOutButton from "../components/SignOutButton";

/**
 * Guarded admin chrome. Proxy already gates /admin/*, but this re-check is
 * cheap defense-in-depth (docs: never rely on the proxy alone).
 * Visuals: DESIGN.md v2 bento-emerald — canvas + vignette + grain overlays.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="qcms">
      <div className="qcms-atmosphere qcms-atmosphere--vignette" />
      <div className="qcms-atmosphere qcms-atmosphere--grain" />

      <header
        className="tw:relative tw:z-10 tw:border-b"
        style={{ borderColor: "var(--m-card-stroke)" }}
      >
        <div className="tw:mx-auto tw:flex tw:max-w-6xl tw:items-center tw:justify-between tw:px-8 tw:py-4">
          <div className="tw:flex tw:items-center tw:gap-3">
            <span className="tw:text-sm tw:font-semibold tw:tracking-wide tw:text-white">
              Minerva CMS
            </span>
            <span className="qcms-mono">ABBBLE.CO.ZA</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="tw:relative tw:z-10 tw:mx-auto tw:max-w-6xl tw:px-8 tw:py-8">
        {children}
      </main>
    </div>
  );
}
