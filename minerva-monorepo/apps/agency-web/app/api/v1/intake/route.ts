import { NextResponse } from "next/server";

interface IntakePayload {
  brief?: string;
  client_email?: string;
  organization_name?: string;
  source?: string;
  media_url?: string;
}

export async function POST(request: Request) {
  const upstream = process.env.MINERVA_INTAKE_URL;
  if (!upstream) {
    return NextResponse.json(
      { error: "MINERVA_INTAKE_URL is not configured" },
      { status: 503 },
    );
  }

  let body: IntakePayload;
  try {
    body = (await request.json()) as IntakePayload;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const apiKey = process.env.MINERVA_API_KEY;
  const upstreamRes = await fetch(
    `${upstream.replace(/\/$/, "")}/api/v1/intake`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { "x-minerva-api-key": apiKey } : {}),
      },
      body: JSON.stringify(body),
    },
  );

  const upstreamBody = await upstreamRes.text();
  return new NextResponse(upstreamBody, {
    status: upstreamRes.status,
    headers: { "content-type": "application/json" },
  });
}