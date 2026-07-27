/* RLS policies batch 2 retry: board_columns, board_cards, card_comments, card_votes */

DROP POLICY IF EXISTS "board_columns_select_member" ON board_columns;
CREATE POLICY "board_columns_select_member" ON board_columns FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_columns.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );

DROP POLICY IF EXISTS "board_columns_insert_member" ON board_columns;
CREATE POLICY "board_columns_insert_member" ON board_columns FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_columns.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin','editor') AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "board_columns_update_member" ON board_columns;
CREATE POLICY "board_columns_update_member" ON board_columns FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_columns.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_columns.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "board_columns_delete_member" ON board_columns;
CREATE POLICY "board_columns_delete_member" ON board_columns FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_columns.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin') AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "board_cards_select_member" ON board_cards;
CREATE POLICY "board_cards_select_member" ON board_cards FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_cards.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );

DROP POLICY IF EXISTS "board_cards_insert_member" ON board_cards;
CREATE POLICY "board_cards_insert_member" ON board_cards FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_cards.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "board_cards_update_member" ON board_cards;
CREATE POLICY "board_cards_update_member" ON board_cards FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_cards.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = board_cards.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "board_cards_delete_member" ON board_cards;
CREATE POLICY "board_cards_delete_member" ON board_cards FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = board_cards.trip_id
      AND (
        t.owner_id = auth.uid()
        OR board_cards.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin','editor') AND tm.status = 'accepted')
      )
    )
  );

DROP POLICY IF EXISTS "card_comments_select_member" ON card_comments;
CREATE POLICY "card_comments_select_member" ON card_comments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM board_cards bc JOIN trips t ON t.id = bc.trip_id WHERE bc.id = card_comments.card_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );

DROP POLICY IF EXISTS "card_comments_insert_member" ON card_comments;
CREATE POLICY "card_comments_insert_member" ON card_comments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM board_cards bc JOIN trips t ON t.id = bc.trip_id WHERE bc.id = card_comments.card_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "card_comments_delete_author" ON card_comments;
CREATE POLICY "card_comments_delete_author" ON card_comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "card_votes_select_member" ON card_votes;
CREATE POLICY "card_votes_select_member" ON card_votes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM board_cards bc JOIN trips t ON t.id = bc.trip_id WHERE bc.id = card_votes.card_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );

DROP POLICY IF EXISTS "card_votes_insert_member" ON card_votes;
CREATE POLICY "card_votes_insert_member" ON card_votes FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM board_cards bc JOIN trips t ON t.id = bc.trip_id WHERE bc.id = card_votes.card_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "card_votes_delete_self" ON card_votes;
CREATE POLICY "card_votes_delete_self" ON card_votes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);