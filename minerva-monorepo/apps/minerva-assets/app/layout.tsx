import type { Metadata } from "next";

export const metadata: Metadata = { title: "Minerva Assets" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a2b",
          color: "#e8e8f0",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          margin: 0,
          padding: "3rem 1.5rem",
          lineHeight: 1.6,
        }}
      >
        {children}
      </body>
    </html>
  );
}
