import type { Metadata } from "next";

import ContactHero from "../sections/contact/ContactHero";
import Awards from "../sections/common/Awards";
import Process from "../sections/contact/Process";
import Reviews from "../sections/contact/Reviews";
import Location from "../sections/common/Location";
import Team from "../sections/contact/Team";
import Faq from "../sections/common/Faq";
import Match from "../sections/contact/Match";
import ContactScripts from "../components/ContactScripts";

export const metadata: Metadata = {
  title: "Contact Us - Questions and Project Inquiries to Dedicated Design & Development team | Abbble Co",
  description:
    "Got a project? Our team will carefully study your task and suggest the best solution for your business. Tell us more about your idea: info@abbble.co.za",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Us - Questions and Project Inquiries to Dedicated Design & Development team | Abbble Co",
    description:
      "Got a project? Our team will carefully study your task and suggest the best solution for your business. Tell us more about your idea: info@abbble.co.za",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/contact`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="page-main">
      <ContactHero />
      <Awards />
      <Process />
      <Reviews />
      <Location />
      <Team />
      <Faq />
      <Match />
      <ContactScripts />
    </div>
  );
}