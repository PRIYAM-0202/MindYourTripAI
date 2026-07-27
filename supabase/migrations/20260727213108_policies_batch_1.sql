/* RLS policies batch 1: profiles, trips, trip_members, activities, itinerary_days */

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "trips_select_member" ON trips;
CREATE POLICY "trips_select_member" ON trips FOR SELECT
  TO authenticated USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = trips.id AND tm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "trips_insert_own" ON trips;
CREATE POLICY "trips_insert_own" ON trips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "trips_update_member" ON trips;
CREATE POLICY "trips_update_member" ON trips FOR UPDATE
  TO authenticated USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = trips.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin','editor'))
  ) WITH CHECK (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = trips.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin','editor'))
  );
DROP POLICY IF EXISTS "trips_delete_own" ON trips;
CREATE POLICY "trips_delete_own" ON trips FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "trip_members_select_member" ON trip_members;
CREATE POLICY "trip_members_select_member" ON trip_members FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_members.trip_id AND t.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM trips t JOIN trip_members tm ON tm.trip_id = t.id WHERE t.id = trip_members.trip_id AND tm.user_id = auth.uid() AND tm.status = 'accepted')
  );
DROP POLICY IF EXISTS "trip_members_insert_owner" ON trip_members;
CREATE POLICY "trip_members_insert_owner" ON trip_members FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_members.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm2 WHERE tm2.trip_id = t.id AND tm2.user_id = auth.uid() AND tm2.role IN ('owner','admin') AND tm2.status = 'accepted')))
  );
DROP POLICY IF EXISTS "trip_members_update_self_or_owner" ON trip_members;
CREATE POLICY "trip_members_update_self_or_owner" ON trip_members FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_members.trip_id AND t.owner_id = auth.uid())
  ) WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_members.trip_id AND t.owner_id = auth.uid())
  );
DROP POLICY IF EXISTS "trip_members_delete_owner" ON trip_members;
CREATE POLICY "trip_members_delete_owner" ON trip_members FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_members.trip_id AND (t.owner_id = auth.uid() OR trip_members.user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "activities_select_member" ON activities;
CREATE POLICY "activities_select_member" ON activities FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = activities.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "activities_insert_member" ON activities;
CREATE POLICY "activities_insert_member" ON activities FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = activities.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin','editor','member') AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "activities_update_member" ON activities;
CREATE POLICY "activities_update_member" ON activities FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = activities.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = activities.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "activities_delete_owner" ON activities;
CREATE POLICY "activities_delete_owner" ON activities FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = activities.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin') AND tm.status = 'accepted')))
  );

DROP POLICY IF EXISTS "itinerary_select_member" ON itinerary_days;
CREATE POLICY "itinerary_select_member" ON itinerary_days FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = itinerary_days.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid())))
  );
DROP POLICY IF EXISTS "itinerary_insert_member" ON itinerary_days;
CREATE POLICY "itinerary_insert_member" ON itinerary_days FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = itinerary_days.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "itinerary_update_member" ON itinerary_days;
CREATE POLICY "itinerary_update_member" ON itinerary_days FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = itinerary_days.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = itinerary_days.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.status = 'accepted')))
  );
DROP POLICY IF EXISTS "itinerary_delete_member" ON itinerary_days;
CREATE POLICY "itinerary_delete_member" ON itinerary_days FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM trips t WHERE t.id = itinerary_days.trip_id AND (t.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM trip_members tm WHERE tm.trip_id = t.id AND tm.user_id = auth.uid() AND tm.role IN ('owner','admin') AND tm.status = 'accepted')))
  );