-- Add privacy control columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN trainer_can_see_weight boolean DEFAULT true,
ADD COLUMN trainer_can_see_height boolean DEFAULT true,
ADD COLUMN trainer_can_see_personal_info boolean DEFAULT true,
ADD COLUMN trainer_can_see_workout_history boolean DEFAULT true;

-- Create a function to check if user is an accepted trainer of a client
CREATE OR REPLACE FUNCTION public.is_accepted_trainer(_trainer_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM trainer_client_connections
    WHERE trainer_id = _trainer_id 
      AND client_id = _client_id 
      AND status = 'accepted'
  )
$$;

-- Update profiles RLS policy to allow trainers to see their accepted clients' data
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Accepted trainers can view client profiles with privacy controls" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() != user_id AND 
  public.is_accepted_trainer(auth.uid(), user_id)
);

-- Update workout sessions RLS to allow trainers to see their clients' workout data
CREATE POLICY "Trainers can view their clients' workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (
  auth.uid() != user_id AND 
  public.is_accepted_trainer(auth.uid(), user_id) AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = workout_sessions.user_id 
      AND trainer_can_see_workout_history = true
  )
);

-- Update workout exercises RLS to allow trainers to see their clients' workout data
CREATE POLICY "Trainers can view their clients' workout exercises" 
ON public.workout_exercises 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM workout_sessions ws
    JOIN profiles p ON p.user_id = ws.user_id
    WHERE ws.id = workout_exercises.session_id 
      AND public.is_accepted_trainer(auth.uid(), ws.user_id)
      AND p.trainer_can_see_workout_history = true
      AND auth.uid() != ws.user_id
  )
);

-- Update workout sets RLS to allow trainers to see their clients' workout data
CREATE POLICY "Trainers can view their clients' workout sets" 
ON public.workout_sets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    JOIN profiles p ON p.user_id = ws.user_id
    WHERE we.id = workout_sets.workout_exercise_id 
      AND public.is_accepted_trainer(auth.uid(), ws.user_id)
      AND p.trainer_can_see_workout_history = true
      AND auth.uid() != ws.user_id
  )
);