-- Update the generate_workout_schedule function to handle strict and flexible plans differently
CREATE OR REPLACE FUNCTION public.generate_workout_schedule(_assignment_id uuid, _client_id uuid, _routine_id uuid, _start_date date, _plan_type plan_type DEFAULT 'strict'::plan_type, _days_to_generate integer DEFAULT 30)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  routine_days_data RECORD;
  schedule_date DATE;
  day_index INTEGER;
  week_day INTEGER;
  routine_days_count INTEGER;
  days_per_week INTEGER;
BEGIN
  -- Get routine info
  SELECT COUNT(*), MAX(r.days_per_week) INTO routine_days_count, days_per_week
  FROM routine_days rd
  JOIN workout_routines r ON r.id = rd.routine_id
  WHERE rd.routine_id = _routine_id
  GROUP BY r.id;

  -- If no routine days, exit
  IF routine_days_count = 0 THEN
    RETURN;
  END IF;

  schedule_date := _start_date;
  day_index := 0;
  
  IF _plan_type = 'strict' THEN
    -- Strict plan: Weekly schedule with rest days
    FOR i IN 0.._days_to_generate-1 LOOP
      week_day := EXTRACT(DOW FROM schedule_date); -- 0=Sunday, 1=Monday, etc.
      
      -- Check if this day should have a workout based on days_per_week
      IF (week_day BETWEEN 1 AND days_per_week) THEN
        -- Get the routine day for this day of the week
        SELECT * INTO routine_days_data
        FROM routine_days
        WHERE routine_id = _routine_id
        ORDER BY day_number
        LIMIT 1 OFFSET ((week_day - 1) % routine_days_count);
        
        -- Insert scheduled workout day
        INSERT INTO workout_schedule (
          client_id,
          assignment_id,
          scheduled_date,
          routine_day_id,
          is_rest_day
        ) VALUES (
          _client_id,
          _assignment_id,
          schedule_date,
          routine_days_data.id,
          false
        ) ON CONFLICT (client_id, scheduled_date, assignment_id) DO NOTHING;
      ELSE
        -- Rest day
        INSERT INTO workout_schedule (
          client_id,
          assignment_id,
          scheduled_date,
          routine_day_id,
          is_rest_day
        ) VALUES (
          _client_id,
          _assignment_id,
          schedule_date,
          NULL,
          true
        ) ON CONFLICT (client_id, scheduled_date, assignment_id) DO NOTHING;
      END IF;
      
      schedule_date := schedule_date + INTERVAL '1 day';
    END LOOP;
  ELSE
    -- Flexible plan: Continuous cycling through routine days (existing behavior)
    FOR i IN 0.._days_to_generate-1 LOOP
      -- Get the routine day for this cycle position
      SELECT * INTO routine_days_data
      FROM routine_days
      WHERE routine_id = _routine_id
      ORDER BY day_number
      LIMIT 1 OFFSET (day_index % routine_days_count);
      
      -- Insert scheduled workout day
      INSERT INTO workout_schedule (
        client_id,
        assignment_id,
        scheduled_date,
        routine_day_id,
        is_rest_day
      ) VALUES (
        _client_id,
        _assignment_id,
        schedule_date,
        routine_days_data.id,
        false
      ) ON CONFLICT (client_id, scheduled_date, assignment_id) DO NOTHING;
      
      schedule_date := schedule_date + INTERVAL '1 day';
      day_index := day_index + 1;
    END LOOP;
  END IF;
END;
$function$;

-- Update the trigger function to pass the plan type
CREATE OR REPLACE FUNCTION public.trigger_generate_schedule()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.generate_workout_schedule(
    NEW.id,
    NEW.client_id,
    NEW.routine_id,
    NEW.start_date,
    NEW.plan_type,
    60 -- Generate 60 days ahead
  );
  RETURN NEW;
END;
$function$;