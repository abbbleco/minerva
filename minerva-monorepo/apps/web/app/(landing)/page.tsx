import type { Metadata, Viewport } from "next";
import { ApisMechanica } from "@/components/landing/ApisMechanica";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport: Viewport = {
  themeColor: "#234d8d",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Minerva OS — Agent-Orchestrated, Human-Verified Delivery",
  description:
    "Minerva OS: agent-orchestrated, human-verified product delivery. An interactive mechanical study.",
  openGraph: {
    title: "Minerva OS",
    description: "Agent-orchestrated, human-verified product delivery.",
    images: ["/img/landing/og.png"],
  },
};

export default function LandingPage() {
  return <ApisMechanica />;
}
