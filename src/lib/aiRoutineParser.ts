import { supabase } from "@/integrations/supabase/client";

export interface AIWorkoutRoutine {
  name: string;
  description?: string;
  daysPerWeek: number;
  days: AIWorkoutDay[];
}

export interface AIWorkoutDay {
  name: string;
  exercises: AIExercise[];
}

export interface AIExercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest?: string;
  notes?: string;
}

export const parseWorkoutRoutineFromAI = (routineText: string): AIWorkoutRoutine | null => {
  try {
    console.log('Parsing routine text:', routineText);
    
    // Parse the routine name
    const nameMatch = routineText.match(/\*\*Workout Name:\*\*\s*(.+)/i);
    const name = nameMatch ? nameMatch[1].trim() : "AI Generated Routine";
    console.log('Parsed name:', name);

    // Find all day sections - made more flexible
    const dayMatches = routineText.match(/\*\*Day \d+[:\s]*.*?\*\*[\s\S]*?(?=\*\*Day \d+|\*\*Home Day|$)/gi);
    console.log('Day matches found:', dayMatches?.length || 0, dayMatches);
    
    const days: AIWorkoutDay[] = [];
    
    if (dayMatches) {
      dayMatches.forEach((daySection, index) => {
        console.log(`Processing day section ${index + 1}:`, daySection);
        const exercises: AIExercise[] = [];
        
        // Find all exercises in this day - made more flexible
        const exerciseMatches = daySection.match(/\*\s*\*\*Exercise:\*\*\s*([^|]+)\s*\|\s*\*\*Sets:\*\*\s*(\d+)\s*\|\s*\*\*Reps:\*\*\s*([^|]+)\s*\|\s*\*\*Rest:\*\*\s*([^*\n]+)/gi);
        console.log(`Exercise matches for day ${index + 1}:`, exerciseMatches?.length || 0);
        
        if (exerciseMatches) {
          exerciseMatches.forEach((exerciseMatch, exIndex) => {
            const parts = exerciseMatch.match(/\*\s*\*\*Exercise:\*\*\s*([^|]+)\s*\|\s*\*\*Sets:\*\*\s*(\d+)\s*\|\s*\*\*Reps:\*\*\s*([^|]+)\s*\|\s*\*\*Rest:\*\*\s*([^*\n]+)/i);
            
            if (parts) {
              const exercise = {
                name: parts[1].trim(),
                sets: parseInt(parts[2].trim()),
                reps: parts[3].trim(),
                rest: parts[4].trim(),
                notes: "Focus on proper form"
              };
              exercises.push(exercise);
              console.log(`Parsed exercise ${exIndex + 1}:`, exercise);
            } else {
              console.log('Failed to parse exercise:', exerciseMatch);
            }
          });
        } else {
          console.log('No exercises found in day section:', daySection);
        }
        
        const dayData = {
          name: `Day ${index + 1}`,
          exercises
        };
        days.push(dayData);
        console.log(`Created day ${index + 1}:`, dayData);
      });
    } else {
      console.log('No day sections found in routine text');
    }

    const result = {
      name,
      description: "AI generated workout routine tailored to your fitness goals",
      daysPerWeek: days.length,
      days
    };
    
    console.log('Final parsed routine:', result);
    return result;
  } catch (error) {
    console.error('Error parsing workout routine:', error);
    return null;
  }
};

export const createWorkoutRoutineInDatabase = async (routine: AIWorkoutRoutine, userId: string): Promise<string | null> => {
  try {
    // Create the main routine
    const { data: routineData, error: routineError } = await supabase
      .from('workout_routines')
      .insert({
        name: routine.name,
        description: routine.description,
        days_per_week: routine.daysPerWeek,
        user_id: userId,
        is_public: false
      })
      .select()
      .single();

    if (routineError) throw routineError;

    // Create routine days and exercises
    for (let dayIndex = 0; dayIndex < routine.days.length; dayIndex++) {
      const day = routine.days[dayIndex];
      
      // Create routine day
      const { data: dayData, error: dayError } = await supabase
        .from('routine_days')
        .insert({
          routine_id: routineData.id,
          day_number: dayIndex + 1,
          name: day.name,
          description: `${day.exercises.length} exercises`
        })
        .select()
        .single();

      if (dayError) throw dayError;

      // Create exercises for this day
      for (let exerciseIndex = 0; exerciseIndex < day.exercises.length; exerciseIndex++) {
        const exercise = day.exercises[exerciseIndex];
        
        const { error: exerciseError } = await supabase
          .from('routine_exercises')
          .insert({
            routine_day_id: dayData.id,
            exercise_name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            weight_suggestion: exercise.weight,
            notes: exercise.notes || `Rest: ${exercise.rest || '2-3 min'}`,
            order_index: exerciseIndex
          });

        if (exerciseError) throw exerciseError;
      }
    }

    return routineData.id;
  } catch (error) {
    console.error('Error creating workout routine:', error);
    throw error;
  }
};