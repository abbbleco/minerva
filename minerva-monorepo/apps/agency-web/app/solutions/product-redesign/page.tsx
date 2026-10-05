import type { Metadata } from "next";

import HeroPr from "../../sections/solutions/HeroPr";
import ReviewPr from "../../sections/solutions/ReviewPr";
import ConcernPr from "../../sections/solutions/ConcernPr";
import RedesignPr from "../../sections/solutions/RedesignPr";
import CasesPr from "../../sections/solutions/CasesPr";
import CasesBannerPr from "../../sections/solutions/CasesBannerPr";
import Pros from "../../sections/solutions/Pros";
import DeliverablesPr from "../../sections/solutions/DeliverablesPr";
import CasesBannerPr2 from "../../sections/solutions/CasesBannerPr2";
import ProcessPr from "../../sections/solutions/ProcessPr";
import ReviewPr2 from "../../sections/solutions/ReviewPr2";
import CompaniesPr from "../../sections/solutions/CompaniesPr";
import CasesBannerPr3 from "../../sections/solutions/CasesBannerPr3";
import FaqPr from "../../sections/solutions/FaqPr";
import ForYouPr from "../../sections/solutions/ForYouPr";
import ContactPr from "../../sections/solutions/ContactPr";
import { SolutionsScripts } from "../../components/SolutionsScripts";

export const metadata: Metadata = {
  title: "SaaS Product Redesign Services, App Redesign Agency",
  description: "Digital Product Redesign Agency Abbble Co provides best redesign services for reasonable prices. Contact us for more information about product redesign services.",
  alternates: { canonical: "/solutions/product-redesign" },
  openGraph: {
    title: "SaaS Product Redesign Services, App Redesign Agency",
    description: "Digital Product Redesign Agency Abbble Co provides best redesign services for reasonable prices. Contact us for more information about product redesign services.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/solutions/product-redesign`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function ProductRedesignPage() {
  return (
    <div className="page-main">
      <HeroPr />
      <ReviewPr />
      <ConcernPr />
      <RedesignPr />
      <CasesPr />
      <CasesBannerPr />
      <Pros />
      <DeliverablesPr />
      <CasesBannerPr2 />
      <ProcessPr />
      <ReviewPr2 />
      <CompaniesPr />
      <CasesBannerPr3 />
      <FaqPr />
      <ForYouPr />
      <ContactPr />
      <SolutionsScripts />
    </div>
  );
}
