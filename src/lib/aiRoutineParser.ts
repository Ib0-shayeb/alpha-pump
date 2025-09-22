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

    // Split by day headers and filter out empty sections
    const sections = routineText.split(/(?=\*\*Day \d+)/i).filter(section => section.trim());
    console.log('Split sections:', sections);
    
    const days: AIWorkoutDay[] = [];
    
    sections.forEach((section, index) => {
      // Skip the first section if it's just the workout name
      if (!section.includes('**Day ')) return;
      
      console.log(`Processing section ${index}:`, section);
      
      // Extract day name
      const dayHeaderMatch = section.match(/\*\*Day (\d+)[^*]*\*\*/i);
      const dayNumber = dayHeaderMatch ? parseInt(dayHeaderMatch[1]) : index + 1;
      const dayName = `Day ${dayNumber}`;
      
      const exercises: AIExercise[] = [];
      
      // Find all exercises with the proper format
      const exerciseMatches = section.match(/\*\s*\*\*Exercise:\*\*[^*]+?\*\*Rest:\*\*[^*\n]+/gi);
      console.log(`Exercise matches for ${dayName}:`, exerciseMatches?.length || 0);
      
      if (exerciseMatches) {
        exerciseMatches.forEach((exerciseMatch, exIndex) => {
          // More flexible parsing
          const nameMatch = exerciseMatch.match(/\*\*Exercise:\*\*\s*([^|]+)/i);
          const setsMatch = exerciseMatch.match(/\*\*Sets:\*\*\s*(\d+)/i);
          const repsMatch = exerciseMatch.match(/\*\*Reps:\*\*\s*([^|]+)/i);
          const restMatch = exerciseMatch.match(/\*\*Rest:\*\*\s*([^*\n]+)/i);
          
          if (nameMatch && setsMatch && repsMatch && restMatch) {
            const exercise = {
              name: nameMatch[1].trim(),
              sets: parseInt(setsMatch[1].trim()),
              reps: repsMatch[1].trim(),
              rest: restMatch[1].trim(),
              notes: "Focus on proper form"
            };
            exercises.push(exercise);
            console.log(`Parsed exercise ${exIndex + 1}:`, exercise);
          } else {
            console.log('Failed to parse exercise:', exerciseMatch);
            console.log('Matches:', { nameMatch, setsMatch, repsMatch, restMatch });
          }
        });
      } else {
        console.log('No properly formatted exercises found in section:', section);
        
        // Try to find exercises without the full format (like cardio)
        const simpleExercises = section.match(/\*\s*\*\*Exercise:\*\*[^*\n]+/gi);
        if (simpleExercises) {
          console.log('Found simple exercises:', simpleExercises);
          simpleExercises.forEach(ex => {
            const nameMatch = ex.match(/\*\*Exercise:\*\*\s*(.+)/i);
            if (nameMatch) {
              exercises.push({
                name: nameMatch[1].trim(),
                sets: 1,
                reps: "As prescribed",
                rest: "As needed",
                notes: "Follow exercise description"
              });
            }
          });
        }
      }
      
      if (exercises.length > 0) {
        const dayData = {
          name: dayName,
          exercises
        };
        days.push(dayData);
        console.log(`Created ${dayName}:`, dayData);
      }
    });

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