DROP POLICY IF EXISTS "Enable all access for authenticated users" ON games;
CREATE POLICY "Enable read access for all users" ON games FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON games FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON expenses;
CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON expenses FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON polls;
CREATE POLICY "Enable read access for all users" ON polls FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON polls FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON votes;
CREATE POLICY "Enable read access for all users" ON votes FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON votes FOR ALL USING (auth.role() = 'authenticated');
