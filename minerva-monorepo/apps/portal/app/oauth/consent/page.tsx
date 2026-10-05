import Link from "next/link";
import Topbar from "../../components/topbar";
import Footer from "../../components/footer";

export const metadata = { title: "Authorize | ABBBLE Portal" };

/**
 * OAuth consent screen. Reached from /oauth/authorize with the validated
 * request params in the query string; the Approve form POSTs them back to
 * /oauth/authorize, which mints the code. A server component: nothing here
 * needs interactivity beyond the two submit buttons.
 */
export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const pick = (name: string) => params[name] ?? "";
  const clientId = pick("client_id");
  const scope = pick("scope");
  const hidden = ["client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope"];

  if (!clientId) {
    return (
      <div>
        <Topbar section="Authorize" />
        <section className="px-6 pt-10 md:px-10">
          <p className="text-[15px] text-white/70">This authorization request is missing its client.</p>
          <p className="mt-4">
            <Link href="/" className="underline">
              Back to the portal
            </Link>
          </p>
        </section>
        <div className="mt-10">
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar section="Authorize" />
      <section className="mx-auto max-w-[40rem] px-6 pt-10">
        <h1 className="nous-display text-[36px]">Authorize this app?</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/70">
          <span className="font-mono text-white">{clientId}</span> is requesting access to your ABBBLE
          account{scope ? (
            <>
              {" "}
              with scope <span className="font-mono text-white">{scope}</span>
            </>
          ) : (
            ""
          )}
          . Approving signs this app in as you; it never sees your password.
        </p>
        <form method="POST" action="/oauth/authorize" className="mt-8 flex flex-wrap gap-3">
          {hidden.map((name) => (
            <input key={name} type="hidden" name={name} value={pick(name)} />
          ))}
          <button type="submit" name="decision" value="allow" className="nous-btn">
            Authorize
          </button>
          <button type="submit" name="decision" value="deny" className="nous-btn-outline">
            Deny
          </button>
        </form>
      </section>
      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
}
