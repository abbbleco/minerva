import type { Metadata } from "next";

import CmsRenderer from "@/app/sections/cms/CmsRenderer";
import EditorialPolicySection from "../sections/policy/EditorialPolicy";
import { PolicyWebflowScripts } from "../components/PolicyScripts";
import { getCmsPage } from "@/lib/cms/queries";
import { buildCmsMetadata } from "@/lib/cms/page-metadata";

export const revalidate = 300;

const FALLBACK_METADATA: Metadata = {
  title: "Editorial Policy | Abbble Co",
  description:
    "Abbble Co's editorial guidelines — principles, ethics, editorial process, quality standards, corrections, and authorship of our published content.",
  alternates: { canonical: "/editorial-policy" },
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("editorial-policy");
  return page ? buildCmsMetadata(page) : FALLBACK_METADATA;
}

export default async function EditorialPolicyPage() {
  const page = await getCmsPage("editorial-policy");
  return (
    <div className="page-main">
      {page ? (
        <CmsRenderer page={page} />
      ) : (
        <>
          <EditorialPolicySection />
          <PolicyWebflowScripts />
        </>
      )}
    </div>
  );
}
