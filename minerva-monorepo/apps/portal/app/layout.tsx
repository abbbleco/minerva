import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AccountButton from "./components/account-button";
import Sidebar from "./components/sidebar";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ABBBLE Portal — Everything to Power Minerva Agent",
  description:
    "ABBBLE Portal is the one account that fuels Minerva Agent: the models, the tools, the cloud. Sign in once and never think about it again.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="nous-canvas min-h-full">
        <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <nav
              aria-label="Primary"
              className="flex items-center gap-4 overflow-x-auto border-b border-white/10 px-5 py-3 text-[12px] font-semibold tracking-wide uppercase md:hidden"
            >
              <a href="/" className="text-white">ABBBLE Portal</a>
              <a href="/models" className="text-white/60">Models</a>
              <a href="/plans" className="text-white/60">Plans</a>
              <a href="/team" className="text-white/60">Team</a>
              <a href="/minerva" className="text-white/60">Minerva</a>
              <a href="/download" className="text-white/60">Download</a>
              <AccountButton variant="nav" />
            </nav>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
