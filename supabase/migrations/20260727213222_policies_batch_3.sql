/* RLS policies batch 3: messages, expenses, expense_splits */

DROP POLICY IF EXISTS "messages_select_member" ON messages;
CREATE POLICY "messages_select_member" ON messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = messages.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "messages_insert_member" ON messages;
CREATE POLICY "messages_insert_member" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = messages.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "messages_update_author" ON messages;
CREATE POLICY "messages_update_author" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "messages_delete_author" ON messages;
CREATE POLICY "messages_delete_author" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses_select_member" ON expenses;
CREATE POLICY "expenses_select_member" ON expenses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = expenses.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "expenses_insert_member" ON expenses;
CREATE POLICY "expenses_insert_member" ON expenses FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = expenses.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "expenses_update_member" ON expenses;
CREATE POLICY "expenses_update_member" ON expenses FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = expenses.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = expenses.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "expenses_delete_member" ON expenses;
CREATE POLICY "expenses_delete_member" ON expenses FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = expenses.trip_id AND (t.owner_id = auth.uid() OR expenses.created_by = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin') AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "expense_splits_select_member" ON expense_splits;
CREATE POLICY "expense_splits_select_member" ON expense_splits FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE e.id = expense_splits.expense_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "expense_splits_insert_member" ON expense_splits;
CREATE POLICY "expense_splits_insert_member" ON expense_splits FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE e.id = expense_splits.expense_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "expense_splits_update_member" ON expense_splits;
CREATE POLICY "expense_splits_update_member" ON expense_splits FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE e.id = expense_splits.expense_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE e.id = expense_splits.expense_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "expense_splits_delete_member" ON expense_splits;
CREATE POLICY "expense_splits_delete_member" ON expense_splits FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM expenses e JOIN trips t ON t.id = e.trip_id WHERE e.id = expense_splits.expense_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin') AND tm.status = 'accepted')))
  );