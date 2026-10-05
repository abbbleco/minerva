import type { Metadata } from "next";

import DevHeroWebDevelopment from "../../sections/services/DevHeroWebDevelopment";
import DevPrinciplesWebDevelopment from "../../sections/services/DevPrinciplesWebDevelopment";
import DevProcessWebDevelopment from "../../sections/services/DevProcessWebDevelopment";
import DevBenefits from "../../sections/services/DevBenefits";
import DevTestimonials from "../../sections/services/DevTestimonials";
import ExpertiseWebDevelopment from "../../sections/services/ExpertiseWebDevelopment";
import DevToolsWebDevelopment from "../../sections/services/DevToolsWebDevelopment";
import DevCasesWebDevelopment from "../../sections/services/DevCasesWebDevelopment";
import DevCtaWebDevelopment from "../../sections/services/DevCtaWebDevelopment";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Custom Web Development Services | Abbble Co",
  description: "Web Development Services at Abbble Co Agency it's Responsive web development services &amp; Experienced team of dedicated developers",
  alternates: { canonical: "/services/web-development" },
  openGraph: {
    title: "Custom Web Development Services | Abbble Co",
    description: "Web Development Services at Abbble Co Agency it's Responsive web development services &amp; Experienced team of dedicated developers",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/web-development`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function WebDevelopmentPage() {
  return (
    <div className="page-main">
      <DevHeroWebDevelopment />
      <DevPrinciplesWebDevelopment />
      <DevProcessWebDevelopment />
      <DevBenefits />
      <DevTestimonials />
      <ExpertiseWebDevelopment />
      <DevToolsWebDevelopment />
      <DevCasesWebDevelopment />
      <DevCtaWebDevelopment />
      <ServicesScripts />
    </div>
  );
}
