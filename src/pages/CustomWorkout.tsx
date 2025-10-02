import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Play, ArrowLeft, Trash2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ExerciseAutocomplete } from "@/components/ExerciseAutocomplete";

interface Exercise {
  id: string;
  name: string;
  notes: string;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  completed: boolean;
}

const CustomWorkout = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseNotes, setNewExerciseNotes] = useState("");
  
  const { user } = useAuth();
  const { toast } = useToast();

  const startWorkout = async () => {
    if (!user) return;
    
    try {
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          name: 'Custom Workout',
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setSessionId(session.id);
      setWorkoutStarted(true);
      
      toast({
        title: "Workout Started!",
        description: "Add exercises to begin tracking your sets"
      });
    } catch (error) {
      console.error('Error starting workout:', error);
      toast({
        title: "Error",
        description: "Failed to start workout",
        variant: "destructive"
      });
    }
  };

  const finishWorkout = async () => {
    if (!sessionId) return;
    
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({
        title: "Workout Complete!",
        description: "Great job on your workout!"
      });
      
      // Reset state
      setWorkoutStarted(false);
      setSessionId(null);
      setExercises([]);
    } catch (error) {
      console.error('Error finishing workout:', error);
      toast({
        title: "Error",
        description: "Failed to finish workout",
        variant: "destructive"
      });
    }
  };

  const addExercise = async () => {
    if (!sessionId || !newExerciseName.trim()) return;
    
    try {
      const { data: exercise, error } = await supabase
        .from('workout_exercises')
        .insert({
          session_id: sessionId,
          exercise_name: newExerciseName,
          notes: newExerciseNotes || null,
          order_index: exercises.length
        })
        .select()
        .single();

      if (error) throw error;
      
      const newExercise: Exercise = {
        id: exercise.id,
        name: exercise.exercise_name,
        notes: exercise.notes || "",
        sets: []
      };
      
      setExercises([...exercises, newExercise]);
      setNewExerciseName("");
      setNewExerciseNotes("");
      setShowAddExercise(false);
      
      toast({
        title: "Exercise Added",
        description: `${exercise.exercise_name} added to your workout`
      });
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast({
        title: "Error",
        description: "Failed to add exercise",
        variant: "destructive"
      });
    }
  };

  const addSet = async (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;
    
    try {
      const { data: set, error } = await supabase
        .from('workout_sets')
        .insert({
          workout_exercise_id: exerciseId,
          set_number: exercise.sets.length + 1,
          completed: false
        })
        .select()
        .single();

      if (error) throw error;
      
      const newSet: WorkoutSet = {
        id: set.id,
        set_number: set.set_number,
        weight: null,
        reps: null,
        rpe: null,
        completed: false
      };
      
      setExercises(exercises.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex
      ));
    } catch (error) {
      console.error('Error adding set:', error);
      toast({
        title: "Error",
        description: "Failed to add set",
        variant: "destructive"
      });
    }
  };

  const updateSet = async (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    try {
      const { error } = await supabase
        .from('workout_sets')
        .update({
          weight: updates.weight,
          reps: updates.reps,
          rpe: updates.rpe,
          completed: updates.completed
        })
        .eq('id', setId);

      if (error) throw error;
      
      setExercises(exercises.map(ex => 
        ex.id === exerciseId 
          ? {
              ...ex,
              sets: ex.sets.map(set => 
                set.id === setId ? { ...set, ...updates } : set
              )
            }
          : ex
      ));
    } catch (error) {
      console.error('Error updating set:', error);
    }
  };

  const removeExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;
      
      setExercises(exercises.filter(ex => ex.id !== exerciseId));
      
      toast({
        title: "Exercise Removed",
        description: "Exercise removed from workout"
      });
    } catch (error) {
      console.error('Error removing exercise:', error);
      toast({
        title: "Error",
        description: "Failed to remove exercise",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout title="Custom Workout">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/start-workout">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </Link>
          
          {workoutStarted && (
            <Button onClick={finishWorkout} className="bg-gradient-primary">
              <Check size={16} className="mr-2" />
              Finish Workout
            </Button>
          )}
        </div>

        {!workoutStarted ? (
          <Card className="p-8 bg-gradient-card shadow-card text-center">
            <h2 className="text-2xl font-semibold mb-4">Custom Workout</h2>
            <p className="text-muted-foreground mb-6">
              Ready to start your custom workout? You can add exercises and track sets as you go.
            </p>
            <Button onClick={startWorkout} className="bg-gradient-primary hover:shadow-primary" size="lg">
              <Play size={20} className="mr-2" />
              Start Workout
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Workout in Progress</h2>
              <Button onClick={() => setShowAddExercise(true)} className="bg-gradient-primary">
                <Plus size={16} className="mr-2" />
                Add Exercise
              </Button>
            </div>

            {exercises.length === 0 ? (
              <Card className="p-8 bg-gradient-card shadow-card text-center">
                <div className="text-muted-foreground">
                  <Plus size={32} className="mx-auto mb-4" />
                  <p>No exercises added yet. Click "Add Exercise" to get started!</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise) => (
                  <Card key={exercise.id} className="p-6 bg-gradient-card shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{exercise.name}</h3>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{exercise.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeExercise(exercise.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {exercise.sets.map((set) => (
                        <div key={set.id} className="space-y-2 sm:space-y-0">
                          <div className="flex items-center justify-between sm:hidden">
                            <div className="text-sm font-medium">Set {set.set_number}</div>
                            <Button
                              variant={set.completed ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateSet(exercise.id, set.id, { completed: !set.completed })}
                            >
                              <Check size={14} />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:items-center">
                            <div className="hidden sm:block text-sm font-medium">Set {set.set_number}</div>
                            <Input
                              type="number"
                              placeholder="Weight"
                              value={set.weight || ""}
                              onChange={(e) => updateSet(exercise.id, set.id, { 
                                weight: e.target.value ? parseFloat(e.target.value) : null 
                              })}
                            />
                            <Input
                              type="number"
                              placeholder="Reps"
                              value={set.reps || ""}
                              onChange={(e) => updateSet(exercise.id, set.id, { 
                                reps: e.target.value ? parseInt(e.target.value) : null 
                              })}
                            />
                            <Input
                              type="number"
                              placeholder="RPE"
                              min="1"
                              max="10"
                              value={set.rpe || ""}
                              onChange={(e) => updateSet(exercise.id, set.id, { 
                                rpe: e.target.value ? parseInt(e.target.value) : null 
                              })}
                            />
                            <Button
                              variant={set.completed ? "default" : "outline"}
                              size="sm"
                              onClick={() => updateSet(exercise.id, set.id, { completed: !set.completed })}
                              className="hidden sm:flex"
                            >
                              <Check size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSet(exercise.id)}
                        className="w-full"
                      >
                        <Plus size={14} className="mr-2" />
                        Add Set
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Exercise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exerciseName">Exercise Name</Label>
                <ExerciseAutocomplete
                  value={newExerciseName}
                  onChange={setNewExerciseName}
                  onSelect={(selectedExercise) => {
                    if (selectedExercise) {
                      setNewExerciseName(selectedExercise.name);
                      // Auto-fill notes with exercise description if empty
                      if (!newExerciseNotes) {
                        setNewExerciseNotes(selectedExercise.description);
                      }
                    }
                  }}
                  placeholder="Search exercises or type custom name..."
                  showDetails={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exerciseNotes">Notes (Optional)</Label>
                <Textarea
                  id="exerciseNotes"
                  value={newExerciseNotes}
                  onChange={(e) => setNewExerciseNotes(e.target.value)}
                  placeholder="Any special instructions or notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddExercise(false)}>
                  Cancel
                </Button>
                <Button onClick={addExercise} disabled={!newExerciseName.trim()}>
                  Add Exercise
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CustomWorkout;