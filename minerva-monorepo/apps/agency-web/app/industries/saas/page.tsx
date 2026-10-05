import type { Metadata } from "next";

import HeroSaas from "../../sections/industries/HeroSaas";
import ReviewSaas from "../../sections/industries/ReviewSaas";
import IndustriesCasesSaas from "../../sections/industries/IndustriesCasesSaas";
import CasesBannerSaas from "../../sections/industries/CasesBannerSaas";
import IPrinciplesSaas from "../../sections/industries/IPrinciplesSaas";
import IXpSaas from "../../sections/industries/IXpSaas";
import ForYouSaas from "../../sections/industries/ForYouSaas";
import IApproachSaas from "../../sections/industries/IApproachSaas";
import PartnersSaas from "../../sections/industries/PartnersSaas";
import QualitySaas from "../../sections/industries/QualitySaas";
import PageReviewsSaas from "../../sections/industries/PageReviewsSaas";
import IndustryNichesSaas from "../../sections/industries/IndustryNichesSaas";
import FaqSaas from "../../sections/industries/FaqSaas";
import MatchSaas from "../../sections/industries/MatchSaas";
import { IndustriesScripts } from "../../components/IndustriesScripts";

export const metadata: Metadata = {
  title: "SaaS Design Agency, SaaS Designers for Hire | Abbble Co",
  description: "Upgrade your SaaS platform with our expert design services. Elevate user experiences, boost engagement, and stay ahead in the digital realm. Transform your software with our cutting-edge design solutions!",
  alternates: { canonical: "/industries/saas" },
  openGraph: {
    title: "SaaS Design Agency, SaaS Designers for Hire | Abbble Co",
    description: "Upgrade your SaaS platform with our expert design services. Elevate user experiences, boost engagement, and stay ahead in the digital realm. Transform your software with our cutting-edge design solutions!",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/industries/saas`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function SaasPage() {
  return (
    <div className="page-main">
      <HeroSaas />
      <ReviewSaas />
      <IndustriesCasesSaas />
      <CasesBannerSaas />
      <IPrinciplesSaas />
      <IXpSaas />
      <ForYouSaas />
      <IApproachSaas />
      <PartnersSaas />
      <QualitySaas />
      <PageReviewsSaas />
      <IndustryNichesSaas />
      <FaqSaas />
      <MatchSaas />
      <IndustriesScripts />
    </div>
  );
}
