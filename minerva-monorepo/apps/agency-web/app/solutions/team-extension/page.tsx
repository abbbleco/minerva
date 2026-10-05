import type { Metadata } from "next";

import HeroTe from "../../sections/solutions/HeroTe";
import ReviewTe from "../../sections/solutions/ReviewTe";
import GrowthTe from "../../sections/solutions/GrowthTe";
import ReviewTe2 from "../../sections/solutions/ReviewTe2";
import ExperienceTe from "../../sections/solutions/ExperienceTe";
import CasesBannerTe from "../../sections/solutions/CasesBannerTe";
import CasesTe from "../../sections/solutions/CasesTe";
import ReviewTe3 from "../../sections/solutions/ReviewTe3";
import CompaniesTe from "../../sections/solutions/CompaniesTe";
import ReviewTe4 from "../../sections/solutions/ReviewTe4";
import CasesBannerTe2 from "../../sections/solutions/CasesBannerTe2";
import FaqTe from "../../sections/solutions/FaqTe";
import ForYouTe from "../../sections/solutions/ForYouTe";
import ContactTe from "../../sections/solutions/ContactTe";
import { SolutionsScripts } from "../../components/SolutionsScripts";

export const metadata: Metadata = {
  title: "Team Extension Services",
  description: "Team Extension Services for businesses, startups, in house agencies and more. Find more info about our Team Extension Services on our website",
  alternates: { canonical: "/solutions/team-extension" },
  openGraph: {
    title: "Team Extension Services",
    description: "Team Extension Services for businesses, startups, in house agencies and more. Find more info about our Team Extension Services on our website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/solutions/team-extension`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function TeamExtensionPage() {
  return (
    <div className="page-main">
      <HeroTe />
      <ReviewTe />
      <GrowthTe />
      <ReviewTe2 />
      <ExperienceTe />
      <CasesBannerTe />
      <CasesTe />
      <ReviewTe3 />
      <CompaniesTe />
      <ReviewTe4 />
      <CasesBannerTe2 />
      <FaqTe />
      <ForYouTe />
      <ContactTe />
      <SolutionsScripts />
    </div>
  );
}
