-- Drop is_active from workout_routines; activation is tracked per-client in client_routine_assignments

-- Drop index if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'idx_workout_routines_is_active'
      AND n.nspname = 'public'
  ) THEN
    EXECUTE 'DROP INDEX public.idx_workout_routines_is_active';
  END IF;
END$$;

-- Drop column if it exists
ALTER TABLE public.workout_routines
DROP COLUMN IF EXISTS is_active;

