import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Play, Clock, CheckCircle, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { handleWorkoutCompletion } from "@/lib/workoutCompletion";
import { ShareWorkoutDialog } from "@/components/ShareWorkoutDialog";
import { ExerciseAutocomplete } from "@/components/ExerciseAutocomplete";
import { ExerciseDetailsModal } from "@/components/ExerciseDetailsModal";
import { Eye } from "lucide-react";

interface WorkoutSet {
  id?: string;
  set_number: number;
  weight: string;
  reps: string;
  rpe: string;
  completed: boolean;
}

interface WorkoutExercise {
  id?: string;
  name: string;
  exerciseId?: string;
  sets: WorkoutSet[];
  notes: string;
}

const ActiveWorkout = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const routineDay = searchParams.get('routineDay');
  
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime] = useState(new Date());
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [showExerciseDetails, setShowExerciseDetails] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadWorkoutData = async () => {
      if (!user || !sessionId) return;
      
      try {
        // Get session details
        const { data: session, error: sessionError } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('id', sessionId)
          .maybeSingle();

        if (sessionError || !session) throw sessionError;
        setSessionName(session.name);

        // If this is from a routine, load the routine exercises
        if (routineDay) {
          const { data: routineExercises, error: exercisesError } = await supabase
            .from('routine_exercises')
            .select('*')
            .eq('routine_day_id', routineDay)
            .order('order_index');

          if (exercisesError) throw exercisesError;

          // Convert routine exercises to workout format
          const workoutExercises = routineExercises.map(exercise => ({
            name: exercise.exercise_name,
            sets: Array.from({ length: exercise.sets || 3 }, (_, i) => ({
              set_number: i + 1,
              weight: '',
              reps: '',
              rpe: '',
              completed: false
            })),
            notes: exercise.notes || ''
          }));

          setExercises(workoutExercises);
        }
      } catch (error) {
        console.error('Error loading workout:', error);
        toast({
          title: "Error",
          description: "Failed to load workout data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutData();
  }, [user, sessionId, routineDay, toast]);

  const addExercise = () => {
    setExercises([...exercises, {
      name: '',
      exerciseId: undefined,
      sets: [{ set_number: 1, weight: '', reps: '', rpe: '', completed: false }],
      notes: ''
    }]);
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    const newSetNumber = updatedExercises[exerciseIndex].sets.length + 1;
    updatedExercises[exerciseIndex].sets.push({
      set_number: newSetNumber,
      weight: '',
      reps: '',
      rpe: '',
      completed: false
    });
    setExercises(updatedExercises);
  };

  const removeExercise = (exerciseIndex: number) => {
    setExercises(exercises.filter((_, i) => i !== exerciseIndex));
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets = updatedExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    // Renumber the sets
    updatedExercises[exerciseIndex].sets.forEach((set, i) => {
      set.set_number = i + 1;
    });
    setExercises(updatedExercises);
  };

  const updateExercise = (exerciseIndex: number, field: string, value: string) => {
    const updatedExercises = [...exercises];
    (updatedExercises[exerciseIndex] as any)[field] = value;
    setExercises(updatedExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string | boolean) => {
    const updatedExercises = [...exercises];
    (updatedExercises[exerciseIndex].sets[setIndex] as any)[field] = value;
    setExercises(updatedExercises);
  };

  const finishWorkout = async () => {
    if (!user || !sessionId) return;
    
    setSaving(true);
    try {
      // Update session end time
      const { error: sessionError } = await supabase
        .from('workout_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Save exercises and sets
      for (let i = 0; i < exercises.length; i++) {
        const exercise = exercises[i];
        if (!exercise.name.trim()) continue;

        const { data: workoutExercise, error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert({
            session_id: sessionId,
            exercise_name: exercise.name,
            notes: exercise.notes || null,
            order_index: i
          })
          .select()
          .maybeSingle();

        if (exerciseError || !workoutExercise) throw exerciseError;

        // Save sets
        for (const set of exercise.sets) {
          if (set.weight || set.reps) {
            const { error: setError } = await supabase
              .from('workout_sets')
              .insert({
                workout_exercise_id: workoutExercise.id,
                set_number: set.set_number,
                weight: set.weight ? parseFloat(set.weight) : null,
                reps: set.reps ? parseInt(set.reps) : null,
                rpe: set.rpe ? parseInt(set.rpe) : null,
                completed: set.completed
              });

            if (setError) throw setError;
          }
        }
      }

      // Handle flexible plan progression if this is a routine workout
      await handleWorkoutCompletion(sessionId, routineDay || undefined);

      toast({
        title: "Workout Complete!",
        description: "Your workout has been saved successfully."
      });

      navigate('/');
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Loading Workout...">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  const elapsedTime = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);

  return (
    <Layout title={sessionName || 'Active Workout'}>
      <div className="space-y-6">
        {/* Workout Header */}
        <Card className="p-4 bg-gradient-card shadow-card border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{sessionName}</h2>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Clock size={14} className="mr-1" />
                <span>{elapsedTime} minutes</span>
              </div>
            </div>
            <Button
              onClick={finishWorkout}
              disabled={saving || exercises.length === 0}
              className="bg-gradient-primary hover:shadow-primary"
            >
              <CheckCircle size={16} className="mr-2" />
              {saving ? 'Saving...' : 'Finish Workout'}
            </Button>
          </div>
        </Card>

        {/* Exercises */}
        <div className="space-y-4">
          {exercises.map((exercise, exerciseIndex) => (
            <Card key={exerciseIndex} className="p-4 bg-gradient-card shadow-card border-border/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <ExerciseAutocomplete
                      value={exercise.name}
                      onChange={(value) => updateExercise(exerciseIndex, 'name', value)}
                      onSelect={(selectedExercise) => {
                        if (selectedExercise) {
                          updateExercise(exerciseIndex, 'name', selectedExercise.name);
                          // Auto-fill notes with exercise description if empty
                          if (!exercise.notes) {
                            updateExercise(exerciseIndex, 'notes', selectedExercise.description);
                          }
                        }
                      }}
                      onExerciseIdChange={(exerciseId) => {
                        updateExercise(exerciseIndex, 'exerciseId', exerciseId || '');
                      }}
                      placeholder="Search exercises or type custom name..."
                      showDetails={false}
                      className="text-lg font-medium"
                    />
                  </div>
                  <div className="flex space-x-1">
                    {exercise.exerciseId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedExerciseId(exercise.exerciseId!);
                          setShowExerciseDetails(true);
                        }}
                        title="View exercise details"
                      >
                        <Eye size={14} />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExercise(exerciseIndex)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Sets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Sets</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addSet(exerciseIndex)}
                    >
                      <Plus size={12} className="mr-1" />
                      Add Set
                    </Button>
                  </div>

                  <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground px-2">
                    <div>Set</div>
                    <div>Weight</div>
                    <div>Reps</div>
                    <div>RPE</div>
                    <div>Done</div>
                    <div></div>
                  </div>

                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-6 gap-2 p-2 bg-muted/30 rounded items-center">
                      <div className="text-sm text-muted-foreground">#{set.set_number}</div>
                      <Input
                        value={set.weight}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value)}
                        placeholder="kg"
                        className="text-sm"
                        type="number"
                      />
                      <Input
                        value={set.reps}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                        placeholder="reps"
                        className="text-sm"
                        type="number"
                      />
                      <Input
                        value={set.rpe}
                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'rpe', e.target.value)}
                        placeholder="1-10"
                        className="text-sm"
                        type="number"
                        min="1"
                        max="10"
                      />
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={set.completed}
                          onChange={(e) => updateSet(exerciseIndex, setIndex, 'completed', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </div>
                      {exercise.sets.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSet(exerciseIndex, setIndex)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Exercise Notes */}
                <div>
                  <Label className="text-xs">Notes (Optional)</Label>
                  <Textarea
                    value={exercise.notes}
                    onChange={(e) => updateExercise(exerciseIndex, 'notes', e.target.value)}
                    placeholder="Any notes about this exercise..."
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          ))}

          <Button
            onClick={addExercise}
            variant="outline"
            className="w-full py-6 border-dashed"
          >
            <Plus size={16} className="mr-2" />
            Add Exercise
          </Button>
        </div>
      </div>

      {/* Share Workout Dialog */}
      {showShareDialog && completedSessionId && (
        <ShareWorkoutDialog
          isOpen={showShareDialog}
          onClose={() => {
            setShowShareDialog(false);
            navigate('/');
          }}
          workoutSessionId={completedSessionId}
          workoutName={sessionName}
        />
      )}

      {/* Exercise Details Modal */}
      <ExerciseDetailsModal
        exerciseId={selectedExerciseId}
        isOpen={showExerciseDetails}
        onClose={() => {
          setShowExerciseDetails(false);
          setSelectedExerciseId(null);
        }}
      />
    </Layout>
  );
};

export default ActiveWorkout;