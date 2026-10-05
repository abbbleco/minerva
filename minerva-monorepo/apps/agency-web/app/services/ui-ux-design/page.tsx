import type { Metadata } from "next";

import HeroUiUxDesign from "../../sections/services/HeroUiUxDesign";
import ReviewUiUxDesign from "../../sections/services/ReviewUiUxDesign";
import DiscoverUiUxDesign from "../../sections/services/DiscoverUiUxDesign";
import ProcessUiUxDesign from "../../sections/services/ProcessUiUxDesign";
import AwardsMobileDesign from "../../sections/services/AwardsMobileDesign";
import MvpInvestorsUiUxDesign from "../../sections/services/MvpInvestorsUiUxDesign";
import CasesUiUxDesign from "../../sections/services/CasesUiUxDesign";
import CasesBannerUiUxDesign from "../../sections/services/CasesBannerUiUxDesign";
import PageReviews from "../../sections/services/PageReviews";
import ForYouUiUxDesign from "../../sections/services/ForYouUiUxDesign";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamPitchDeck from "../../sections/services/TeamPitchDeck";
import FaqUiUxDesign from "../../sections/services/FaqUiUxDesign";
import MatchUiUxDesign from "../../sections/services/MatchUiUxDesign";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "UI/UX Design Services, User Experience Design Agency | Abbble Co",
  description: "UI/UX Design Services Company Abbble Co provides best UI/UX Design products. Create new UI &amp; UX design services or improve existing products with Abbble Co.",
  alternates: { canonical: "/services/ui-ux-design" },
  openGraph: {
    title: "UI/UX Design Services, User Experience Design Agency | Abbble Co",
    description: "UI/UX Design Services Company Abbble Co provides best UI/UX Design products. Create new UI &amp; UX design services or improve existing products with Abbble Co.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/ui-ux-design`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function UiUxDesignPage() {
  return (
    <div className="page-main">
      <HeroUiUxDesign />
      <ReviewUiUxDesign />
      <DiscoverUiUxDesign />
      <ProcessUiUxDesign />
      <AwardsMobileDesign />
      <MvpInvestorsUiUxDesign />
      <CasesUiUxDesign />
      <CasesBannerUiUxDesign />
      <PageReviews />
      <ForYouUiUxDesign />
      <Partners />
      <QualityGraphicDesign />
      <TeamPitchDeck />
      <FaqUiUxDesign />
      <MatchUiUxDesign />
      <ServicesScripts />
    </div>
  );
}
