-- Migration script to add title_auto_generated column to existing chats table
-- Run this if you already have a chats table without the title_auto_generated column

-- Add the new column with default value
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS title_auto_generated BOOLEAN DEFAULT true;

-- Update existing rows where title is "New Chat" to be auto-generated
UPDATE chats 
SET title_auto_generated = true 
WHERE title LIKE 'New Chat%';

-- Update existing rows with custom titles to be manually edited
UPDATE chats 
SET title_auto_generated = false 
WHERE title NOT LIKE 'New Chat%';

-- Add comment for documentation
COMMENT ON COLUMN chats.title_auto_generated IS 'Indicates whether the chat title was auto-generated from the first message or manually edited by the user';