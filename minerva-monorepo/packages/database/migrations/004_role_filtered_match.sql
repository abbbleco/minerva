-- M2 talent matching: role-filtered vector search (SQL pre-filter → HNSW) and
-- availability-aware matching. Keeps the deterministic path server-side.

-- CREATE OR REPLACE cannot change the argument list — drop the M0 2-arg
-- signature first (PostgREST would otherwise see an ambiguous overload).
DROP FUNCTION IF EXISTS match_talent(vector(768), int);

CREATE OR REPLACE FUNCTION match_talent(
  query_embedding vector(768),
  match_limit int,
  role_filter text DEFAULT NULL,
  availability_filter text[] DEFAULT NULL
)
RETURNS TABLE (id uuid, full_name text, role text, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT talents.id, talents.name, talents.role,
         1 - (talents.embedding <=> query_embedding) AS similarity
  FROM talents
  WHERE talents.embedding IS NOT NULL
    AND (role_filter IS NULL OR talents.role = role_filter)
    AND (availability_filter IS NULL OR talents.availability = ANY (availability_filter))
  ORDER BY talents.embedding <=> query_embedding ASC
  LIMIT match_limit;
END;
$$;