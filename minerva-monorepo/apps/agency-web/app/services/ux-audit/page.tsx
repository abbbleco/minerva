import type { Metadata } from "next";

import HeroUxAudit from "../../sections/services/HeroUxAudit";
import ReviewUxAudit from "../../sections/services/ReviewUxAudit";
import IssuesUxAudit from "../../sections/services/IssuesUxAudit";
import DiscoverUxAudit from "../../sections/services/DiscoverUxAudit";
import ProcessUxAudit from "../../sections/services/ProcessUxAudit";
import MvpInvestorsUxAudit from "../../sections/services/MvpInvestorsUxAudit";
import CasesUxAudit from "../../sections/services/CasesUxAudit";
import CasesBannerUxAudit from "../../sections/services/CasesBannerUxAudit";
import PageReviews from "../../sections/services/PageReviews";
import AwardsGraphicDesign from "../../sections/services/AwardsGraphicDesign";
import ForYouPitchDeck from "../../sections/services/ForYouPitchDeck";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamPitchDeck from "../../sections/services/TeamPitchDeck";
import FaqUxAudit from "../../sections/services/FaqUxAudit";
import PageContactUxAudit from "../../sections/services/PageContactUxAudit";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "UX Audit Services | Abbble Co Agency",
  description: "UX Audit is a valuable instrument that defines how to make your product more competitive and helps to achieve business goals. Get more info about User Experience Audit on our site",
  alternates: { canonical: "/services/ux-audit" },
  openGraph: {
    title: "UX Audit Services | Abbble Co Agency",
    description: "UX Audit is a valuable instrument that defines how to make your product more competitive and helps to achieve business goals. Get more info about User Experience Audit on our site",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/ux-audit`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function UxAuditPage() {
  return (
    <div className="page-main">
      <HeroUxAudit />
      <ReviewUxAudit />
      <IssuesUxAudit />
      <DiscoverUxAudit />
      <ProcessUxAudit />
      <MvpInvestorsUxAudit />
      <CasesUxAudit />
      <CasesBannerUxAudit />
      <PageReviews />
      <AwardsGraphicDesign />
      <ForYouPitchDeck />
      <Partners />
      <QualityGraphicDesign />
      <TeamPitchDeck />
      <FaqUxAudit />
      <PageContactUxAudit />
      <ServicesScripts />
    </div>
  );
}
