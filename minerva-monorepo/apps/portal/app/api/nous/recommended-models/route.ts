import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/nous/recommended-models — curated model picks for the Minerva
 * backend's model picker.
 *
 * Compatibility adapter, not a native ABBBLE API. The backend
 * (`hermes_cli/models.py`) fetches this path and reads a fixed shape:
 * `{paid,free}RecommendedModels: [{modelName}]` and
 * `{paid,free}Recommended{Compaction,Vision}Model: {modelName} | null`.
 * Every `modelName` below is a router wire id (`minerva/...`) that the
 * Minerva router actually serves; an unknown id would 400 at inference time,
 * so this list is curated by hand rather than derived — a "recommendation" is
 * a human pick, not a live query.
 *
 * Keep in step with `apps/router/src/catalog.ts`: a wire id renamed or retired
 * there must be replaced here, or the picker will recommend a model that no
 * longer resolves. `null` means "no pick", which the client already handles;
 * it is always preferable to a guessed model.
 */

type Pick = { modelName: string } | null;

const PAID: Array<{ modelName: string }> = [
  { modelName: "minerva/anthropic-claude-sonnet-4.6" },
  { modelName: "minerva/google-gemini-3.1-pro-preview" },
  { modelName: "minerva/anthropic-claude-haiku-4.5" },
];

const FREE: Array<{ modelName: string }> = [
  { modelName: "minerva/qwen-qwen3.8-27b:free" },
  { modelName: "minerva/liquid-lfm-2.5-2.6b:free" },
  { modelName: "minerva/thinkingmachines-inkling-small:free" },
];

const PICKS: {
  paidRecommendedCompactionModel: Pick;
  freeRecommendedCompactionModel: Pick;
  paidRecommendedVisionModel: Pick;
  freeRecommendedVisionModel: Pick;
} = {
  // Compaction wants cheap + large context. Flash-Lite has both; LFM is the
  // smallest free model that still compacts coherently.
  paidRecommendedCompactionModel: { modelName: "minerva/google-gemini-3.1-flash-lite" },
  freeRecommendedCompactionModel: { modelName: "minerva/liquid-lfm-2.5-2.6b:free" },
  // Vision picks are models whose upstream cards advertise image input.
  paidRecommendedVisionModel: { modelName: "minerva/google-gemini-3.1-pro-preview" },
  // No free-tier model currently advertises vision input; null, not a guess.
  freeRecommendedVisionModel: null,
};

export async function GET() {
  return NextResponse.json(
    {
      paidRecommendedModels: PAID,
      freeRecommendedModels: FREE,
      ...PICKS,
    },
    { headers: { "cache-control": "public, max-age=600" } }
  );
}
