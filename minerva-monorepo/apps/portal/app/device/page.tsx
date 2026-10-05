import type { Metadata } from "next";
import DeviceApprove from "./device-approve";

export const metadata: Metadata = { title: "Connect device | ABBBLE Portal" };
export const dynamic = "force-dynamic";

export default function DevicePage() {
  return <DeviceApprove />;
}
