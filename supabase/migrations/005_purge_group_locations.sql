-- ============================================================
-- WanderLens — Group Location Purge & Utilities
-- ============================================================

-- Function to purge location records for groups that ended more than 24h ago
CREATE OR REPLACE FUNCTION purge_ended_group_locations()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM group_locations
  WHERE group_id IN (
    SELECT id FROM travel_groups
    WHERE ends_at < NOW() - INTERVAL '24 hours'
       OR status IN ('ended', 'cancelled')
  );
END;
$$;

-- Function for member to upsert their location during active trip
CREATE OR REPLACE FUNCTION update_group_location(
  p_group_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Verify caller is an accepted member with sharing_on of an active trip
  IF NOT EXISTS (
    SELECT 1 FROM group_members gm
    JOIN travel_groups tg ON tg.id = gm.group_id
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
      AND gm.status = 'accepted'
      AND gm.sharing_on = TRUE
      AND tg.status = 'active'
      AND tg.starts_at <= NOW()
      AND tg.ends_at >= NOW()
  ) THEN
    RAISE EXCEPTION 'Location updates only allowed for active trip members with sharing enabled';
  END IF;

  INSERT INTO group_locations (group_id, user_id, location, updated_at)
  VALUES (p_group_id, auth.uid(), ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, NOW())
  ON CONFLICT (group_id, user_id)
  DO UPDATE SET
    location = EXCLUDED.location,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Function to fetch active locations for group members
CREATE OR REPLACE FUNCTION get_group_active_locations(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  updated_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Caller must be an accepted member of the group, or moderator/admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid() AND gm.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('moderator', 'admin')
    )
  ) THEN
    RETURN;
  END IF;

  -- Ensure group is active and within trip window
  IF NOT EXISTS (
    SELECT 1 FROM travel_groups tg
    WHERE tg.id = p_group_id
      AND tg.status = 'active'
      AND tg.starts_at <= NOW()
      AND tg.ends_at >= NOW()
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    gl.user_id,
    p.display_name,
    p.avatar_url,
    ST_Y(gl.location::geometry) AS latitude,
    ST_X(gl.location::geometry) AS longitude,
    gl.updated_at
  FROM group_locations gl
  JOIN profiles p ON p.id = gl.user_id
  JOIN group_members gm ON gm.group_id = gl.group_id AND gm.user_id = gl.user_id
  WHERE gl.group_id = p_group_id
    AND gm.sharing_on = TRUE
    AND gm.status = 'accepted';
END;
$$;
