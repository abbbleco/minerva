import type { Metadata } from "next";

import CmsRenderer from "@/app/sections/cms/CmsRenderer";
import CookiePolicySection from "../sections/policy/CookiePolicy";
import { PolicyWebflowScripts } from "../components/PolicyScripts";
import { getCmsPage } from "@/lib/cms/queries";
import { buildCmsMetadata } from "@/lib/cms/page-metadata";

export const revalidate = 300;

const FALLBACK_METADATA: Metadata = {
  title: "Cookie Policy | Abbble Co",
  description:
    "Learn how Abbble Co uses cookies and trackers, how you can control them, and your rights regarding third-party trackers.",
  alternates: { canonical: "/cookie-policy" },
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("cookie-policy");
  return page ? buildCmsMetadata(page) : FALLBACK_METADATA;
}

export default async function CookiePolicyPage() {
  const page = await getCmsPage("cookie-policy");
  return (
    <div className="page-main">
      {page ? (
        <CmsRenderer page={page} />
      ) : (
        <>
          <CookiePolicySection />
          <PolicyWebflowScripts />
        </>
      )}
    </div>
  );
}
