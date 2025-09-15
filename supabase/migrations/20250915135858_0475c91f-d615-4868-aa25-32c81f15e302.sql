-- Add foreign key constraint between client_routine_assignments and workout_routines
ALTER TABLE public.client_routine_assignments 
ADD CONSTRAINT fk_client_routine_assignments_routine 
FOREIGN KEY (routine_id) REFERENCES public.workout_routines(id) ON DELETE CASCADE;