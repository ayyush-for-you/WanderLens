-- ============================================================
-- WanderLens — Monument Image Vector Search RPC
-- ============================================================

CREATE OR REPLACE FUNCTION match_monument_images (
  query_embedding vector(512),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  monument_id uuid,
  image_id uuid,
  monument_name text,
  monument_location geography,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.monument_id,
    mi.id AS image_id,
    m.name AS monument_name,
    m.location AS monument_location,
    (1 - (mi.embedding <=> query_embedding))::float AS similarity
  FROM monument_images mi
  JOIN monuments m ON m.id = mi.monument_id
  WHERE mi.kind = 'reference'
    AND mi.embedding IS NOT NULL
    AND m.is_published = TRUE
    AND (1 - (mi.embedding <=> query_embedding)) >= match_threshold
  ORDER BY mi.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

