"use server";

import { revalidatePath } from "next/cache";

import {
  requireAdmin,
  toErrorResult,
  type ServiceResult,
} from "@/lib/cms/admin-guard";
import type { PageGroupId } from "@/lib/cms/page-groups";
import {
  createPage,
  deletePage,
  publishContent,
  saveDraft,
  unpublishPage,
  uploadResponsiveImage,
} from "@/lib/cms/page-service";

function revalidateForSlug(slug: string): void {
  revalidatePath(`/${slug}`);
  if (slug === "home") revalidatePath("/");
  revalidatePath("/blog");
}

export async function createPageAction(
  input: { title: string; slug: string; group: PageGroupId }
): Promise<ServiceResult<{ id: string; slug: string }>> {
  try {
    const session = await requireAdmin();
    const result = await createPage(input, session.userId);
    if (result.ok) revalidatePath("/admin/pages");
    return result;
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function saveDraftAction(
  id: string,
  group: PageGroupId,
  payload: {
    title: string;
    slug: string;
    seo?: unknown;
    sections?: unknown[];
  }
): Promise<ServiceResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
    const result = await saveDraft(id, group, payload);
    if (result.ok) revalidateForSlug(result.data.slug);
    return result;
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function publishPageAction(
  id: string,
  group: PageGroupId,
  payload: {
    title: string;
    slug: string;
    seo?: unknown;
    sections?: unknown[];
  }
): Promise<ServiceResult<{ id: string; slug: string }>> {
  try {
    await requireAdmin();
    const result = await publishContent(id, group, payload);
    if (result.ok) revalidateForSlug(result.data.slug);
    return result;
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function unpublishPageAction(
  id: string
): Promise<ServiceResult<true>> {
  try {
    await requireAdmin();
    const result = await unpublishPage(id);
    if (result.ok) revalidatePath("/blog");
    return result;
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function deletePageAction(id: string): Promise<ServiceResult<true>> {
  try {
    await requireAdmin();
    const result = await deletePage(id);
    if (result.ok) {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath("/admin/pages");
    }
    return result;
  } catch (err) {
    return toErrorResult(err);
  }
}

export async function uploadImageAction(
  formData: FormData
): Promise<ServiceResult<import("@/lib/cms/sections/schema").ResponsiveImage>> {
  try {
    await requireAdmin();
    const file = formData.get("file");
    const alt = String(formData.get("alt") ?? "");
    const folder = String(formData.get("folder") ?? "shared");
    if (!(file instanceof File)) {
      return { ok: false, error: "No file provided" };
    }
    return await uploadResponsiveImage(
      file,
      alt,
      `pages/${folder.replace(/[^a-z0-9-]/gi, "") || "shared"}`
    );
  } catch (err) {
    return toErrorResult(err);
  }
}
