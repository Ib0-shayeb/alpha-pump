-- Add user roles and trainer-client system
-- First add role to profiles table
ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'client' CHECK (role IN ('client', 'trainer'));

-- Create trainer_client_connections table
CREATE TABLE public.trainer_client_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  requested_by TEXT NOT NULL CHECK (requested_by IN ('trainer', 'client')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trainer_id, client_id)
);

-- Create routine recommendations table
CREATE TABLE public.routine_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications/inbox table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('connection_request', 'routine_recommendation', 'connection_accepted')),
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.trainer_client_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for trainer_client_connections
CREATE POLICY "Users can view connections they are part of" 
ON public.trainer_client_connections 
FOR SELECT 
USING (auth.uid() = trainer_id OR auth.uid() = client_id);

CREATE POLICY "Users can create connection requests" 
ON public.trainer_client_connections 
FOR INSERT 
WITH CHECK (auth.uid() = trainer_id OR auth.uid() = client_id);

CREATE POLICY "Users can update connections they are part of" 
ON public.trainer_client_connections 
FOR UPDATE 
USING (auth.uid() = trainer_id OR auth.uid() = client_id);

-- RLS policies for routine_recommendations
CREATE POLICY "Users can view recommendations they are part of" 
ON public.routine_recommendations 
FOR SELECT 
USING (auth.uid() = trainer_id OR auth.uid() = client_id);

CREATE POLICY "Trainers can create recommendations for their clients" 
ON public.routine_recommendations 
FOR INSERT 
WITH CHECK (
  auth.uid() = trainer_id AND 
  EXISTS (
    SELECT 1 FROM trainer_client_connections 
    WHERE trainer_id = auth.uid() 
    AND client_id = routine_recommendations.client_id 
    AND status = 'accepted'
  )
);

CREATE POLICY "Users can update recommendations they are part of" 
ON public.routine_recommendations 
FOR UPDATE 
USING (auth.uid() = trainer_id OR auth.uid() = client_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add triggers for timestamps
CREATE TRIGGER update_trainer_client_connections_updated_at
BEFORE UPDATE ON public.trainer_client_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routine_recommendations_updated_at
BEFORE UPDATE ON public.routine_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_trainer_client_connections_trainer ON trainer_client_connections(trainer_id);
CREATE INDEX idx_trainer_client_connections_client ON trainer_client_connections(client_id);
CREATE INDEX idx_routine_recommendations_trainer ON routine_recommendations(trainer_id);
CREATE INDEX idx_routine_recommendations_client ON routine_recommendations(client_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;