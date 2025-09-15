-- Clear existing schedule for active assignments and regenerate with proper plan type
DELETE FROM workout_schedule 
WHERE assignment_id IN (
  SELECT id FROM client_routine_assignments WHERE is_active = true
);

-- Regenerate schedule for active assignments using the updated function
DO $$
DECLARE
  assignment_record RECORD;
BEGIN
  FOR assignment_record IN 
    SELECT id, client_id, routine_id, start_date, plan_type 
    FROM client_routine_assignments 
    WHERE is_active = true
  LOOP
    PERFORM public.generate_workout_schedule(
      assignment_record.id,
      assignment_record.client_id,
      assignment_record.routine_id,
      assignment_record.start_date,
      assignment_record.plan_type,
      60 -- Generate 60 days ahead
    );
  END LOOP;
END $$;