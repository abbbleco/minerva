import type { Metadata } from "next";

import HeroHealthcare from "../../sections/industries/HeroHealthcare";
import ReviewHealthcare from "../../sections/industries/ReviewHealthcare";
import IndustriesCasesHealthcare from "../../sections/industries/IndustriesCasesHealthcare";
import CasesBannerHealthcare from "../../sections/industries/CasesBannerHealthcare";
import IPrinciplesHealthcare from "../../sections/industries/IPrinciplesHealthcare";
import IXpHealthcare from "../../sections/industries/IXpHealthcare";
import IProductHealthcare from "../../sections/industries/IProductHealthcare";
import IApproachHealthcare from "../../sections/industries/IApproachHealthcare";
import Partners from "../../sections/industries/Partners";
import QualityHealthcare from "../../sections/industries/QualityHealthcare";
import PageReviews from "../../sections/industries/PageReviews";
import IndustryNichesHealthcare from "../../sections/industries/IndustryNichesHealthcare";
import FaqHealthcare from "../../sections/industries/FaqHealthcare";
import MatchHealthcare from "../../sections/industries/MatchHealthcare";
import { IndustriesScripts } from "../../components/IndustriesScripts";

export const metadata: Metadata = {
  title: "Healthcare Design Agency | Abbble Co",
  description: "Elevate healthcare experiences with our design services. Optimize interfaces, enhance patient engagement, and innovate in the evolving healthcare landscape. Transform your projects with our cutting-edge healthcare design solutions",
  alternates: { canonical: "/industries/healthcare" },
  openGraph: {
    title: "Healthcare Design Agency | Abbble Co",
    description: "Elevate healthcare experiences with our design services. Optimize interfaces, enhance patient engagement, and innovate in the evolving healthcare landscape. Transform your projects with our cutting-edge healthcare design solutions",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/industries/healthcare`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function HealthcarePage() {
  return (
    <div className="page-main">
      <HeroHealthcare />
      <ReviewHealthcare />
      <IndustriesCasesHealthcare />
      <CasesBannerHealthcare />
      <IPrinciplesHealthcare />
      <IXpHealthcare />
      <IProductHealthcare />
      <IApproachHealthcare />
      <Partners />
      <QualityHealthcare />
      <PageReviews />
      <IndustryNichesHealthcare />
      <FaqHealthcare />
      <MatchHealthcare />
      <IndustriesScripts />
    </div>
  );
}
