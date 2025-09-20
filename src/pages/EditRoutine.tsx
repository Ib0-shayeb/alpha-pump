import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Save, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RoutineDay {
  id?: string;
  name: string;
  description: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: string;
      weight_suggestion: string;
      notes: string;
    }>;
    notes: string;
  }>;
}

const EditRoutine = () => {
  const { id } = useParams();
  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [editingDay, setEditingDay] = useState<RoutineDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadRoutine();
    }
  }, [id, user]);

  const loadRoutine = async () => {
    if (!user || !id) return;
    
    try {
      setLoading(true);
      
      // Load routine details
      const { data: routine, error: routineError } = await supabase
        .from('workout_routines')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (routineError) throw routineError;
      if (!routine) {
        toast({
          title: "Error",
          description: "Routine not found or you don't have permission to edit it.",
          variant: "destructive"
        });
        navigate('/routines');
        return;
      }

      setRoutineName(routine.name);
      setDescription(routine.description || '');

      // Load routine days
      const { data: routineDays, error: daysError } = await supabase
        .from('routine_days')
        .select(`
          id,
          name,
          description,
          routine_exercises (
            id,
            exercise_name,
            sets,
            weight_suggestion,
            notes,
            order_index
          )
        `)
        .eq('routine_id', id)
        .order('created_at');

      if (daysError) throw daysError;

      // Convert to our format
      const formattedDays: RoutineDay[] = routineDays.map(day => ({
        id: day.id,
        name: day.name,
        description: day.description || '',
        exercises: day.routine_exercises
          .sort((a, b) => a.order_index - b.order_index)
          .map(exercise => ({
            name: exercise.exercise_name,
            sets: Array.from({ length: exercise.sets || 3 }, (_, i) => ({
              reps: '',
              weight_suggestion: exercise.weight_suggestion || '',
              notes: ''
            })),
            notes: exercise.notes || ''
          }))
      }));

      setDays(formattedDays);
    } catch (error) {
      console.error('Error loading routine:', error);
      toast({
        title: "Error",
        description: "Failed to load routine. Please try again.",
        variant: "destructive"
      });
      navigate('/routines');
    } finally {
      setLoading(false);
    }
  };

  const addDay = () => {
    const newDay: RoutineDay = {
      name: `Day ${days.length + 1}`,
      description: "",
      exercises: []
    };
    setEditingDay(newDay);
    setIsDialogOpen(true);
  };

  const editDay = (day: RoutineDay, index: number) => {
    setEditingDay({ ...day, id: index.toString() });
    setIsDialogOpen(true);
  };

  const saveDay = () => {
    if (!editingDay) return;
    
    if (editingDay.id !== undefined) {
      // Edit existing day
      const updatedDays = [...days];
      updatedDays[parseInt(editingDay.id)] = editingDay;
      setDays(updatedDays);
    } else {
      // Add new day
      setDays([...days, editingDay]);
    }
    
    setEditingDay(null);
    setIsDialogOpen(false);
  };

  const removeDay = (index: number) => {
    setDays(days.filter((_, i) => i !== index));
  };

  const saveRoutine = async (isDraft = false) => {
    if (!user || !routineName.trim()) return;
    
    try {
      setSaving(true);

      // Update routine
      const { error: routineError } = await supabase
        .from('workout_routines')
        .update({
          name: routineName.trim(),
          description: description.trim(),
          days_per_week: days.length
        })
        .eq('id', id);

      if (routineError) throw routineError;

      // Delete existing days and exercises
      const { error: deleteDaysError } = await supabase
        .from('routine_days')
        .delete()
        .eq('routine_id', id);

      if (deleteDaysError) throw deleteDaysError;

      // Create new days and exercises
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        
        const { data: dayData, error: dayError } = await supabase
          .from('routine_days')
          .insert({
            routine_id: id,
            day_number: i + 1,
            name: day.name,
            description: day.description
          })
          .select()
          .single();

        if (dayError) throw dayError;

        for (let j = 0; j < day.exercises.length; j++) {
          const exercise = day.exercises[j];
          
          const { error: exerciseError } = await supabase
            .from('routine_exercises')
            .insert({
              routine_day_id: dayData.id,
              exercise_name: exercise.name,
              sets: exercise.sets.length,
              weight_suggestion: exercise.sets[0]?.weight_suggestion || '',
              notes: exercise.notes,
              order_index: j
            });

          if (exerciseError) throw exerciseError;
        }
      }

      toast({
        title: "Success",
        description: `Routine ${isDraft ? 'saved as draft' : 'updated'} successfully!`
      });

      navigate('/routines');
    } catch (error) {
      console.error('Error saving routine:', error);
      toast({
        title: "Error",
        description: "Failed to save routine. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Routine">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Routine">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/routines">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back to Routines
            </Button>
          </Link>
        </div>

        <Card className="p-6 bg-gradient-card shadow-card border-border/50">
          <h2 className="text-xl font-semibold mb-4">Routine Details</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="routineName">Routine Name</Label>
              <Input
                id="routineName"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g., Push/Pull/Legs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your workout routine..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Workout Days</h2>
            <Button onClick={addDay} className="bg-gradient-primary">
              <Plus size={16} className="mr-2" />
              Add Day
            </Button>
          </div>

          {days.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No workout days added yet.</p>
              <p className="text-sm">Click "Add Day" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {days.map((day, index) => (
                <Card key={index} className="p-4 border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{day.name}</h3>
                      {day.description && (
                        <p className="text-sm text-muted-foreground">{day.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => editDay(day, index)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeDay(index)}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  
                  {day.exercises.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Exercises:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {day.exercises.map((exercise, exerciseIndex) => (
                          <div key={exerciseIndex} className="text-sm bg-muted/50 p-2 rounded">
                            <div className="font-medium">{exercise.name}</div>
                            <div className="text-muted-foreground">
                              {exercise.sets.length} sets
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => saveRoutine(true)}
            disabled={saving || !routineName.trim()}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => saveRoutine(false)}
            disabled={saving || !routineName.trim() || days.length === 0}
            className="bg-gradient-primary"
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save Routine'}
          </Button>
        </div>

        {/* Day Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDay?.id !== undefined ? 'Edit Day' : 'Add New Day'}
              </DialogTitle>
            </DialogHeader>
            
            {editingDay && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dayName">Day Name</Label>
                  <Input
                    id="dayName"
                    value={editingDay.name}
                    onChange={(e) => setEditingDay({ ...editingDay, name: e.target.value })}
                    placeholder="e.g., Push Day, Pull Day"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dayDescription">Description (Optional)</Label>
                  <Textarea
                    id="dayDescription"
                    value={editingDay.description}
                    onChange={(e) => setEditingDay({ ...editingDay, description: e.target.value })}
                    placeholder="Describe this workout day..."
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Exercises</h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        const newExercise = {
                          name: '',
                          sets: [{ reps: '', weight_suggestion: '', notes: '' }],
                          notes: ''
                        };
                        setEditingDay({
                          ...editingDay,
                          exercises: [...editingDay.exercises, newExercise]
                        });
                      }}
                    >
                      <Plus size={14} className="mr-1" />
                      Add Exercise
                    </Button>
                  </div>

                  {editingDay.exercises.map((exercise, exerciseIndex) => (
                    <Card key={exerciseIndex} className="p-4 border-border/50">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Exercise {exerciseIndex + 1}</h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedExercises = editingDay.exercises.filter((_, i) => i !== exerciseIndex);
                              setEditingDay({ ...editingDay, exercises: updatedExercises });
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`exerciseName-${exerciseIndex}`}>Exercise Name</Label>
                          <Input
                            id={`exerciseName-${exerciseIndex}`}
                            value={exercise.name}
                            onChange={(e) => {
                              const updatedExercises = [...editingDay.exercises];
                              updatedExercises[exerciseIndex].name = e.target.value;
                              setEditingDay({ ...editingDay, exercises: updatedExercises });
                            }}
                            placeholder="e.g., Bench Press"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`exerciseNotes-${exerciseIndex}`}>Notes (Optional)</Label>
                          <Textarea
                            id={`exerciseNotes-${exerciseIndex}`}
                            value={exercise.notes}
                            onChange={(e) => {
                              const updatedExercises = [...editingDay.exercises];
                              updatedExercises[exerciseIndex].notes = e.target.value;
                              setEditingDay({ ...editingDay, exercises: updatedExercises });
                            }}
                            placeholder="Exercise notes..."
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Sets</Label>
                          <div className="space-y-2">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="flex space-x-2">
                                <div className="flex-1">
                                  <Label htmlFor={`reps-${exerciseIndex}-${setIndex}`}>Reps</Label>
                                  <Input
                                    id={`reps-${exerciseIndex}-${setIndex}`}
                                    value={set.reps}
                                    onChange={(e) => {
                                      const updatedExercises = [...editingDay.exercises];
                                      updatedExercises[exerciseIndex].sets[setIndex].reps = e.target.value;
                                      setEditingDay({ ...editingDay, exercises: updatedExercises });
                                    }}
                                    placeholder="8-12"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label htmlFor={`weight-${exerciseIndex}-${setIndex}`}>Weight Suggestion</Label>
                                  <Input
                                    id={`weight-${exerciseIndex}-${setIndex}`}
                                    value={set.weight_suggestion}
                                    onChange={(e) => {
                                      const updatedExercises = [...editingDay.exercises];
                                      updatedExercises[exerciseIndex].sets[setIndex].weight_suggestion = e.target.value;
                                      setEditingDay({ ...editingDay, exercises: updatedExercises });
                                    }}
                                    placeholder="135 lbs"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label htmlFor={`setNotes-${exerciseIndex}-${setIndex}`}>Notes</Label>
                                  <Input
                                    id={`setNotes-${exerciseIndex}-${setIndex}`}
                                    value={set.notes}
                                    onChange={(e) => {
                                      const updatedExercises = [...editingDay.exercises];
                                      updatedExercises[exerciseIndex].sets[setIndex].notes = e.target.value;
                                      setEditingDay({ ...editingDay, exercises: updatedExercises });
                                    }}
                                    placeholder="Set notes..."
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const updatedExercises = [...editingDay.exercises];
                                updatedExercises[exerciseIndex].sets.push({
                                  reps: '',
                                  weight_suggestion: '',
                                  notes: ''
                                });
                                setEditingDay({ ...editingDay, exercises: updatedExercises });
                              }}
                            >
                              <Plus size={14} className="mr-1" />
                              Add Set
                            </Button>
                            {exercise.sets.length > 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const updatedExercises = [...editingDay.exercises];
                                  updatedExercises[exerciseIndex].sets.pop();
                                  setEditingDay({ ...editingDay, exercises: updatedExercises });
                                }}
                              >
                                Remove Set
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveDay} disabled={!editingDay?.name.trim()}>
                {editingDay?.id !== undefined ? 'Update Day' : 'Add Day'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EditRoutine;
