import type { Metadata } from "next";

import HeroAi from "../../sections/industries/HeroAi";
import Review from "../../sections/industries/Review";
import IndustriesCasesAi from "../../sections/industries/IndustriesCasesAi";
import CasesBannerAi from "../../sections/industries/CasesBannerAi";
import IPrinciplesAi from "../../sections/industries/IPrinciplesAi";
import IXpAi from "../../sections/industries/IXpAi";
import IProductAi from "../../sections/industries/IProductAi";
import IApproachAi from "../../sections/industries/IApproachAi";
import Partners from "../../sections/industries/Partners";
import Quality from "../../sections/industries/Quality";
import PageReviews from "../../sections/industries/PageReviews";
import IndustryNichesAi from "../../sections/industries/IndustryNichesAi";
import FaqAi from "../../sections/industries/FaqAi";
import Match from "../../sections/industries/Match";
import { IndustriesScripts } from "../../components/IndustriesScripts";

export const metadata: Metadata = {
  title: "AI Design Services | Abbble Co",
  description: "Unleash the potential of AI with our exceptional design services. Elevate user experiences, optimize interfaces, and lead in the world of artificial intelligence. Transform your AI projects with our cutting-edge design solutions!\"",
  alternates: { canonical: "/industries/ai" },
  openGraph: {
    title: "AI Design Services | Abbble Co",
    description: "Unleash the potential of AI with our exceptional design services. Elevate user experiences, optimize interfaces, and lead in the world of artificial intelligence. Transform your AI projects with our cutting-edge design solutions!\"",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/industries/ai`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function AiPage() {
  return (
    <div className="page-main">
      <HeroAi />
      <Review />
      <IndustriesCasesAi />
      <CasesBannerAi />
      <IPrinciplesAi />
      <IXpAi />
      <IProductAi />
      <IApproachAi />
      <Partners />
      <Quality />
      <PageReviews />
      <IndustryNichesAi />
      <FaqAi />
      <Match />
      <IndustriesScripts />
    </div>
  );
}
