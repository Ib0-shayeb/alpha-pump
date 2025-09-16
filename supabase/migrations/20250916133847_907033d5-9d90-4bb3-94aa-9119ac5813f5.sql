-- Create AI conversations table
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI messages table
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_conversations
CREATE POLICY "Users can view their own conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.ai_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.ai_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for ai_messages
CREATE POLICY "Users can view messages from their conversations" 
ON public.ai_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ai_conversations 
  WHERE ai_conversations.id = ai_messages.conversation_id 
  AND ai_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations" 
ON public.ai_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ai_conversations 
  WHERE ai_conversations.id = ai_messages.conversation_id 
  AND ai_conversations.user_id = auth.uid()
));

-- Create AI trainer profile
INSERT INTO public.profiles (
  user_id, 
  display_name, 
  username, 
  role, 
  bio, 
  specializations,
  certifications,
  rating,
  years_experience
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'AI Fitness Coach',
  'ai_trainer',
  'trainer',
  'Your personal AI fitness coach powered by advanced AI. I provide personalized workout plans, nutrition advice, and fitness guidance based on your goals and progress.',
  ARRAY['Strength Training', 'Weight Loss', 'Muscle Building', 'Nutrition', 'Recovery', 'Form Correction'],
  ARRAY['AI-Certified Personal Trainer', 'Nutrition Specialist', 'Exercise Physiologist'],
  5.0,
  10
) ON CONFLICT (user_id) DO NOTHING;

-- Create auto-connection for all users to AI trainer
CREATE OR REPLACE FUNCTION public.connect_user_to_ai_trainer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Connect new user to AI trainer automatically
  INSERT INTO public.trainer_client_connections (
    trainer_id,
    client_id, 
    status,
    requested_by
  ) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NEW.user_id,
    'accepted',
    'system'
  ) ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-connect users to AI trainer
CREATE TRIGGER connect_to_ai_trainer
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.connect_user_to_ai_trainer();

-- Update timestamp trigger for conversations
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();