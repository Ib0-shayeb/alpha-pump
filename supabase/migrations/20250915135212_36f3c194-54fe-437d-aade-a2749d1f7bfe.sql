-- Add plan_type column to routine_recommendations
ALTER TABLE public.routine_recommendations 
ADD COLUMN plan_type plan_type DEFAULT 'strict';

-- Function to handle flexible plan day skipping
CREATE OR REPLACE FUNCTION public.skip_flexible_plan_day(
  _client_id UUID,
  _assignment_id UUID,
  _skip_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment_record RECORD;
  days_to_shift INTEGER;
BEGIN
  -- Get assignment details
  SELECT * INTO assignment_record
  FROM client_routine_assignments
  WHERE id = _assignment_id AND client_id = _client_id AND plan_type = 'flexible';
  
  -- Only allow skipping for flexible plans
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found or not a flexible plan';
  END IF;
  
  -- Mark the current day as skipped and rest day
  UPDATE workout_schedule 
  SET was_skipped = true, is_rest_day = true, routine_day_id = NULL
  WHERE client_id = _client_id 
    AND assignment_id = _assignment_id 
    AND scheduled_date = _skip_date;
  
  -- Shift all future days forward by 1 day for this assignment
  UPDATE workout_schedule 
  SET scheduled_date = scheduled_date + INTERVAL '1 day'
  WHERE client_id = _client_id 
    AND assignment_id = _assignment_id 
    AND scheduled_date > _skip_date
    AND NOT is_completed;
    
  -- Generate one additional day at the end to maintain schedule length
  INSERT INTO workout_schedule (
    client_id,
    assignment_id,
    scheduled_date,
    routine_day_id,
    is_rest_day
  )
  SELECT 
    _client_id,
    _assignment_id,
    (SELECT MAX(scheduled_date) + INTERVAL '1 day' FROM workout_schedule WHERE assignment_id = _assignment_id),
    rd.id,
    false
  FROM routine_days rd
  WHERE rd.routine_id = assignment_record.routine_id
  ORDER BY rd.day_number
  LIMIT 1;
END;
$$;