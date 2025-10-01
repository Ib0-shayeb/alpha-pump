-- Fix profile access for friend requests
-- This ensures that users can view profiles of people who sent them friend requests

-- Drop the conflicting policies first
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Accepted trainers can view client profiles with privacy controls" ON public.profiles;

-- Create a comprehensive policy that allows:
-- 1. Users to view their own profile
-- 2. Users to view profiles of people who sent them friend requests
-- 3. Users to view profiles of people they sent friend requests to
-- 4. Accepted trainers to view client profiles (keeping existing functionality)

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles of friend request participants" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND (
    -- User can view profiles of people who sent them friend requests
    EXISTS (
      SELECT 1 FROM public.friend_requests 
      WHERE sender_id = profiles.user_id 
      AND receiver_id = auth.uid() 
      AND status = 'pending'
    ) OR
    -- User can view profiles of people they sent friend requests to
    EXISTS (
      SELECT 1 FROM public.friend_requests 
      WHERE receiver_id = profiles.user_id 
      AND sender_id = auth.uid() 
      AND status = 'pending'
    ) OR
    -- User can view profiles of their friends
    EXISTS (
      SELECT 1 FROM public.friends 
      WHERE (user1_id = auth.uid() AND user2_id = profiles.user_id) 
      OR (user2_id = auth.uid() AND user1_id = profiles.user_id)
    ) OR
    -- User can view profiles of people they follow
    EXISTS (
      SELECT 1 FROM public.user_follows 
      WHERE follower_id = auth.uid() 
      AND following_id = profiles.user_id
    ) OR
    -- User can view profiles of people who follow them
    EXISTS (
      SELECT 1 FROM public.user_follows 
      WHERE following_id = auth.uid() 
      AND follower_id = profiles.user_id
    )
  )
);

-- Keep the trainer policy for existing functionality
CREATE POLICY "Accepted trainers can view client profiles with privacy controls" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND 
  public.is_accepted_trainer(auth.uid(), user_id)
);

-- Create a policy for public profiles (users who have set their profile as public)
-- This would require adding a public_profile boolean field to the profiles table
-- For now, we'll comment this out
-- CREATE POLICY "Public profiles are viewable by everyone" 
-- ON public.profiles 
-- FOR SELECT 
-- USING (public_profile = true);
