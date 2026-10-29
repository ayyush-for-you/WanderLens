-- ============================================================
-- WanderLens — Row Level Security Policies
-- Run AFTER 001_schema.sql
-- ============================================================

-- ─── Enable RLS on ALL tables ───────────────────────────────
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE places                ENABLE ROW LEVEL SECURITY;
ALTER TABLE place_activity_daily  ENABLE ROW LEVEL SECURITY;
ALTER TABLE monuments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE monument_images       ENABLE ROW LEVEL SECURITY;
ALTER TABLE monument_revisions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images           ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_responses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log             ENABLE ROW LEVEL SECURITY;

-- ─── Helper: current user role ──────────────────────────────
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT current_user_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION is_moderator_or_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT current_user_role() IN ('moderator', 'admin');
$$;

CREATE OR REPLACE FUNCTION is_verified()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT is_verified FROM profiles WHERE id = auth.uid();
$$;

-- ─── Profiles ───────────────────────────────────────────────
-- Anyone can read profiles (display names / avatars)
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- prevent users from changing their own role or is_verified
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND is_verified = (SELECT is_verified FROM profiles WHERE id = auth.uid())
  );
-- Admin can update any profile (role changes, suspensions)
CREATE POLICY profiles_admin_update ON profiles FOR UPDATE
  USING (is_admin());
-- Insert handled by trigger only (SECURITY DEFINER)
CREATE POLICY profiles_insert_trigger ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ─── Destinations ───────────────────────────────────────────
CREATE POLICY destinations_select ON destinations FOR SELECT USING (true);
CREATE POLICY destinations_admin_insert ON destinations FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY destinations_admin_update ON destinations FOR UPDATE
  USING (is_admin());
CREATE POLICY destinations_admin_delete ON destinations FOR DELETE
  USING (is_admin());

-- ─── Places ─────────────────────────────────────────────────
CREATE POLICY places_select ON places FOR SELECT
  USING (is_hidden = FALSE OR is_moderator_or_admin());
CREATE POLICY places_admin_all ON places FOR ALL
  USING (is_admin());

-- ─── Place Activity Daily ───────────────────────────────────
CREATE POLICY pad_select ON place_activity_daily FOR SELECT USING (true);
CREATE POLICY pad_insert_service ON place_activity_daily FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY pad_update_service ON place_activity_daily FOR UPDATE
  USING (is_admin());

-- ─── Monuments ──────────────────────────────────────────────
CREATE POLICY monuments_select ON monuments FOR SELECT
  USING (is_published = TRUE OR is_moderator_or_admin());
CREATE POLICY monuments_admin_all ON monuments FOR ALL
  USING (is_moderator_or_admin());

-- ─── Monument Images ────────────────────────────────────────
CREATE POLICY monument_images_select ON monument_images FOR SELECT USING (true);
CREATE POLICY monument_images_admin_all ON monument_images FOR ALL
  USING (is_moderator_or_admin());

-- ─── Monument Revisions ─────────────────────────────────────
CREATE POLICY revisions_select ON monument_revisions FOR SELECT
  USING (is_moderator_or_admin());
CREATE POLICY revisions_insert ON monument_revisions FOR INSERT
  WITH CHECK (is_moderator_or_admin());

-- ─── Scans ──────────────────────────────────────────────────
CREATE POLICY scans_select_own ON scans FOR SELECT USING (user_id = auth.uid());
CREATE POLICY scans_insert_own ON scans FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─── Posts ──────────────────────────────────────────────────
CREATE POLICY posts_select ON posts FOR SELECT
  USING (is_hidden = FALSE OR is_moderator_or_admin() OR user_id = auth.uid());
CREATE POLICY posts_insert ON posts FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_verified());
CREATE POLICY posts_delete_own ON posts FOR DELETE
  USING (user_id = auth.uid());
CREATE POLICY posts_mod_update ON posts FOR UPDATE
  USING (is_moderator_or_admin() OR user_id = auth.uid());

-- ─── Post Images ────────────────────────────────────────────
CREATE POLICY post_images_select ON post_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND (posts.is_hidden = FALSE OR is_moderator_or_admin()))
);
CREATE POLICY post_images_insert ON post_images FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.user_id = auth.uid())
  );

-- ─── Post Likes ─────────────────────────────────────────────
CREATE POLICY post_likes_select ON post_likes FOR SELECT USING (true);
CREATE POLICY post_likes_insert ON post_likes FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_verified());
CREATE POLICY post_likes_delete ON post_likes FOR DELETE
  USING (user_id = auth.uid());

-- ─── Comments ───────────────────────────────────────────────
CREATE POLICY comments_select ON comments FOR SELECT
  USING (is_hidden = FALSE OR is_moderator_or_admin() OR user_id = auth.uid());
CREATE POLICY comments_insert ON comments FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_verified());
CREATE POLICY comments_delete_own ON comments FOR DELETE
  USING (user_id = auth.uid());
CREATE POLICY comments_mod_update ON comments FOR UPDATE
  USING (is_moderator_or_admin() OR user_id = auth.uid());

-- ─── Communities ────────────────────────────────────────────
CREATE POLICY communities_select ON communities FOR SELECT USING (true);
CREATE POLICY communities_insert ON communities FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND is_verified());
CREATE POLICY communities_update_owner ON communities FOR UPDATE
  USING (owner_id = auth.uid() OR is_moderator_or_admin());
CREATE POLICY communities_delete ON communities FOR DELETE
  USING (owner_id = auth.uid() OR is_admin());

-- ─── Community Members ──────────────────────────────────────
CREATE POLICY cm_select ON community_members FOR SELECT USING (true);
CREATE POLICY cm_insert ON community_members FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_verified());
CREATE POLICY cm_delete_own ON community_members FOR DELETE
  USING (user_id = auth.uid() OR is_moderator_or_admin());

