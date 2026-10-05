import type { Metadata } from "next";

import WorksHero from "../sections/works/WorksHero";
import WorksFeed from "../sections/works/WorksFeed";
import Awards from "../sections/common/Awards";
import WorksTrending from "../sections/works/WorksTrending";
import Reviews from "../sections/common/Reviews";
import Match from "../sections/works/Match";
import { WorksScripts } from "../components/ContentScripts";

export const metadata: Metadata = {
  title:
    "Our works — Web & Mobile Apps, Marketing websites, Landing pages, Two-sided platforms we've made | Abbble Co",
  description:
    "Explore Abbble Co's portfolio: web and mobile apps, marketing websites, landing pages, and two-sided platforms we've designed and delivered.",
  alternates: { canonical: "/works" },
  openGraph: {
    title:
      "Our works — Web & Mobile Apps, Marketing websites, Landing pages, Two-sided platforms we've made | Abbble Co",
    description:
      "Explore Abbble Co's portfolio: web and mobile apps, marketing websites, landing pages, and two-sided platforms we've designed and delivered.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/works`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function WorksPage() {
  return (
    <div className="page-main">
      <WorksHero />
      <WorksFeed />
      <Awards />
      <WorksTrending />
      <Reviews />
      <Match />
      <WorksScripts />
    </div>
  );
}