-- Enable RLS on the table
ALTER TABLE core_serviceNow_apis ENABLE ROW LEVEL SECURITY;

-- Function to auto-set author_id on insert
CREATE OR REPLACE FUNCTION set_author_id()
RETURNS trigger AS $$
BEGIN
  NEW.author_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on insert
CREATE TRIGGER on_insert_set_author
  BEFORE INSERT ON core_serviceNow_apis
  FOR EACH ROW EXECUTE FUNCTION set_author_id();

-- Policy for SELECT: Public can read public items
CREATE POLICY "Public can read public APIs" ON core_serviceNow_apis
  FOR SELECT USING (is_public = true);

-- Policy for SELECT: Owners can read their own items
CREATE POLICY "Owners can read their APIs" ON core_serviceNow_apis
  FOR SELECT USING (auth.uid() = author_id);

-- Policy for INSERT: Authenticated users can create (author_id auto-set by trigger)
CREATE POLICY "Authenticated users can insert APIs" ON core_serviceNow_apis
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for UPDATE: Owners can update their own
CREATE POLICY "Owners can update their APIs" ON core_serviceNow_apis
  FOR UPDATE USING (auth.uid() = author_id);

-- Policy for DELETE: Owners can delete their own
CREATE POLICY "Owners can delete their APIs" ON core_serviceNow_apis
  FOR DELETE USING (auth.uid() = author_id);
