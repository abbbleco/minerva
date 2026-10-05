import type { Metadata } from "next";

import HeroBrandIdentity from "../../sections/services/HeroBrandIdentity";
import ReviewBrandIdentity from "../../sections/services/ReviewBrandIdentity";
import DiscoverBrandIdentity from "../../sections/services/DiscoverBrandIdentity";
import ProcessBrandIdentity from "../../sections/services/ProcessBrandIdentity";
import CreateBrandIdentity from "../../sections/services/CreateBrandIdentity";
import AwardsBrandIdentity from "../../sections/services/AwardsBrandIdentity";
import MvpInvestorsBrandIdentity from "../../sections/services/MvpInvestorsBrandIdentity";
import CasesBrandIdentity from "../../sections/services/CasesBrandIdentity";
import CasesBannerBrandIdentity from "../../sections/services/CasesBannerBrandIdentity";
import PageReviews from "../../sections/services/PageReviews";
import ForYouBrandIdentity from "../../sections/services/ForYouBrandIdentity";
import Partners from "../../sections/services/Partners";
import QualityBrandIdentity from "../../sections/services/QualityBrandIdentity";
import TeamBrandIdentity from "../../sections/services/TeamBrandIdentity";
import FaqBrandIdentity from "../../sections/services/FaqBrandIdentity";
import MatchBrandIdentity from "../../sections/services/MatchBrandIdentity";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Brand Identity Design Services, Brand Identity Agency | Abbble Co",
  description: "Brand Identity Agency Abbble Co helps companies develop a unique and recognizable brand identity and branding design",
  alternates: { canonical: "/services/brand-identity" },
  openGraph: {
    title: "Brand Identity Design Services, Brand Identity Agency | Abbble Co",
    description: "Brand Identity Agency Abbble Co helps companies develop a unique and recognizable brand identity and branding design",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/brand-identity`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function BrandIdentityPage() {
  return (
    <div className="page-main">
      <HeroBrandIdentity />
      <ReviewBrandIdentity />
      <DiscoverBrandIdentity />
      <ProcessBrandIdentity />
      <CreateBrandIdentity />
      <AwardsBrandIdentity />
      <MvpInvestorsBrandIdentity />
      <CasesBrandIdentity />
      <CasesBannerBrandIdentity />
      <PageReviews />
      <ForYouBrandIdentity />
      <Partners />
      <QualityBrandIdentity />
      <TeamBrandIdentity />
      <FaqBrandIdentity />
      <MatchBrandIdentity />
      <ServicesScripts />
    </div>
  );
}
