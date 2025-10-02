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
 * Checks for personal records in workout exercises
 * @param userId - The user ID
 * @param sessionId - The workout session ID
 */
export const checkPersonalRecords = async (userId: string, sessionId: string) => {
  try {
    // Get all exercises from this workout session
    const { data: exercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select('exercise_name, weight, reps')
      .eq('workout_session_id', sessionId)
      .not('weight', 'is', null);

    if (exercisesError) throw exercisesError;

    if (!exercises || exercises.length === 0) {
      return;
    }

    // Check each exercise for PRs
    for (const exercise of exercises) {
      if (exercise.weight && exercise.exercise_name) {
        const { data: isNewPR, error: prError } = await supabase.rpc('check_and_insert_pr', {
          p_user_id: userId,
          p_exercise_name: exercise.exercise_name,
          p_weight: exercise.weight,
          p_reps: exercise.reps,
          p_workout_session_id: sessionId
        });

        if (prError) {
          console.error(`Error checking PR for ${exercise.exercise_name}:`, prError);
        } else if (isNewPR) {
          console.log(`🎉 New PR: ${exercise.exercise_name} - ${exercise.weight}kg`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking personal records:', error);
  }
};

/**
 * Handles the completion of a routine workout, including flexible plan progression and PR checking
 * @param sessionId - The ID of the completed workout session
 * @param routineDayId - The routine day ID (optional, for routine workouts)
 * @param userId - The user ID (for PR checking)
 */
export const handleWorkoutCompletion = async (sessionId: string, routineDayId?: string, userId?: string) => {
  try {
    // Check for personal records first
    if (userId) {
      await checkPersonalRecords(userId, sessionId);
    }

    if (!routineDayId) {
      // Not a routine workout, no progression needed
      return;
    }

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

