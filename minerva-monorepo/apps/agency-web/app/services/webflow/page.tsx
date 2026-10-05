import type { Metadata } from "next";

import HeroWebflow from "../../sections/services/HeroWebflow";
import ReviewWebflow from "../../sections/services/ReviewWebflow";
import IPrinciplesWebflow from "../../sections/services/IPrinciplesWebflow";
import ProcessWebflow from "../../sections/services/ProcessWebflow";
import ExpertiseWebflow from "../../sections/services/ExpertiseWebflow";
import PageToolsWebflow from "../../sections/services/PageToolsWebflow";
import AwardsMobileDesign from "../../sections/services/AwardsMobileDesign";
import CasesWebflow from "../../sections/services/CasesWebflow";
import CasesBannerWebflow from "../../sections/services/CasesBannerWebflow";
import PageReviews from "../../sections/services/PageReviews";
import ForYouWebflow from "../../sections/services/ForYouWebflow";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamWebflow from "../../sections/services/TeamWebflow";
import FaqWebflow from "../../sections/services/FaqWebflow";
import MatchWebflow from "../../sections/services/MatchWebflow";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Webflow Development Company | Abbble Co",
  description: "Webflow development services. From responsive design to seamless integrations, unlock the power of Webflow front end development for stunning websites that captivate and convert.",
  alternates: { canonical: "/services/webflow" },
  openGraph: {
    title: "Webflow Development Company | Abbble Co",
    description: "Webflow development services. From responsive design to seamless integrations, unlock the power of Webflow front end development for stunning websites that captivate and convert.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/webflow`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function WebflowPage() {
  return (
    <div className="page-main">
      <HeroWebflow />
      <ReviewWebflow />
      <IPrinciplesWebflow />
      <ProcessWebflow />
      <ExpertiseWebflow />
      <PageToolsWebflow />
      <AwardsMobileDesign />
      <CasesWebflow />
      <CasesBannerWebflow />
      <PageReviews />
      <ForYouWebflow />
      <Partners />
      <QualityGraphicDesign />
      <TeamWebflow />
      <FaqWebflow />
      <MatchWebflow />
      <ServicesScripts />
    </div>
  );
}
