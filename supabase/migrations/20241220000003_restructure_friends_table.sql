-- Restructure friends table to use single row per friendship
-- This saves space and makes queries simpler

-- First, let's backup the current friends table
CREATE TABLE IF NOT EXISTS friends_backup AS 
SELECT * FROM friends;

-- Drop the existing friends table
DROP TABLE IF EXISTS friends CASCADE;

-- Create the new friends table with single row per friendship
CREATE TABLE friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure user1_id < user2_id for consistency (smaller ID first)
  CHECK (user1_id < user2_id),
  UNIQUE(user1_id, user2_id)
);

-- Create indexes for better performance
CREATE INDEX idx_friends_user1 ON friends(user1_id);
CREATE INDEX idx_friends_user2 ON friends(user2_id);
CREATE INDEX idx_friends_created_at ON friends(created_at);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends (single row structure)
CREATE POLICY "Users can view their own friendships" ON friends
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friendships" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their own friendships" ON friends
  FOR DELETE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Migrate data from backup (deduplicate bidirectional entries)
INSERT INTO friends (user1_id, user2_id, created_at)
SELECT 
  LEAST(user1_id, user2_id) as user1_id,
  GREATEST(user1_id, user2_id) as user2_id,
  MIN(created_at) as created_at
FROM friends_backup
GROUP BY LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)
ON CONFLICT (user1_id, user2_id) DO NOTHING;

-- Update the friend request acceptance function to create single row
CREATE OR REPLACE FUNCTION handle_friend_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Insert single friendship row (ensure user1_id < user2_id)
    INSERT INTO friends (user1_id, user2_id) 
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the backup table
DROP TABLE friends_backup;
