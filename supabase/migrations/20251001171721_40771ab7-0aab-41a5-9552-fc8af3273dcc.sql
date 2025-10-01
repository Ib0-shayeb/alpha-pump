-- Add parent_comment_id column to post_comments table for nested replies
ALTER TABLE post_comments 
ADD COLUMN parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;

-- Create index for better query performance on nested comments
CREATE INDEX idx_post_comments_parent_id ON post_comments(parent_comment_id);

-- Add RLS policy for viewing nested comments (same as parent comments)
-- No new policy needed as existing policies already cover this