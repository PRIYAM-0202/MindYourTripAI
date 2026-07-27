/* RLS policies batch 4: documents, approvals, ai_recommendations, notifications, ai_insights, user_preferences */

DROP POLICY IF EXISTS "documents_select_member" ON documents;
CREATE POLICY "documents_select_member" ON documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = documents.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "documents_insert_member" ON documents;
CREATE POLICY "documents_insert_member" ON documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = documents.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "documents_update_member" ON documents;
CREATE POLICY "documents_update_member" ON documents FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = documents.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = documents.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "documents_delete_member" ON documents;
CREATE POLICY "documents_delete_member" ON documents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = documents.trip_id AND (t.owner_id = auth.uid() OR documents.uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin') AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "approvals_select_member" ON approvals;
CREATE POLICY "approvals_select_member" ON approvals FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = approvals.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "approvals_insert_member" ON approvals;
CREATE POLICY "approvals_insert_member" ON approvals FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = approvals.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "approvals_update_member" ON approvals;
CREATE POLICY "approvals_update_member" ON approvals FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = approvals.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = approvals.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "approvals_delete_owner" ON approvals;
CREATE POLICY "approvals_delete_owner" ON approvals FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = approvals.trip_id AND (t.owner_id = auth.uid() OR approvals.requested_by = auth.uid()))
  );

DROP POLICY IF EXISTS "ai_recs_select_member" ON ai_recommendations;
CREATE POLICY "ai_recs_select_member" ON ai_recommendations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_recommendations.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "ai_recs_insert_member" ON ai_recommendations;
CREATE POLICY "ai_recs_insert_member" ON ai_recommendations FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_recommendations.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "ai_recs_update_member" ON ai_recommendations;
CREATE POLICY "ai_recs_update_member" ON ai_recommendations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_recommendations.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_recommendations.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "ai_recs_delete_member" ON ai_recommendations;
CREATE POLICY "ai_recs_delete_member" ON ai_recommendations FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_recommendations.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert_own_or_member" ON notifications;
CREATE POLICY "notifications_insert_own_or_member" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR (trip_id IS NOT NULL AND EXISTS (SELECT 1 FROM trips t WHERE t.id = notifications.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted'))))
  );
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_insights_select_member" ON ai_insights;
CREATE POLICY "ai_insights_select_member" ON ai_insights FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_insights.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "ai_insights_insert_member" ON ai_insights;
CREATE POLICY "ai_insights_insert_member" ON ai_insights FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_insights.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "ai_insights_update_member" ON ai_insights;
CREATE POLICY "ai_insights_update_member" ON ai_insights FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_insights.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_insights.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "ai_insights_delete_member" ON ai_insights;
CREATE POLICY "ai_insights_delete_member" ON ai_insights FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = ai_insights.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin') AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "user_preferences_select_own" ON user_preferences;
CREATE POLICY "user_preferences_select_own" ON user_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_preferences_insert_own" ON user_preferences;
CREATE POLICY "user_preferences_insert_own" ON user_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_preferences_update_own" ON user_preferences;
CREATE POLICY "user_preferences_update_own" ON user_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);