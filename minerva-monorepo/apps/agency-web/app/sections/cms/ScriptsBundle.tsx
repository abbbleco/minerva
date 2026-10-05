import AboutScripts from "@/app/components/AboutScripts";
import ContactScripts from "@/app/components/ContactScripts";
import CoreScripts from "@/app/components/HomeCoreScripts";
import HomeScripts from "@/app/components/HomeScripts";
import {
  BlogScripts,
  ResourcesScripts,
  WorksScripts,
} from "@/app/components/ContentScripts";
import { IndustriesScripts } from "@/app/components/IndustriesScripts";
import { PolicyScripts } from "@/app/components/PolicyScripts";
import { ServicesScripts } from "@/app/components/ServicesScripts";
import { SolutionsScripts } from "@/app/components/SolutionsScripts";
import type { ScriptsBundleId } from "@/lib/cms/page-groups";

const BUNDLES: Record<ScriptsBundleId, () => React.ReactNode> = {
  HomeScripts: () => <HomeScripts />,
  AboutScripts: () => <AboutScripts />,
  ContactScripts: () => <ContactScripts />,
  ServicesScripts: () => <ServicesScripts />,
  IndustriesScripts: () => <IndustriesScripts />,
  SolutionsScripts: () => <SolutionsScripts />,
  WorksScripts: () => <WorksScripts />,
  ResourcesScripts: () => <ResourcesScripts />,
  BlogScripts: () => <BlogScripts />,
  PolicyScripts: () => <PolicyScripts />,
  CoreScripts: () => <CoreScripts />,
};

/** Attaches the page-group's Webflow runtime scripts after rendered sections. */
export default function ScriptsBundle({ id }: { id: ScriptsBundleId }) {
  return BUNDLES[id]();
}
