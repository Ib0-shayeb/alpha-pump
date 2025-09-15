-- Create enum for plan types
CREATE TYPE plan_type AS ENUM ('strict', 'flexible');

-- Create table for client routine assignments
CREATE TABLE public.client_routine_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  routine_id UUID NOT NULL,
  plan_type plan_type NOT NULL DEFAULT 'strict',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, routine_id, start_date)
);

-- Create table for workout schedule (tracks what should happen each day)
CREATE TABLE public.workout_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  assignment_id UUID NOT NULL REFERENCES client_routine_assignments(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  routine_day_id UUID REFERENCES routine_days(id),
  is_rest_day BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  was_skipped BOOLEAN NOT NULL DEFAULT false,
  workout_session_id UUID REFERENCES workout_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, scheduled_date, assignment_id)
);

-- Enable RLS
ALTER TABLE public.client_routine_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for client_routine_assignments
CREATE POLICY "Users can view their own assignments" 
ON public.client_routine_assignments 
FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own assignments" 
ON public.client_routine_assignments 
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own assignments" 
ON public.client_routine_assignments 
FOR UPDATE 
USING (auth.uid() = client_id);

CREATE POLICY "Trainers can view their clients' assignments" 
ON public.client_routine_assignments 
FOR SELECT 
USING (
  auth.uid() != client_id AND 
  public.is_accepted_trainer(auth.uid(), client_id)
);

-- Create policies for workout_schedule
CREATE POLICY "Users can view their own schedule" 
ON public.workout_schedule 
FOR SELECT 
USING (auth.uid() = client_id);

CREATE POLICY "Users can create their own schedule" 
ON public.workout_schedule 
FOR INSERT 
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own schedule" 
ON public.workout_schedule 
FOR UPDATE 
USING (auth.uid() = client_id);

CREATE POLICY "Trainers can view their clients' schedule" 
ON public.workout_schedule 
FOR SELECT 
USING (
  auth.uid() != client_id AND 
  public.is_accepted_trainer(auth.uid(), client_id)
);

-- Function to generate workout schedule for a routine assignment
CREATE OR REPLACE FUNCTION public.generate_workout_schedule(
  _assignment_id UUID,
  _client_id UUID,
  _routine_id UUID,
  _start_date DATE,
  _days_to_generate INTEGER DEFAULT 30
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  routine_days_data RECORD;
  schedule_date DATE;
  day_index INTEGER;
  routine_days_count INTEGER;
BEGIN
  -- Get routine days count
  SELECT COUNT(*) INTO routine_days_count
  FROM routine_days
  WHERE routine_id = _routine_id;

  -- If no routine days, exit
  IF routine_days_count = 0 THEN
    RETURN;
  END IF;

  -- Generate schedule for the specified number of days
  schedule_date := _start_date;
  day_index := 0;
  
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
END;
$$;

-- Trigger to auto-generate schedule when assignment is created
CREATE OR REPLACE FUNCTION public.trigger_generate_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.generate_workout_schedule(
    NEW.id,
    NEW.client_id,
    NEW.routine_id,
    NEW.start_date,
    60 -- Generate 60 days ahead
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_schedule_on_assignment
  AFTER INSERT ON client_routine_assignments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_schedule();

-- Add trigger for updated_at
CREATE TRIGGER update_client_routine_assignments_updated_at
BEFORE UPDATE ON public.client_routine_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();