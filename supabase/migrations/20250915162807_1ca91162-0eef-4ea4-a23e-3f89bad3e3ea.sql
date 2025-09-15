-- Allow clients to view basic trainer profile information
-- This is needed for routine recommendations and connection requests
CREATE POLICY "Clients can view basic trainer info for connections and recommendations" 
ON profiles 
FOR SELECT 
USING (
  -- Allow viewing trainer profiles if there's a connection or recommendation
  (auth.uid() <> user_id) 
  AND (role = 'trainer')
  AND (
    -- If there's an accepted connection
    EXISTS (
      SELECT 1 FROM trainer_client_connections 
      WHERE trainer_id = user_id 
        AND client_id = auth.uid() 
        AND status = 'accepted'
    )
    -- Or if there's a pending connection request
    OR EXISTS (
      SELECT 1 FROM trainer_client_connections 
      WHERE trainer_id = user_id 
        AND client_id = auth.uid() 
        AND status = 'pending'
    )
    -- Or if there's a routine recommendation
    OR EXISTS (
      SELECT 1 FROM routine_recommendations 
      WHERE trainer_id = user_id 
        AND client_id = auth.uid()
    )
  )
);