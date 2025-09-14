-- Create workout routines and related tables
CREATE TABLE public.workout_routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false, -- if user has assigned this routine to themselves
  days_per_week INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routine days (e.g., Day 1: Push, Day 2: Pull, etc.)
CREATE TABLE public.routine_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES public.workout_routines(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  name TEXT NOT NULL, -- "Push Day", "Pull Day", etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routine exercises (exercises assigned to specific days)
CREATE TABLE public.routine_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_day_id UUID NOT NULL REFERENCES public.routine_days(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER DEFAULT 3,
  reps TEXT, -- "8-12", "3x5", etc.
  weight_suggestion TEXT, -- "bodyweight", "60kg", etc.
  rest_time_seconds INTEGER,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout sessions (actual workouts performed)
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  routine_id UUID REFERENCES public.workout_routines(id),
  routine_day_id UUID REFERENCES public.routine_days(id),
  name TEXT NOT NULL, -- "Push Day", "Custom Workout", etc.
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout exercises (exercises in a specific workout session)
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout sets (individual sets with weight/reps/rpe)
CREATE TABLE public.workout_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  rpe INTEGER, -- Rate of Perceived Exertion (1-10)
  duration_seconds INTEGER, -- for time-based exercises
  distance NUMERIC, -- for cardio
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_routines
CREATE POLICY "Users can view their own routines and public routines" 
ON public.workout_routines 
FOR SELECT 
USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own routines" 
ON public.workout_routines 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own routines" 
ON public.workout_routines 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own routines" 
ON public.workout_routines 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for routine_days
CREATE POLICY "Users can view routine days if they can view the routine" 
ON public.routine_days 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout_routines wr 
  WHERE wr.id = routine_days.routine_id 
  AND (wr.user_id = auth.uid() OR wr.is_public = true)
));

CREATE POLICY "Users can create routine days for their own routines" 
ON public.routine_days 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_routines wr 
  WHERE wr.id = routine_days.routine_id 
  AND wr.user_id = auth.uid()
));

CREATE POLICY "Users can update routine days for their own routines" 
ON public.routine_days 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.workout_routines wr 
  WHERE wr.id = routine_days.routine_id 
  AND wr.user_id = auth.uid()
));

CREATE POLICY "Users can delete routine days for their own routines" 
ON public.routine_days 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.workout_routines wr 
  WHERE wr.id = routine_days.routine_id 
  AND wr.user_id = auth.uid()
));

-- RLS Policies for routine_exercises
CREATE POLICY "Users can view routine exercises if they can view the routine" 
ON public.routine_exercises 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.routine_days rd
  JOIN public.workout_routines wr ON wr.id = rd.routine_id
  WHERE rd.id = routine_exercises.routine_day_id 
  AND (wr.user_id = auth.uid() OR wr.is_public = true)
));

CREATE POLICY "Users can create routine exercises for their own routines" 
ON public.routine_exercises 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.routine_days rd
  JOIN public.workout_routines wr ON wr.id = rd.routine_id
  WHERE rd.id = routine_exercises.routine_day_id 
  AND wr.user_id = auth.uid()
));

CREATE POLICY "Users can update routine exercises for their own routines" 
ON public.routine_exercises 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.routine_days rd
  JOIN public.workout_routines wr ON wr.id = rd.routine_id
  WHERE rd.id = routine_exercises.routine_day_id 
  AND wr.user_id = auth.uid()
));

CREATE POLICY "Users can delete routine exercises for their own routines" 
ON public.routine_exercises 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.routine_days rd
  JOIN public.workout_routines wr ON wr.id = rd.routine_id
  WHERE rd.id = routine_exercises.routine_day_id 
  AND wr.user_id = auth.uid()
));

-- RLS Policies for workout_sessions
CREATE POLICY "Users can view their own workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own workout sessions" 
ON public.workout_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workout sessions" 
ON public.workout_sessions 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workout sessions" 
ON public.workout_sessions 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for workout_exercises
CREATE POLICY "Users can view workout exercises from their own sessions" 
ON public.workout_exercises 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout_sessions ws 
  WHERE ws.id = workout_exercises.session_id 
  AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can create workout exercises for their own sessions" 
ON public.workout_exercises 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_sessions ws 
  WHERE ws.id = workout_exercises.session_id 
  AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can update workout exercises from their own sessions" 
ON public.workout_exercises 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.workout_sessions ws 
  WHERE ws.id = workout_exercises.session_id 
  AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can delete workout exercises from their own sessions" 
ON public.workout_exercises 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.workout_sessions ws 
  WHERE ws.id = workout_exercises.session_id 
  AND ws.user_id = auth.uid()
));

-- RLS Policies for workout_sets
CREATE POLICY "Users can view workout sets from their own sessions" 
ON public.workout_sets 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we
  JOIN public.workout_sessions ws ON ws.id = we.session_id
  WHERE we.id = workout_sets.workout_exercise_id 
  AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can create workout sets for their own sessions" 
ON public.workout_sets 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_exercises we
  JOIN public.workout_sessions ws ON ws.id = we.session_id
  WHERE we.id = workout_sets.workout_exercise_id 
  AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can update workout sets from their own sessions" 
ON public.workout_sets 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we
  JOIN public.workout_sessions ws ON ws.id = we.session_id
  WHERE we.id = workout_sets.workout_exercise_id 
  AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can delete workout sets from their own sessions" 
ON public.workout_sets 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we
  JOIN public.workout_sessions ws ON ws.id = we.session_id
  WHERE we.id = workout_sets.workout_exercise_id 
  AND ws.user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_workout_routines_updated_at
  BEFORE UPDATE ON public.workout_routines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_workout_routines_user_id ON public.workout_routines(user_id);
CREATE INDEX idx_workout_routines_is_public ON public.workout_routines(is_public);
CREATE INDEX idx_workout_routines_is_active ON public.workout_routines(is_active, user_id);
CREATE INDEX idx_routine_days_routine_id ON public.routine_days(routine_id);
CREATE INDEX idx_routine_exercises_routine_day_id ON public.routine_exercises(routine_day_id);
CREATE INDEX idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_created_at ON public.workout_sessions(created_at);
CREATE INDEX idx_workout_exercises_session_id ON public.workout_exercises(session_id);
CREATE INDEX idx_workout_sets_workout_exercise_id ON public.workout_sets(workout_exercise_id);