import type { Metadata } from "next";
import "./globals.css";
import "./css/style.css";
import "./css/core-styles.css";
import "./css/embeds.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CustomCursor from "./components/CustomCursor";

const SITE_URL = "https://abbble.co.za";
const SITE_DESCRIPTION =
  "Full-Stack Digital Production Agency Abbble Co build and transform web and mobile apps, websites through Branding, Web design, UX/UI design, App development for startups and enterprises.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Full-Stack Digital Production Agency - Abbble Co",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: {
    icon: "/img/favicon.png",
    shortcut: "/img/favicon.png",
    apple: "/img/favicon.png",
  },
  openGraph: {
    title: "Full-Stack Digital Production Agency - Abbble Co",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Abbble Co",
    type: "website",
    images: [
      {
        url: "/img/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Full-Stack Digital Production Agency - Abbble Co",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Full-Stack Digital Production Agency - Abbble Co",
    description: SITE_DESCRIPTION,
    images: ["/img/social-preview.png"],
  },
  verification: { google: "TcP4UvG6hVV_RhizJi8lAHQqlHXkaeIH7lRticrFn_c" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Abbble",
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/img/logo.svg`,
  sameAs: [
    "https://www.instagram.com/abbble.co/",
    "https://dribbble.com/abbbleco",
    "https://www.behance.net/abbbleco",
    "https://clutch.co/profile/abbbleco",
    "https://webflow.com/@abbbleco",
    "https://www.linkedin.com/company/abbbleco",
    "https://www.facebook.com/abbble.co",
    "https://twitter.com/abbble_co",
    "https://www.youtube.com/",
  ],
  email: "info@abbble.co.za",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional"
        />
      </head>
      <body className="body_services-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <div className="page-wrapper">
          <CustomCursor />
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}