import type { Metadata } from "next";

import HeroWebDesign from "../../sections/services/HeroWebDesign";
import ReviewWebDesign from "../../sections/services/ReviewWebDesign";
import DiscoverWebDesign from "../../sections/services/DiscoverWebDesign";
import ProcessWebDesign from "../../sections/services/ProcessWebDesign";
import CreateWebDesign from "../../sections/services/CreateWebDesign";
import AwardsMobileDesign from "../../sections/services/AwardsMobileDesign";
import MvpInvestorsWebDesign from "../../sections/services/MvpInvestorsWebDesign";
import CasesWebDesign from "../../sections/services/CasesWebDesign";
import CasesBannerWebDesign from "../../sections/services/CasesBannerWebDesign";
import PageReviews from "../../sections/services/PageReviews";
import ForYouWebDesign from "../../sections/services/ForYouWebDesign";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamWebDesign from "../../sections/services/TeamWebDesign";
import FaqWebDesign from "../../sections/services/FaqWebDesign";
import MatchWebDesign from "../../sections/services/MatchWebDesign";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Web Design Agency, Hire Professional Web Designers | Abbble Co",
  description: "Searching for a Web Design Agency? Abbble Co provides professional Web Design services to help your business attract more visitors and keep them on your site!",
  alternates: { canonical: "/services/web-design" },
  openGraph: {
    title: "Web Design Agency, Hire Professional Web Designers | Abbble Co",
    description: "Searching for a Web Design Agency? Abbble Co provides professional Web Design services to help your business attract more visitors and keep them on your site!",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/web-design`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function WebDesignPage() {
  return (
    <div className="page-main">
      <HeroWebDesign />
      <ReviewWebDesign />
      <DiscoverWebDesign />
      <ProcessWebDesign />
      <CreateWebDesign />
      <AwardsMobileDesign />
      <MvpInvestorsWebDesign />
      <CasesWebDesign />
      <CasesBannerWebDesign />
      <PageReviews />
      <ForYouWebDesign />
      <Partners />
      <QualityGraphicDesign />
      <TeamWebDesign />
      <FaqWebDesign />
      <MatchWebDesign />
      <ServicesScripts />
    </div>
  );
}
