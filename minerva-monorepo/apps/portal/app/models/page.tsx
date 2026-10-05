import type { Metadata } from "next";
import Topbar from "../components/topbar";
import Footer from "../components/footer";
import ModelsClient from "./models-client";

export const metadata: Metadata = { title: "Models | ABBBLE Portal" };
export const dynamic = "force-dynamic";

function routerBase(): string {
  const raw =
    process.env.MINERVA_ROUTER_URL ??
    process.env.NEXT_PUBLIC_MINERVA_ROUTER_URL ??
    "https://minrouter.abbble.co.za";
  return raw.trim().replace(/\/+$/, "");
}

export default async function ModelsPage() {
  const base = routerBase();
  return (
    <div>
      <Topbar section="Models · Active Promos" />
      <ModelsClient routerBase={base} />
      <Footer />
    </div>
  );
}
