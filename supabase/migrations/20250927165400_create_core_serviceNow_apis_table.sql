-- Create the core_serviceNow_apis table
CREATE TABLE IF NOT EXISTS core_serviceNow_apis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  author_id UUID,
  code TEXT,
  type TEXT,
  repo_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint for author_id
ALTER TABLE core_serviceNow_apis
ADD CONSTRAINT fk_author_id
FOREIGN KEY (author_id) REFERENCES auth.users(id);
