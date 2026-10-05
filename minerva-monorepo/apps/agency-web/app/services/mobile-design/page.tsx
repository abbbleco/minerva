import type { Metadata } from "next";

import HeroMobileDesign from "../../sections/services/HeroMobileDesign";
import ReviewMobileDesign from "../../sections/services/ReviewMobileDesign";
import DiscoverMobileDesign from "../../sections/services/DiscoverMobileDesign";
import ProcessMobileDesign from "../../sections/services/ProcessMobileDesign";
import AwardsMobileDesign from "../../sections/services/AwardsMobileDesign";
import MvpInvestorsMobileDesign from "../../sections/services/MvpInvestorsMobileDesign";
import CasesMobileDesign from "../../sections/services/CasesMobileDesign";
import CasesBannerMobileDesign from "../../sections/services/CasesBannerMobileDesign";
import PageReviews from "../../sections/services/PageReviews";
import ForYouMobileDesign from "../../sections/services/ForYouMobileDesign";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamMobileDesign from "../../sections/services/TeamMobileDesign";
import FaqMobileDesign from "../../sections/services/FaqMobileDesign";
import MatchMobileDesign from "../../sections/services/MatchMobileDesign";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Mobile App Design Services | Abbble Co",
  description: "Mobile App Design Services from Abbble Co Design Agency. Try a new custom Mobile App Design from our spesialists.",
  alternates: { canonical: "/services/mobile-design" },
  openGraph: {
    title: "Mobile App Design Services | Abbble Co",
    description: "Mobile App Design Services from Abbble Co Design Agency. Try a new custom Mobile App Design from our spesialists.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/mobile-design`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function MobileDesignPage() {
  return (
    <div className="page-main">
      <HeroMobileDesign />
      <ReviewMobileDesign />
      <DiscoverMobileDesign />
      <ProcessMobileDesign />
      <AwardsMobileDesign />
      <MvpInvestorsMobileDesign />
      <CasesMobileDesign />
      <CasesBannerMobileDesign />
      <PageReviews />
      <ForYouMobileDesign />
      <Partners />
      <QualityGraphicDesign />
      <TeamMobileDesign />
      <FaqMobileDesign />
      <MatchMobileDesign />
      <ServicesScripts />
    </div>
  );
}
