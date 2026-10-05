import type { Metadata } from "next";

import HeroProductDiscovery from "../../sections/services/HeroProductDiscovery";
import ReviewProductDiscovery from "../../sections/services/ReviewProductDiscovery";
import IssuesProductDiscovery from "../../sections/services/IssuesProductDiscovery";
import DiscoverProductDiscovery from "../../sections/services/DiscoverProductDiscovery";
import ProcessProductDiscovery from "../../sections/services/ProcessProductDiscovery";
import AwardsMobileDesign from "../../sections/services/AwardsMobileDesign";
import MvpInvestorsProductDiscovery from "../../sections/services/MvpInvestorsProductDiscovery";
import CasesProductDiscovery from "../../sections/services/CasesProductDiscovery";
import CasesBannerProductDiscovery from "../../sections/services/CasesBannerProductDiscovery";
import PageReviews from "../../sections/services/PageReviews";
import ForYouPitchDeck from "../../sections/services/ForYouPitchDeck";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamProductDiscovery from "../../sections/services/TeamProductDiscovery";
import FaqProductDiscovery from "../../sections/services/FaqProductDiscovery";
import MatchProductDiscovery from "../../sections/services/MatchProductDiscovery";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Product Discovery Services | Abbble Co",
  description: "Product Discovery from Abbble Co Design Agency. Optimize products with our Product discovery services. Streamline innovation, enhance user experiences. Elevate your brand through strategic product discovery",
  alternates: { canonical: "/services/product-discovery" },
  openGraph: {
    title: "Product Discovery Services | Abbble Co",
    description: "Product Discovery from Abbble Co Design Agency. Optimize products with our Product discovery services. Streamline innovation, enhance user experiences. Elevate your brand through strategic product discovery",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/product-discovery`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function ProductDiscoveryPage() {
  return (
    <div className="page-main">
      <HeroProductDiscovery />
      <ReviewProductDiscovery />
      <IssuesProductDiscovery />
      <DiscoverProductDiscovery />
      <ProcessProductDiscovery />
      <AwardsMobileDesign />
      <MvpInvestorsProductDiscovery />
      <CasesProductDiscovery />
      <CasesBannerProductDiscovery />
      <PageReviews />
      <ForYouPitchDeck />
      <Partners />
      <QualityGraphicDesign />
      <TeamProductDiscovery />
      <FaqProductDiscovery />
      <MatchProductDiscovery />
      <ServicesScripts />
    </div>
  );
}
