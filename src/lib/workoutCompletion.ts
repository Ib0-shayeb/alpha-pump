import { supabase } from "@/integrations/supabase/client";

/**
 * Increments the current_day_index for flexible plan assignments when a workout is completed
 * @param assignmentId - The ID of the assignment to update
 * @param routineDaysCount - The total number of routine days (for wrapping logic)
 */
export const incrementFlexiblePlanIndex = async (assignmentId: string, routineDaysCount: number) => {
  try {
    // Get current assignment to check plan type
    const { data: assignment, error: fetchError } = await supabase
      .from('client_routine_assignments')
      .select('plan_type')
      .eq('id', assignmentId)
      .single();

    if (fetchError) throw fetchError;

    // Only increment for flexible plans - for now, we'll just log this
    if (assignment?.plan_type !== 'flexible') return;

    console.log(`Flexible plan progression not implemented yet for assignment ${assignmentId}`);
  } catch (error) {
    console.error('Error incrementing flexible plan index:', error);
    throw error;
  }
};

/**
 * Handles the completion of a routine workout, including flexible plan progression
 * @param sessionId - The ID of the completed workout session
 * @param routineDayId - The routine day ID (optional, for routine workouts)
 */
export const handleWorkoutCompletion = async (sessionId: string, routineDayId?: string) => {
  if (!routineDayId) {
    // Not a routine workout, no progression needed
    return;
  }

  try {
    // Get the session details to find the routine_id
    const { data: session, error: sessionFetchError } = await supabase
      .from('workout_sessions')
      .select('routine_id')
      .eq('id', sessionId)
      .single();

    if (sessionFetchError) throw sessionFetchError;

    if (!session?.routine_id) {
      console.warn('Session missing routine_id, skipping progression');
      return;
    }

    // Get the routine days count
    const { data: routineDays, error: routineDaysError } = await supabase
      .from('routine_days')
      .select('id')
      .eq('routine_id', session.routine_id);

    if (routineDaysError) throw routineDaysError;

    if (!routineDays || routineDays.length === 0) {
      console.warn('No routine days found for routine, skipping progression');
      return;
    }

    console.log('Workout completion handled - progression logic needs to be implemented');
  } catch (error) {
    console.error('Error handling workout completion:', error);
    // Don't throw here - we don't want to fail the entire workout save if progression fails
  }
};

