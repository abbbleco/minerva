import type { Metadata } from "next";

import EmailCourses from "../sections/resources/EmailCourses";
import { ResourcesScripts } from "../components/ContentScripts";

export const metadata: Metadata = {
  title: "E-mail Courses | Abbble Co",
  description:
    "Free 7-day email courses from Abbble Co: design an MVP, launch a successful product redesign, collaborate with remote designers and more.",
  alternates: { canonical: "/resources-courses" },
  openGraph: {
    title: "E-mail Courses | Abbble Co",
    description:
      "Free 7-day email courses from Abbble Co: design an MVP, launch a successful product redesign, collaborate with remote designers and more.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://abbble.co.za"}/resources-courses`,
    siteName: "Abbble Co",
    type: "website",
  },
};

export default function ResourcesCoursesPage() {
  return (
    <div className="page-main">
      <EmailCourses />
      <ResourcesScripts />
    </div>
  );
}