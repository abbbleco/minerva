import type { ReactNode } from "react";
import "./apis-mechanica.css";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
