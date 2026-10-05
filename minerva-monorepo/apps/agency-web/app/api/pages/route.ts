import { NextResponse } from "next/server";

import { requireAdmin, toErrorResult } from "@/lib/cms/admin-guard";
import {
  createPage,
  listAllPages,
} from "@/lib/cms/page-service";
import { PAGE_GROUPS, isPageGroupId } from "@/lib/cms/page-groups";

/** Admin-only convenience API — the public site never calls these. */
export async function GET() {
  try {
    await requireAdmin();
    const result = await listAllPages();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ pages: result.data });
  } catch (err) {
    const e = toErrorResult(err);
    return NextResponse.json({ error: e.error }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      group?: string;
    };

    const groupId = String(body.group ?? "");
    if (!body.title || !isPageGroupId(groupId)) {
      return NextResponse.json(
        { error: "title and a valid group are required" },
        { status: 400 }
      );
    }

    const result = await createPage(
      {
        title: body.title,
        slug: String(body.slug ?? ""),
        group: groupId,
      },
      session.userId
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch (err) {
    const e = toErrorResult(err);
    return NextResponse.json({ error: e.error }, { status: 401 });
  }
}
