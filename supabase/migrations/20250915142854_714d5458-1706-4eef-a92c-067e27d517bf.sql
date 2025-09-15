-- Add trainer-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),
ADD COLUMN IF NOT EXISTS years_experience INTEGER CHECK (years_experience >= 0),
ADD COLUMN IF NOT EXISTS specializations TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[];