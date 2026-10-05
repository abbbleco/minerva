import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/app/lib/supabase-server";

export const dynamic = "force-dynamic";

type Membership = { agency_id: string; role: string };
type Agency = { id: string; slug: string; name: string };
type Agent = {
  id: string;
  name: string;
  status: string;
  dashboard_url: string | null;
  gateway_state: string;
};

/**
 * Cloud agent discovery for the desktop's Gateway settings picker.
 *
 * Auth is the portal session cookie the desktop already holds on its shared
 * OAuth partition — the same cookie the login page sets — so there is no
 * second credential to mint or rotate.
 *
 * The agency (the desktop's "org") is resolved from the caller's OWN
 * memberships; a caller-supplied `org` is only ever used to SELECT among those
 * memberships, never to reach an agency the caller is not a member of. An
 * unknown or non-member `org` is 404 org_not_found, which the desktop
 * distinguishes from a 403 so it can drop a stale remembered team and retry
 * unscoped.
 *
 * A caller in more than one agency and no `org` gets 409 org_selection_required
 * with the list, which the desktop renders as a picker and replays with the
 * chosen org.
 */
export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // The desktop treats 401 as "session lapsed" and retries once through its
    // silent renewal before surfacing a re-login, so this must be a bare 401
    // with no body it could mistake for a resolved-but-empty answer.
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { data: membershipRows, error: membershipError } = await supabase
      .from("agency_memberships")
      .select("agency_id, role")
      .eq("user_id", user.id)
      .eq("status", "active");
    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    const memberships = (membershipRows ?? []) as Membership[];
    if (memberships.length === 0) {
      // Authenticated but attached to no agency. An empty list, NOT an error:
      // the desktop renders its "no agents, create one in the portal" state.
      return NextResponse.json({ agents: [], org: null });
    }

    // Resolve every agency this caller belongs to up front. The desktop's org
    // picker replays the chosen org as EITHER an id or a slug, so matching a
    // bare id would 404 on the slug the picker itself handed out.
    const agencyIds = memberships.map((row) => row.agency_id);
    const { data: agencyRows } = await supabase
      .from("agencies")
      .select("id, slug, name")
      .in("id", agencyIds);
    const agencies = (agencyRows ?? []) as Agency[];
    const agencyById = new Map(agencies.map((agency) => [agency.id, agency]));

    const requested = new URL(request.url).searchParams.get("org")?.trim();
    let membership: Membership | undefined;
    if (requested) {
      membership = memberships.find((row) => {
        const agency = agencyById.get(row.agency_id);
        return row.agency_id === requested || agency?.slug === requested;
      });
      if (!membership) return NextResponse.json({ error: "org_not_found" }, { status: 404 });
    } else if (memberships.length === 1) {
      [membership] = memberships;
    } else {
      return NextResponse.json(
        {
          error: "org_selection_required",
          orgs: memberships.map((row) => {
            const agency = agencyById.get(row.agency_id);
            return {
              id: row.agency_id,
              slug: agency?.slug ?? null,
              name: agency?.name ?? row.agency_id,
              // No solo/personal tenancy concept in this schema: an agency is an
              // agency. Reported as false so the desktop's org shape stays whole.
              isPersonal: false,
              role: row.role,
            };
          }),
        },
        { status: 409 }
      );
    }

    if (!membership) return NextResponse.json({ agents: [], org: null });

    const { data: agentRows } = await supabase
      .from("agency_agents")
      .select("id, name, status, dashboard_url, gateway_state")
      .eq("agency_id", membership.agency_id)
      .order("created_at", { ascending: true });

    const agency = agencyById.get(membership.agency_id) ?? null;
    const agents = ((agentRows ?? []) as Agent[]).map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      // camelCase on the wire: the desktop's DTO is camelCase throughout and
      // silently substitutes null for anything it cannot read, so a still-
      // provisioning agent arrives as "no dashboard yet" rather than an error.
      dashboardUrl: typeof row.dashboard_url === "string" ? row.dashboard_url : null,
      dashboardGatewayState: row.gateway_state || "unknown",
    }));

    return NextResponse.json({
      agents,
      org: agency
        ? {
            id: agency.id,
            slug: agency.slug,
            name: agency.name,
            // No solo/personal tenancy concept in this schema: an agency is an
            // agency. Reported as false so the desktop's org shape stays whole.
            isPersonal: false,
            role: membership.role,
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("Supabase env") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
