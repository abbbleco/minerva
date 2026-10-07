import type { Metadata } from "next";

import Footer from "../components/footer";
import Topbar from "../components/topbar";
import TeamClient from "./team-client";

export const metadata: Metadata = { title: "Team | ABBBLE Portal" };
export const dynamic = "force-dynamic";

export default function TeamPage() {
  return (
    <div>
      <Topbar section="Team" />
      <main className="px-5 py-10 md:px-10">
        <div className="max-w-[880px]">
          <h1 className="nous-display text-[34px] leading-[1.05]">Team seats</h1>
          <p className="mt-2 max-w-[560px] text-[13px] leading-6 text-white/70">
            Invite teammates into your agency. They sign up with the invited
            email and land in the team automatically — their devices pick it up
            on next sign-in.
          </p>
          <div className="mt-8">
            <TeamClient />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
