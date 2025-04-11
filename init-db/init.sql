-- Create the searchable_content table
CREATE TABLE IF NOT EXISTS searchable_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Using UUIDs
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_body TEXT,
    keywords TEXT[],
    category VARCHAR(100),
    url VARCHAR(2048) NOT NULL,
    image_url VARCHAR(2048),
    search_vector TSVECTOR, -- The column for FTS
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the necessary extension if it doesn't exist (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the GIN index on the search_vector for fast searching
-- Check if index exists before creating to make script idempotent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE c.relname = 'idx_gin_search_vector' AND c.relkind = 'i') THEN
    CREATE INDEX idx_gin_search_vector ON searchable_content USING GIN (search_vector);
  END IF;
END $$;

-- Create the trigger function to update search_vector
CREATE OR REPLACE FUNCTION update_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('pg_catalog.english', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('pg_catalog.english', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('pg_catalog.english', array_to_string(coalesce(NEW.keywords, ARRAY[]::text[]), ' ')), 'B'); -- Combine keywords if they exist
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create the trigger that uses the function
-- Drop trigger first if it exists to make script idempotent
DROP TRIGGER IF EXISTS search_vector_update_trigger ON searchable_content;
CREATE TRIGGER search_vector_update_trigger BEFORE INSERT OR UPDATE
ON searchable_content FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Optional: Add some initial dummy data
INSERT INTO searchable_content (title, description, keywords, category, url) VALUES
('First Example Item', 'This is the description for the first item.', ARRAY['example', 'first', 'test'], 'Examples', '/items/first'),
('Another Test Article', 'Searching for articles is easy with FTS.', ARRAY['test', 'article', 'search'], 'Tests', '/items/second')
ON CONFLICT (url) DO NOTHING; -- Avoid errors if script runs multiple times with existing URLs

-- Grant privileges if necessary (usually handled by POSTGRES_USER being owner)
-- GRANT ALL PRIVILEGES ON TABLE searchable_content TO your_db_user;