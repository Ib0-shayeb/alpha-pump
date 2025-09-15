-- Update RLS policy to allow clients to view recommended routines
DROP POLICY IF EXISTS "Users can view their own routines and public routines" ON workout_routines;

CREATE POLICY "Users can view their own routines, public routines, and recommended routines" 
ON workout_routines 
FOR SELECT 
USING (
  (user_id = auth.uid()) 
  OR (is_public = true)
  OR EXISTS (
    SELECT 1 
    FROM routine_recommendations rr 
    WHERE rr.routine_id = workout_routines.id 
      AND rr.client_id = auth.uid()
      AND rr.status = 'pending'
  )
);