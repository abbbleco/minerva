import type { Metadata } from "next";

import HeroFintech from "../../sections/industries/HeroFintech";
import Review from "../../sections/industries/Review";
import IndustriesCasesFintech from "../../sections/industries/IndustriesCasesFintech";
import CasesBannerFintech from "../../sections/industries/CasesBannerFintech";
import IPrinciplesFintech from "../../sections/industries/IPrinciplesFintech";
import IXpFintech from "../../sections/industries/IXpFintech";
import IProductFintech from "../../sections/industries/IProductFintech";
import IApproachFintech from "../../sections/industries/IApproachFintech";
import Partners from "../../sections/industries/Partners";
import Quality from "../../sections/industries/Quality";
import PageReviews from "../../sections/industries/PageReviews";
import IndustryNichesFintech from "../../sections/industries/IndustryNichesFintech";
import FaqFintech from "../../sections/industries/FaqFintech";
import Match from "../../sections/industries/Match";
import { IndustriesScripts } from "../../components/IndustriesScripts";

export const metadata: Metadata = {
  title: "Fintech Design Services | Abbble Co",
  description: "Fuel your fintech innovation with our expert design services. Elevate user experiences, optimize interfaces, and stand out in the competitive finance industry. Transform your fintech with our cutting-edge design solutions!",
  alternates: { canonical: "/industries/fintech" },
  openGraph: {
    title: "Fintech Design Services | Abbble Co",
    description: "Fuel your fintech innovation with our expert design services. Elevate user experiences, optimize interfaces, and stand out in the competitive finance industry. Transform your fintech with our cutting-edge design solutions!",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/industries/fintech`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function FintechPage() {
  return (
    <div className="page-main">
      <HeroFintech />
      <Review />
      <IndustriesCasesFintech />
      <CasesBannerFintech />
      <IPrinciplesFintech />
      <IXpFintech />
      <IProductFintech />
      <IApproachFintech />
      <Partners />
      <Quality />
      <PageReviews />
      <IndustryNichesFintech />
      <FaqFintech />
      <Match />
      <IndustriesScripts />
    </div>
  );
}
