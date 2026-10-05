import type { Metadata } from "next";

import CmsRenderer from "@/app/sections/cms/CmsRenderer";
import PrivacyPolicySection from "../sections/policy/PrivacyPolicy";
import { PolicyWebflowScripts } from "../components/PolicyScripts";
import { getCmsPage } from "@/lib/cms/queries";
import { buildCmsMetadata } from "@/lib/cms/page-metadata";

export const revalidate = 300;

/** Legacy JSX stays as the instant-rollback path until the CMS is trusted. */
const FALLBACK_METADATA: Metadata = {
  title: "Privacy Policy | Abbble Co",
  description:
    "How Abbble Co collects, uses, and protects your personal data — definitions, data types, usage, retention, transfer, disclosure, and security practices.",
  alternates: { canonical: "/privacy-policy" },
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("privacy-policy");
  return page ? buildCmsMetadata(page) : FALLBACK_METADATA;
}

export default async function PrivacyPolicyPage() {
  const page = await getCmsPage("privacy-policy");
  return (
    <div className="page-main">
      {page ? (
        <CmsRenderer page={page} />
      ) : (
        <>
          <PrivacyPolicySection />
          <PolicyWebflowScripts />
        </>
      )}
    </div>
  );
}
