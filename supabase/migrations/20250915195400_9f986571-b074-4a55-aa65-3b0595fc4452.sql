-- Remove the workout_schedule table since we'll generate schedules client-side
DROP TABLE IF EXISTS public.workout_schedule;

-- Remove the generate_workout_schedule function as it's no longer needed
DROP FUNCTION IF EXISTS public.generate_workout_schedule(uuid, uuid, uuid, date, plan_type, integer);
DROP FUNCTION IF EXISTS public.generate_workout_schedule(uuid, uuid, uuid, date, integer);

-- Remove the trigger function that was calling generate_workout_schedule
DROP FUNCTION IF EXISTS public.trigger_generate_schedule();

-- Remove the skip_flexible_plan_day function since we'll handle skipping client-side
DROP FUNCTION IF EXISTS public.skip_flexible_plan_day(uuid, uuid, date);