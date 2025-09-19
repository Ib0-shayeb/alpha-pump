import { supabase } from "@/integrations/supabase/client";

/**
 * Increments the current_day_index for flexible plan assignments when a workout is completed
 * @param assignmentId - The ID of the assignment to update
 * @param routineDaysCount - The total number of routine days (for wrapping logic)
 */
export const incrementFlexiblePlanIndex = async (assignmentId: string, routineDaysCount: number) => {
  try {
    // Get current assignment to update the index
    const { data: assignment, error: fetchError } = await supabase
      .from('client_routine_assignments')
      .select('current_day_index, plan_type')
      .eq('id', assignmentId)
      .single();

    if (fetchError) throw fetchError;

    // Only increment for flexible plans
    if (assignment?.plan_type !== 'flexible') return;

    // Calculate new index (increment and wrap around)
    const currentIndex = assignment.current_day_index || 0;
    const newIndex = (currentIndex + 1) % routineDaysCount;

    // Update the assignment with new index
    const { error: updateError } = await supabase
      .from('client_routine_assignments')
      .update({ current_day_index: newIndex })
      .eq('id', assignmentId);

    if (updateError) throw updateError;

    console.log(`Updated flexible plan index for assignment ${assignmentId}: ${currentIndex} -> ${newIndex}`);
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
    // Get the session details to find the assignment_id
    const { data: session, error: sessionFetchError } = await supabase
      .from('workout_sessions')
      .select('assignment_id, routine_id')
      .eq('id', sessionId)
      .single();

    if (sessionFetchError) throw sessionFetchError;

    if (!session?.assignment_id || !session?.routine_id) {
      console.warn('Session missing assignment_id or routine_id, skipping progression');
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

    // Increment the flexible plan index
    await incrementFlexiblePlanIndex(session.assignment_id, routineDays.length);
  } catch (error) {
    console.error('Error handling workout completion:', error);
    // Don't throw here - we don't want to fail the entire workout save if progression fails
  }
};

