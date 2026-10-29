-- ============================================================
-- WanderLens — Solo SOS PostGIS Functions & Nearby Matching
-- ============================================================

-- Function to update user coarse presence (expires in 30m, rounded to ~100m)
CREATE OR REPLACE FUNCTION update_user_presence(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_coarse_lat NUMERIC;
  v_coarse_lng NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify user is verified
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_verified = TRUE) THEN
    RAISE EXCEPTION 'Verified email required to opt into SOS';
  END IF;

  -- Round to 3 decimal places (approx 110m at equator)
  v_coarse_lat := ROUND(p_lat::numeric, 3);
  v_coarse_lng := ROUND(p_lng::numeric, 3);

  INSERT INTO user_presence (user_id, coarse_location, expires_at)
  VALUES (
    auth.uid(),
    ST_SetSRID(ST_MakePoint(v_coarse_lng, v_coarse_lat), 4326)::geography,
    NOW() + INTERVAL '30 minutes'
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    coarse_location = EXCLUDED.coarse_location,
    expires_at = EXCLUDED.expires_at;

  UPDATE profiles SET sos_opt_in = TRUE WHERE id = auth.uid();
END;
$$;

-- Function to opt out of SOS and remove presence
CREATE OR REPLACE FUNCTION opt_out_sos()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM user_presence WHERE user_id = auth.uid();
  UPDATE profiles SET sos_opt_in = FALSE WHERE id = auth.uid();
END;
$$;

-- Function to trigger SOS and compute recipient count within 2km
CREATE OR REPLACE FUNCTION create_sos_alert(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_note TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  recipient_count INT,
  created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_alert_id UUID;
  v_sender_point GEOGRAPHY;
  v_recipients INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT check_sos_rate_limit(auth.uid()) THEN
    RAISE EXCEPTION 'SOS rate limit exceeded: Maximum 3 SOS alerts per rolling hour';
  END IF;

  -- Sender point
  v_sender_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;

  -- Count opted-in, verified users within 2000m (excluding sender and blocked users)
  SELECT COUNT(DISTINCT up.user_id) INTO v_recipients
  FROM user_presence up
  JOIN profiles p ON p.id = up.user_id
  WHERE up.user_id != auth.uid()
    AND up.expires_at > NOW()
    AND p.is_verified = TRUE
    AND p.sos_opt_in = TRUE
    AND ST_DWithin(up.coarse_location, v_sender_point, 2000)
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = up.user_id)
         OR (b.blocker_id = up.user_id AND b.blocked_id = auth.uid())
    );

  INSERT INTO sos_alerts (sender_id, coarse_location, note, status, recipient_count, created_at)
  VALUES (
    auth.uid(),
    v_sender_point,
    p_note,
    'active',
    COALESCE(v_recipients, 0),
    NOW()
  )
  RETURNING sos_alerts.id INTO v_alert_id;

  -- Audit log entry
  PERFORM write_audit(
    auth.uid(),
    'sos_triggered',
    'sos_alert',
    v_alert_id::text,
    jsonb_build_object('recipient_count', COALESCE(v_recipients, 0), 'note', p_note)
  );

  RETURN QUERY
  SELECT sa.id, sa.recipient_count, sa.created_at
  FROM sos_alerts sa
  WHERE sa.id = v_alert_id;
END;
$$;

-- Function for nearby opted-in users to get incoming active SOS alerts
CREATE OR REPLACE FUNCTION get_incoming_sos_alerts()
RETURNS TABLE (
  id UUID,
  sender_display_name TEXT,
  note TEXT,
  approx_distance_m INT,
  created_at TIMESTAMPTZ,
  has_responded BOOLEAN,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_my_loc GEOGRAPHY;
BEGIN
  -- Caller must be verified and have active presence
  SELECT coarse_location INTO v_my_loc
  FROM user_presence
  WHERE user_id = auth.uid()
    AND expires_at > NOW();

  IF v_my_loc IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    sa.id,
    p.display_name AS sender_display_name,
    sa.note,
    ROUND(ST_Distance(v_my_loc, sa.coarse_location))::INT AS approx_distance_m,
    sa.created_at,
    EXISTS (SELECT 1 FROM sos_responses sr WHERE sr.sos_id = sa.id AND sr.helper_id = auth.uid()) AS has_responded,
    CASE
      WHEN EXISTS (SELECT 1 FROM sos_responses sr WHERE sr.sos_id = sa.id AND sr.helper_id = auth.uid())
      THEN ST_Y(sa.coarse_location::geometry)
      ELSE NULL
    END AS latitude,
    CASE
      WHEN EXISTS (SELECT 1 FROM sos_responses sr WHERE sr.sos_id = sa.id AND sr.helper_id = auth.uid())
      THEN ST_X(sa.coarse_location::geometry)
      ELSE NULL
    END AS longitude
  FROM sos_alerts sa
  JOIN profiles p ON p.id = sa.sender_id
  WHERE sa.status = 'active'
    AND sa.sender_id != auth.uid()
    AND ST_DWithin(v_my_loc, sa.coarse_location, 2000)
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = sa.sender_id)
         OR (b.blocker_id = sa.sender_id AND b.blocked_id = auth.uid())
    )
  ORDER BY sa.created_at DESC;
END;
$$;

