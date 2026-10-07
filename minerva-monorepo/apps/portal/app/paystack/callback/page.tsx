import type { Metadata } from "next";
import Link from "next/link";

import Footer from "../../components/footer";
import Topbar from "../../components/topbar";

export const metadata: Metadata = { title: "Payment received | ABBBLE Portal" };
export const dynamic = "force-dynamic";

/**
 * Paystack redirect landing after hosted checkout. Activation happens in the
 * webhook (ground truth), not here — this page says so and points at the
 * agency, polling the subscription until it flips or timing out honestly.
 */
export default function PaystackCallbackPage() {
  return (
    <div>
      <Topbar section="Payment received" />
      <main className="px-5 py-10 md:px-10">
        <div className="max-w-[560px]">
          <h1 className="nous-display text-[34px] leading-[1.05]">Payment received</h1>
          <p className="mt-2 text-[13px] leading-6 text-white/70" role="status">
            Paystack confirmed your payment. Your plan activates automatically —
            usually within a minute. If it takes longer, the webhook is still
            settling; your receipt is safe with Paystack.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/minerva" className="nous-btn">
              Go to your agency
            </Link>
            <Link href="/plans" className="nous-btn-outline !border-white/40 !text-white">
              Back to plans
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
