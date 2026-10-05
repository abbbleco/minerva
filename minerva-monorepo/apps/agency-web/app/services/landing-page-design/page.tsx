import type { Metadata } from "next";

import HeroLandingPageDesign from "../../sections/services/HeroLandingPageDesign";
import ReviewLandingPageDesign from "../../sections/services/ReviewLandingPageDesign";
import DiscoverLandingPageDesign from "../../sections/services/DiscoverLandingPageDesign";
import ProcessLandingPageDesign from "../../sections/services/ProcessLandingPageDesign";
import AwardsGraphicDesign from "../../sections/services/AwardsGraphicDesign";
import MvpInvestorsLandingPageDesign from "../../sections/services/MvpInvestorsLandingPageDesign";
import CasesLandingPageDesign from "../../sections/services/CasesLandingPageDesign";
import CasesBannerLandingPageDesign from "../../sections/services/CasesBannerLandingPageDesign";
import PageReviews from "../../sections/services/PageReviews";
import ForYouLandingPageDesign from "../../sections/services/ForYouLandingPageDesign";
import Partners from "../../sections/services/Partners";
import QualityLandingPageDesign from "../../sections/services/QualityLandingPageDesign";
import TeamLandingPageDesign from "../../sections/services/TeamLandingPageDesign";
import FaqLandingPageDesign from "../../sections/services/FaqLandingPageDesign";
import MatchLandingPageDesign from "../../sections/services/MatchLandingPageDesign";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Landing page design services | Abbble Co",
  description: "Landing page design Services from Abbble Co Design Agency. Try a new custom landing page design from our spesialists.",
  alternates: { canonical: "/services/landing-page-design" },
  openGraph: {
    title: "Landing page design services | Abbble Co",
    description: "Landing page design Services from Abbble Co Design Agency. Try a new custom landing page design from our spesialists.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/landing-page-design`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function LandingPageDesignPage() {
  return (
    <div className="page-main">
      <HeroLandingPageDesign />
      <ReviewLandingPageDesign />
      <DiscoverLandingPageDesign />
      <ProcessLandingPageDesign />
      <AwardsGraphicDesign />
      <MvpInvestorsLandingPageDesign />
      <CasesLandingPageDesign />
      <CasesBannerLandingPageDesign />
      <PageReviews />
      <ForYouLandingPageDesign />
      <Partners />
      <QualityLandingPageDesign />
      <TeamLandingPageDesign />
      <FaqLandingPageDesign />
      <MatchLandingPageDesign />
      <ServicesScripts />
    </div>
  );
}
