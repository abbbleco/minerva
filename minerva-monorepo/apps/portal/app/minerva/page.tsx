import type { Metadata } from "next";
import Topbar from "../components/topbar";
import Footer from "../components/footer";
import MinervaConnect from "./minerva-connect";
import { dashboardUrl, routerBaseUrl } from "../lib/supabase-server";

export const metadata: Metadata = { title: "Connect Minerva | ABBBLE Portal" };
export const dynamic = "force-dynamic";

export default function MinervaPage() {
  return (
    <div>
      <Topbar section="Minerva Cloud" />
      <MinervaConnect routerBase={routerBaseUrl()} dashboard={dashboardUrl()} />
      <Footer />
    </div>
  );
}
