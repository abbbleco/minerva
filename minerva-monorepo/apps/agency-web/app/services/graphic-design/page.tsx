import type { Metadata } from "next";

import HeroGraphicDesign from "../../sections/services/HeroGraphicDesign";
import ReviewGraphicDesign from "../../sections/services/ReviewGraphicDesign";
import DiscoverGraphicDesign from "../../sections/services/DiscoverGraphicDesign";
import ProcessGraphicDesign from "../../sections/services/ProcessGraphicDesign";
import CreateGraphicDesign from "../../sections/services/CreateGraphicDesign";
import AwardsGraphicDesign from "../../sections/services/AwardsGraphicDesign";
import CasesGraphicDesign from "../../sections/services/CasesGraphicDesign";
import CasesBannerGraphicDesign from "../../sections/services/CasesBannerGraphicDesign";
import PageReviews from "../../sections/services/PageReviews";
import ForYouGraphicDesign from "../../sections/services/ForYouGraphicDesign";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamGraphicDesign from "../../sections/services/TeamGraphicDesign";
import DeliverablesGraphicDesign from "../../sections/services/DeliverablesGraphicDesign";
import FaqGraphicDesign from "../../sections/services/FaqGraphicDesign";
import MatchGraphicDesign from "../../sections/services/MatchGraphicDesign";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Graphic Design Services, Hire Professional Graphic Designers | Abbble Co",
  description: "Looking for Graphic Design Services? Abbble Co provides High quality illustrations, Motion graphics and much more! Get more info about Graphic Design on our site",
  alternates: { canonical: "/services/graphic-design" },
  openGraph: {
    title: "Graphic Design Services, Hire Professional Graphic Designers | Abbble Co",
    description: "Looking for Graphic Design Services? Abbble Co provides High quality illustrations, Motion graphics and much more! Get more info about Graphic Design on our site",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/graphic-design`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function GraphicDesignPage() {
  return (
    <div className="page-main">
      <HeroGraphicDesign />
      <ReviewGraphicDesign />
      <DiscoverGraphicDesign />
      <ProcessGraphicDesign />
      <CreateGraphicDesign />
      <AwardsGraphicDesign />
      <CasesGraphicDesign />
      <CasesBannerGraphicDesign />
      <PageReviews />
      <ForYouGraphicDesign />
      <Partners />
      <QualityGraphicDesign />
      <TeamGraphicDesign />
      <DeliverablesGraphicDesign />
      <FaqGraphicDesign />
      <MatchGraphicDesign />
      <ServicesScripts />
    </div>
  );
}
