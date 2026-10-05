import type { Metadata } from "next";

import HeroUiConcept from "../../sections/services/HeroUiConcept";
import ReviewMobileDesign from "../../sections/services/ReviewMobileDesign";
import DiscoverUiConcept from "../../sections/services/DiscoverUiConcept";
import ProcessUiConcept from "../../sections/services/ProcessUiConcept";
import AwardsMobileDesign from "../../sections/services/AwardsMobileDesign";
import MvpInvestorsUiConcept from "../../sections/services/MvpInvestorsUiConcept";
import CasesUiConcept from "../../sections/services/CasesUiConcept";
import CasesBannerUiConcept from "../../sections/services/CasesBannerUiConcept";
import PageReviews from "../../sections/services/PageReviews";
import ForYouUiConcept from "../../sections/services/ForYouUiConcept";
import Partners from "../../sections/services/Partners";
import QualityLandingPageDesign from "../../sections/services/QualityLandingPageDesign";
import TeamUiConcept from "../../sections/services/TeamUiConcept";
import FaqUiConcept from "../../sections/services/FaqUiConcept";
import MatchUiConcept from "../../sections/services/MatchUiConcept";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "UI Concept Services | Abbble Co",
  description: "UI Concept Services from Abbble Co Design Agency. Try a new custom UI Concept Services from our spesialists.",
  alternates: { canonical: "/services/ui-concept" },
  openGraph: {
    title: "UI Concept Services | Abbble Co",
    description: "UI Concept Services from Abbble Co Design Agency. Try a new custom UI Concept Services from our spesialists.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/ui-concept`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function UiConceptPage() {
  return (
    <div className="page-main">
      <HeroUiConcept />
      <ReviewMobileDesign />
      <DiscoverUiConcept />
      <ProcessUiConcept />
      <AwardsMobileDesign />
      <MvpInvestorsUiConcept />
      <CasesUiConcept />
      <CasesBannerUiConcept />
      <PageReviews />
      <ForYouUiConcept />
      <Partners />
      <QualityLandingPageDesign />
      <TeamUiConcept />
      <FaqUiConcept />
      <MatchUiConcept />
      <ServicesScripts />
    </div>
  );
}
