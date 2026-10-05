import { notFound } from "next/navigation";

import PageEditor, {
  type PageEditorProps,
} from "@/app/admin/components/PageEditor";
import type { EditorSection } from "@/app/admin/components/editor/SectionFields";
import { getPageGroup } from "@/lib/cms/page-groups";
import { getPageById } from "@/lib/cms/page-service";
import { seoSchema } from "@/lib/cms/sections/schema";
import type { CmsSeo } from "@/lib/cms/types";

export const metadata = { title: "Edit page — Minerva CMS" };

export default async function PageEditorRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPageById(id);
  if (!result.ok) {
    notFound();
  }

  const row = result.data;
  const group = getPageGroup(row.page_group);
  const seoParsed = seoSchema.safeParse(row.seo ?? {});
  const seo: CmsSeo = seoParsed.success
    ? seoParsed.data
    : { noindex: false };

  const editorProps: PageEditorProps = {
    page: {
      id: row.id,
      slug: row.slug,
      group: group.id,
      groupLabel: group.label,
      title: row.title,
      isPublished: row.is_published,
      allowedSections: [...group.allowedSections],
      seo: {
        title: seo.title,
        description: seo.description,
        noindex: seo.noindex,
        ogImage: seo.ogImage as unknown as Record<string, unknown> | undefined,
      },
    },
    initialSections: (row.sections ?? []) as EditorSection[],
  };

  return <PageEditor {...editorProps} />;
}
