-- Add current_day_index column to client_routine_assignments for flexible plans
ALTER TABLE public.client_routine_assignments 
ADD COLUMN current_day_index INTEGER DEFAULT 0;

-- Add comment explaining the column
COMMENT ON COLUMN public.client_routine_assignments.current_day_index IS 'Current day index for flexible plans. Tracks which routine day the client is currently on (0-based index). Increments when workout is completed and wraps around when reaching routine days count.';

