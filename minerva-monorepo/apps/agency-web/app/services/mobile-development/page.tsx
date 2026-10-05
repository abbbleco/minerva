import type { Metadata } from "next";

import DevHeroMobileDevelopment from "../../sections/services/DevHeroMobileDevelopment";
import DevPrinciplesMobileDevelopment from "../../sections/services/DevPrinciplesMobileDevelopment";
import DevProcessMobileDevelopment from "../../sections/services/DevProcessMobileDevelopment";
import DevBenefits from "../../sections/services/DevBenefits";
import DevTestimonials from "../../sections/services/DevTestimonials";
import ExpertiseMobileDevelopment from "../../sections/services/ExpertiseMobileDevelopment";
import DevToolsMobileDevelopment from "../../sections/services/DevToolsMobileDevelopment";
import DevCasesMobileDevelopment from "../../sections/services/DevCasesMobileDevelopment";
import DevCtaMobileDevelopment from "../../sections/services/DevCtaMobileDevelopment";
import { ServicesScripts } from "../../components/ServicesScripts";

export const metadata: Metadata = {
  title: "Mobile App Development Services | Abbble Co",
  description: "Looking for Mobile Development Services? Abbble Co provides Custom iOS and Android apps development",
  alternates: { canonical: "/services/mobile-development" },
  openGraph: {
    title: "Mobile App Development Services | Abbble Co",
    description: "Looking for Mobile Development Services? Abbble Co provides Custom iOS and Android apps development",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/services/mobile-development`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function MobileDevelopmentPage() {
  return (
    <div className="page-main">
      <DevHeroMobileDevelopment />
      <DevPrinciplesMobileDevelopment />
      <DevProcessMobileDevelopment />
      <DevBenefits />
      <DevTestimonials />
      <ExpertiseMobileDevelopment />
      <DevToolsMobileDevelopment />
      <DevCasesMobileDevelopment />
      <DevCtaMobileDevelopment />
      <ServicesScripts />
    </div>
  );
}