-- ─── Messages ───────────────────────────────────────────────
-- Only members of the community can read messages
CREATE POLICY messages_select ON messages FOR SELECT
  USING (
    (is_hidden = FALSE)
    AND EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = messages.community_id AND cm.user_id = auth.uid()
    )
    OR is_moderator_or_admin()
  );
CREATE POLICY messages_insert ON messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_verified()
    AND EXISTS (
      SELECT 1 FROM community_members cm
      WHERE cm.community_id = messages.community_id AND cm.user_id = auth.uid()
    )
  );
CREATE POLICY messages_mod_hide ON messages FOR UPDATE
  USING (is_moderator_or_admin());

-- ─── Travel Groups ──────────────────────────────────────────
CREATE POLICY tg_select ON travel_groups FOR SELECT
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = travel_groups.id AND gm.user_id = auth.uid() AND gm.status = 'accepted'
    )
    OR is_moderator_or_admin()
  );
CREATE POLICY tg_insert ON travel_groups FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND is_verified());
CREATE POLICY tg_update_owner ON travel_groups FOR UPDATE
  USING (owner_id = auth.uid() OR is_admin());
CREATE POLICY tg_delete_owner ON travel_groups FOR DELETE
  USING (owner_id = auth.uid() OR is_admin());

-- ─── Group Members ──────────────────────────────────────────
CREATE POLICY gm_select ON group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM travel_groups tg
      WHERE tg.id = group_members.group_id AND tg.owner_id = auth.uid()
    )
    OR is_moderator_or_admin()
  );
CREATE POLICY gm_insert ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM travel_groups tg WHERE tg.id = group_id AND tg.owner_id = auth.uid()
    )
  );
CREATE POLICY gm_update_own ON group_members FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

-- ─── Group Locations ────────────────────────────────────────
-- CRITICAL: Only accepted members of an ACTIVE group can read
CREATE POLICY gl_select ON group_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM group_members gm
      JOIN travel_groups tg ON tg.id = gm.group_id
      WHERE gm.group_id = group_locations.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'accepted'
        AND tg.status = 'active'
        AND tg.ends_at > NOW()
    )
  );
-- Members can upsert their own location only when sharing_on
CREATE POLICY gl_upsert ON group_locations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM group_members gm
      JOIN travel_groups tg ON tg.id = gm.group_id
      WHERE gm.group_id = group_locations.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'accepted'
        AND gm.sharing_on = TRUE
        AND tg.status = 'active'
        AND tg.ends_at > NOW()
    )
  );
CREATE POLICY gl_delete_own ON group_locations FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- ─── Group Alerts ───────────────────────────────────────────
CREATE POLICY ga_select ON group_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_alerts.group_id AND gm.user_id = auth.uid() AND gm.status = 'accepted'
    )
    OR is_moderator_or_admin()
  );
CREATE POLICY ga_insert ON group_alerts FOR INSERT
  WITH CHECK (
    from_user = auth.uid()
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_alerts.group_id AND gm.user_id = auth.uid() AND gm.status = 'accepted'
    )
  );

-- ─── User Presence ──────────────────────────────────────────
-- Users only see their OWN presence record
CREATE POLICY up_select_own ON user_presence FOR SELECT USING (user_id = auth.uid());
CREATE POLICY up_upsert_own ON user_presence FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY up_update_own ON user_presence FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY up_delete_own ON user_presence FOR DELETE USING (user_id = auth.uid());
-- Exact locations are NEVER returned to other users via policy — only distance via RPC

-- ─── SOS Alerts ─────────────────────────────────────────────
-- Senders see their own alerts; no one else gets raw coordinates
CREATE POLICY sos_select_own ON sos_alerts FOR SELECT USING (sender_id = auth.uid());
CREATE POLICY sos_insert_own ON sos_alerts FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND is_verified());
CREATE POLICY sos_update_own ON sos_alerts FOR UPDATE
  USING (sender_id = auth.uid());
-- Moderators/admin can view all (for audit)
CREATE POLICY sos_mod_select ON sos_alerts FOR SELECT
  USING (is_moderator_or_admin());

-- ─── SOS Responses ──────────────────────────────────────────
CREATE POLICY sos_resp_insert ON sos_responses FOR INSERT
  WITH CHECK (helper_id = auth.uid() AND is_verified());
CREATE POLICY sos_resp_select ON sos_responses FOR SELECT
  USING (
    helper_id = auth.uid()
    OR EXISTS (SELECT 1 FROM sos_alerts WHERE id = sos_id AND sender_id = auth.uid())
    OR is_moderator_or_admin()
  );

-- ─── Blocks ─────────────────────────────────────────────────
CREATE POLICY blocks_select_own ON blocks FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());
CREATE POLICY blocks_insert_own ON blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid());
CREATE POLICY blocks_delete_own ON blocks FOR DELETE
  USING (blocker_id = auth.uid());

-- ─── Reports ────────────────────────────────────────────────
CREATE POLICY reports_select ON reports FOR SELECT
  USING (reporter_id = auth.uid() OR is_moderator_or_admin());
CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid() AND is_verified());
CREATE POLICY reports_update_mod ON reports FOR UPDATE
  USING (is_moderator_or_admin());

-- ─── Audit Log ──────────────────────────────────────────────
CREATE POLICY audit_select ON audit_log FOR SELECT
  USING (actor_id = auth.uid() OR is_moderator_or_admin());
-- Inserts only through SECURITY DEFINER functions
CREATE POLICY audit_insert_deny ON audit_log FOR INSERT WITH CHECK (FALSE);
