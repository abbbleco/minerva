import type { Metadata } from "next";

import HeroMvp from "../../sections/solutions/HeroMvp";
import ReviewMvp from "../../sections/solutions/ReviewMvp";
import ValueMvp from "../../sections/solutions/ValueMvp";
import InvestorsMvp from "../../sections/solutions/InvestorsMvp";
import CasesMvp from "../../sections/solutions/CasesMvp";
import CasesBannerMvp from "../../sections/solutions/CasesBannerMvp";
import StartupsMvp from "../../sections/solutions/StartupsMvp";
import Pros from "../../sections/solutions/Pros";
import ExpertiseMvp from "../../sections/solutions/ExpertiseMvp";
import DeliverablesMvp from "../../sections/solutions/DeliverablesMvp";
import CasesBannerMvp2 from "../../sections/solutions/CasesBannerMvp2";
import ProcessMvp from "../../sections/solutions/ProcessMvp";
import ReviewMvp2 from "../../sections/solutions/ReviewMvp2";
import CompaniesMvp from "../../sections/solutions/CompaniesMvp";
import CasesBannerMvp3 from "../../sections/solutions/CasesBannerMvp3";
import FaqMvp from "../../sections/solutions/FaqMvp";
import ForYouMvp from "../../sections/solutions/ForYouMvp";
import ContactMvp from "../../sections/solutions/ContactMvp";
import { SolutionsScripts } from "../../components/SolutionsScripts";

export const metadata: Metadata = {
  title: "Hire MVP Designers, MVP Product Design Agency",
  description: "Minimum Viable Product (MVP) Design & Development services provided by Abbble Co offer the best quality by experienced MVP designers",
  alternates: { canonical: "/solutions/mvp" },
  openGraph: {
    title: "Hire MVP Designers, MVP Product Design Agency",
    description: "Minimum Viable Product (MVP) Design & Development services provided by Abbble Co offer the best quality by experienced MVP designers",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/solutions/mvp`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function MvpPage() {
  return (
    <div className="page-main">
      <HeroMvp />
      <ReviewMvp />
      <ValueMvp />
      <InvestorsMvp />
      <CasesMvp />
      <CasesBannerMvp />
      <StartupsMvp />
      <Pros />
      <ExpertiseMvp />
      <DeliverablesMvp />
      <CasesBannerMvp2 />
      <ProcessMvp />
      <ReviewMvp2 />
      <CompaniesMvp />
      <CasesBannerMvp3 />
      <FaqMvp />
      <ForYouMvp />
      <ContactMvp />
      <SolutionsScripts />
    </div>
  );
}
