import type { Metadata } from "next";

import HeroWeb3 from "../../sections/industries/HeroWeb3";
import Review from "../../sections/industries/Review";
import IndustriesCasesWeb3 from "../../sections/industries/IndustriesCasesWeb3";
import CasesBannerWeb3 from "../../sections/industries/CasesBannerWeb3";
import IPrinciplesWeb3 from "../../sections/industries/IPrinciplesWeb3";
import IXpWeb3 from "../../sections/industries/IXpWeb3";
import IProductWeb3 from "../../sections/industries/IProductWeb3";
import IApproachWeb3 from "../../sections/industries/IApproachWeb3";
import Partners from "../../sections/industries/Partners";
import Quality from "../../sections/industries/Quality";
import PageReviews from "../../sections/industries/PageReviews";
import IndustryNichesWeb3 from "../../sections/industries/IndustryNichesWeb3";
import FaqWeb3 from "../../sections/industries/FaqWeb3";
import Match from "../../sections/industries/Match";
import { IndustriesScripts } from "../../components/IndustriesScripts";

export const metadata: Metadata = {
  title: "Web 3.0 & Crypto Design Services | Abbble Co",
  description: "Shape the future of the web with our Web 3.0 design services. Elevate user experiences, embrace decentralization, and stay ahead in the evolving digital landscape. Transform your projects with cutting-edge design solutions for the next generation of the internet.",
  alternates: { canonical: "/industries/web3" },
  openGraph: {
    title: "Web 3.0 & Crypto Design Services | Abbble Co",
    description: "Shape the future of the web with our Web 3.0 design services. Elevate user experiences, embrace decentralization, and stay ahead in the evolving digital landscape. Transform your projects with cutting-edge design solutions for the next generation of the internet.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/industries/web3`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function Web3Page() {
  return (
    <div className="page-main">
      <HeroWeb3 />
      <Review />
      <IndustriesCasesWeb3 />
      <CasesBannerWeb3 />
      <IPrinciplesWeb3 />
      <IXpWeb3 />
      <IProductWeb3 />
      <IApproachWeb3 />
      <Partners />
      <Quality />
      <PageReviews />
      <IndustryNichesWeb3 />
      <FaqWeb3 />
      <Match />
      <IndustriesScripts />
    </div>
  );
}
