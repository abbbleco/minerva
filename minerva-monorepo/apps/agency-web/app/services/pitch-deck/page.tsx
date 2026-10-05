import type { Metadata } from "next";

import HeroPitchDeck from "../../sections/services/HeroPitchDeck";
import ReviewPitchDeck from "../../sections/services/ReviewPitchDeck";
import DiscoverPitchDeck from "../../sections/services/DiscoverPitchDeck";
import ProcessPitchDeck from "../../sections/services/ProcessPitchDeck";
import AwardsMobileDesign from "../../sections/services/AwardsMobileDesign";
import MvpInvestorsPitchDeck from "../../sections/services/MvpInvestorsPitchDeck";
import CasesPitchDeck from "../../sections/services/CasesPitchDeck";
import CasesBannerPitchDeck from "../../sections/services/CasesBannerPitchDeck";
import PageReviews from "../../sections/services/PageReviews";
import ForYouPitchDeck from "../../sections/services/ForYouPitchDeck";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamPitchDeck from "../../sections/services/TeamPitchDeck";
import FaqPitchDeck from "../../sections/services/FaqPitchDeck";
import MatchPitchDeck from "../../sections/services/MatchPitchDeck";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Pitch Deck Design Agency | Abbble Co",
  description: "Elevate pitches with our expert pitch deck design. Captivate investors with visually impactful presentations. Boost your business impact",
  alternates: { canonical: "/services/pitch-deck" },
  openGraph: {
    title: "Pitch Deck Design Agency | Abbble Co",
    description: "Elevate pitches with our expert pitch deck design. Captivate investors with visually impactful presentations. Boost your business impact",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/pitch-deck`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function PitchDeckPage() {
  return (
    <div className="page-main">
      <HeroPitchDeck />
      <ReviewPitchDeck />
      <DiscoverPitchDeck />
      <ProcessPitchDeck />
      <AwardsMobileDesign />
      <MvpInvestorsPitchDeck />
      <CasesPitchDeck />
      <CasesBannerPitchDeck />
      <PageReviews />
      <ForYouPitchDeck />
      <Partners />
      <QualityGraphicDesign />
      <TeamPitchDeck />
      <FaqPitchDeck />
      <MatchPitchDeck />
      <ServicesScripts />
    </div>
  );
}
