import { NextResponse } from "next/server";

import { requireAdmin, toErrorResult } from "@/lib/cms/admin-guard";
import { getPageById } from "@/lib/cms/page-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const result = await getPageById(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ page: result.data });
  } catch (err) {
    const e = toErrorResult(err);
    return NextResponse.json({ error: e.error }, { status: 401 });
  }
}
