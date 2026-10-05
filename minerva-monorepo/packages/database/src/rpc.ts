// RPC helpers — server-side wrappers around Supabase functions (§5.3).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TalentMatch } from "./types.js";

/**
 * Vector talent match via the match_talent stored function (migration 001).
 * Similarity = 1 - (embedding <=> query_embedding), computed server-side.
 */
export async function matchTalent(
  db: SupabaseClient,
  queryEmbedding: number[],
  matchLimit: number
): Promise<TalentMatch[]> {
  if (queryEmbedding.length !== 768) {
    throw new Error(
      `matchTalent expects a 768-dim embedding, got ${queryEmbedding.length}. ` +
        "This is almost always a model mismatch (EMBEDDING_DIM guard)."
    );
  }
  const { data, error } = await db.rpc("match_talent", {
    query_embedding: queryEmbedding,
    match_limit: matchLimit,
  });
  if (error) throw new Error(`match_talent RPC: ${error.message}`);
  return (data ?? []) as TalentMatch[];
}