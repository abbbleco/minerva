import type { Metadata } from "next";

import HeroProofOfConcept from "../../sections/services/HeroProofOfConcept";
import ReviewProofOfConcept from "../../sections/services/ReviewProofOfConcept";
import IssuesProofOfConcept from "../../sections/services/IssuesProofOfConcept";
import DiscoverProofOfConcept from "../../sections/services/DiscoverProofOfConcept";
import ProcessProofOfConcept from "../../sections/services/ProcessProofOfConcept";
import AwardsGraphicDesign from "../../sections/services/AwardsGraphicDesign";
import MvpInvestorsProofOfConcept from "../../sections/services/MvpInvestorsProofOfConcept";
import CasesProofOfConcept from "../../sections/services/CasesProofOfConcept";
import CasesBannerProofOfConcept from "../../sections/services/CasesBannerProofOfConcept";
import PageReviews from "../../sections/services/PageReviews";
import ForYouProofOfConcept from "../../sections/services/ForYouProofOfConcept";
import Partners from "../../sections/services/Partners";
import QualityGraphicDesign from "../../sections/services/QualityGraphicDesign";
import TeamProofOfConcept from "../../sections/services/TeamProofOfConcept";
import FaqProofOfConcept from "../../sections/services/FaqProofOfConcept";
import MatchProofOfConcept from "../../sections/services/MatchProofOfConcept";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Proof of Concept (PoC) Services | Abbble Co",
  description: "Our agency provides Proof of Concept (PoC) Services and creates every tech solution and innovate projects",
  alternates: { canonical: "/services/proof-of-concept" },
  openGraph: {
    title: "Proof of Concept (PoC) Services | Abbble Co",
    description: "Our agency provides Proof of Concept (PoC) Services and creates every tech solution and innovate projects",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/proof-of-concept`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function ProofOfConceptPage() {
  return (
    <div className="page-main">
      <HeroProofOfConcept />
      <ReviewProofOfConcept />
      <IssuesProofOfConcept />
      <DiscoverProofOfConcept />
      <ProcessProofOfConcept />
      <AwardsGraphicDesign />
      <MvpInvestorsProofOfConcept />
      <CasesProofOfConcept />
      <CasesBannerProofOfConcept />
      <PageReviews />
      <ForYouProofOfConcept />
      <Partners />
      <QualityGraphicDesign />
      <TeamProofOfConcept />
      <FaqProofOfConcept />
      <MatchProofOfConcept />
      <ServicesScripts />
    </div>
  );
}
