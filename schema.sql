CREATE TABLE submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  class_name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE bot_state (
  chat_id bigint PRIMARY KEY,
  step text NOT NULL,
  name text,
  class_name text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: You should also create a storage bucket named "homework" in Supabase
-- and make it public so files can be easily downloaded, or use signed URLs.
