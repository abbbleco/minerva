import type { Metadata } from "next";

import Hero from "../sections/about/Hero";
import Team from "../sections/about/Team";
import Market from "../sections/about/Market";
import Dna from "../sections/about/Dna";
import Values from "../sections/about/Values";
import Quality from "../sections/about/Quality";
import Awards from "../sections/common/Awards";
import Location from "../sections/common/Location";
import IndustryNiches from "../sections/common/IndustryNiches";
import Reviews from "../sections/common/Reviews";
import ContactCta from "../sections/about/ContactCta";
import AboutScripts from "../components/AboutScripts";

export const metadata: Metadata = {
  title: "About Us - Experienced Product Design Team | Abbble Co",
  description:
    "Abbble Co is a team of multidisciplinary digital product experts consisting of experienced product managers, designers, developers, and buisiness analysts.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Us - Experienced Product Design Team | Abbble Co",
    description:
      "Abbble Co is a team of multidisciplinary digital product experts consisting of experienced product managers, designers, developers, and buisiness analysts.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/about`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="page-main">
      <Hero />
      <Team />
      <Market />
      <Dna />
      <Values />
      <Quality />
      <Awards />
      <Location />
      <IndustryNiches />
      <Reviews />
      <ContactCta />
      <AboutScripts />
    </div>
  );
}
