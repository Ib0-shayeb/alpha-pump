-- Add assignment_id column to workout_sessions to link workouts to specific assignments
ALTER TABLE public.workout_sessions 
ADD COLUMN assignment_id UUID REFERENCES public.client_routine_assignments(id);

-- Add comment explaining the column
COMMENT ON COLUMN public.workout_sessions.assignment_id IS 'Links workout session to specific routine assignment. Needed for flexible plans to track which assignment the workout belongs to.';

