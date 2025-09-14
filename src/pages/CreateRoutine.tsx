import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Save, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface RoutineDay {
  id?: string;
  name: string;
  description: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    weight_suggestion: string;
    notes: string;
  }>;
}

const CreateRoutine = () => {
  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [editingDay, setEditingDay] = useState<RoutineDay | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    if (!user || !routineName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a routine name",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      // Create the routine
      const { data: routine, error: routineError } = await supabase
        .from('workout_routines')
        .insert({
          user_id: user.id,
          name: routineName,
          description: description || null,
          days_per_week: days.length
        })
        .select()
        .single();

      if (routineError) throw routineError;

      // Create routine days
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const { data: routineDay, error: dayError } = await supabase
          .from('routine_days')
          .insert({
            routine_id: routine.id,
            day_number: i + 1,
            name: day.name,
            description: day.description || null
          })
          .select()
          .single();

        if (dayError) throw dayError;

        // Create routine exercises for this day
        for (let j = 0; j < day.exercises.length; j++) {
          const exercise = day.exercises[j];
          const { error: exerciseError } = await supabase
            .from('routine_exercises')
            .insert({
              routine_day_id: routineDay.id,
              exercise_name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              weight_suggestion: exercise.weight_suggestion || null,
              notes: exercise.notes || null,
              order_index: j
            });

          if (exerciseError) throw exerciseError;
        }
      }

      toast({
        title: "Success",
        description: `Routine ${isDraft ? 'saved as draft' : 'created'} successfully!`
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

  return (
    <Layout title="Create New Routine">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
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
            <Button onClick={addDay} size="sm" className="bg-gradient-primary">
              <Plus size={16} className="mr-2" />
              Add Day
            </Button>
          </div>
          
          {days.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No days added yet. Click "Add Day" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {days.map((day, index) => (
                <Card key={index} className="p-4 bg-card/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{day.name}</span>
                      {day.description && (
                        <p className="text-sm text-muted-foreground mt-1">{day.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => editDay(day, index)}>
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => removeDay(index)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <div className="flex space-x-4">
          <Button 
            className="flex-1 bg-gradient-primary hover:shadow-primary" 
            onClick={() => saveRoutine(false)}
            disabled={saving || !routineName.trim()}
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save Routine'}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => saveRoutine(true)}
            disabled={saving || !routineName.trim()}
          >
            Save as Draft
          </Button>
        </div>

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
                    onChange={(e) => setEditingDay({...editingDay, name: e.target.value})}
                    placeholder="e.g., Push Day, Pull Day, Legs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dayDescription">Description (Optional)</Label>
                  <Textarea
                    id="dayDescription"
                    value={editingDay.description}
                    onChange={(e) => setEditingDay({...editingDay, description: e.target.value})}
                    placeholder="Describe this workout day..."
                    rows={2}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Exercises</Label>
                    <Button
                      size="sm"
                      onClick={() => setEditingDay({
                        ...editingDay,
                        exercises: [...editingDay.exercises, {
                          name: '',
                          sets: 3,
                          reps: '8-12',
                          weight_suggestion: '',
                          notes: ''
                        }]
                      })}
                    >
                      <Plus size={14} className="mr-1" />
                      Add Exercise
                    </Button>
                  </div>
                  
                  {editingDay.exercises.map((exercise, exerciseIndex) => (
                    <Card key={exerciseIndex} className="p-3 bg-card/50">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={exercise.name}
                            onChange={(e) => {
                              const updatedExercises = [...editingDay.exercises];
                              updatedExercises[exerciseIndex].name = e.target.value;
                              setEditingDay({...editingDay, exercises: updatedExercises});
                            }}
                            placeholder="Exercise name"
                            className="flex-1 mr-2"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const updatedExercises = editingDay.exercises.filter((_, i) => i !== exerciseIndex);
                              setEditingDay({...editingDay, exercises: updatedExercises});
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Sets</Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => {
                                const updatedExercises = [...editingDay.exercises];
                                updatedExercises[exerciseIndex].sets = parseInt(e.target.value) || 0;
                                setEditingDay({...editingDay, exercises: updatedExercises});
                              }}
                              min="1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Reps</Label>
                            <Input
                              value={exercise.reps}
                              onChange={(e) => {
                                const updatedExercises = [...editingDay.exercises];
                                updatedExercises[exerciseIndex].reps = e.target.value;
                                setEditingDay({...editingDay, exercises: updatedExercises});
                              }}
                              placeholder="8-12"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Weight</Label>
                            <Input
                              value={exercise.weight_suggestion}
                              onChange={(e) => {
                                const updatedExercises = [...editingDay.exercises];
                                updatedExercises[exerciseIndex].weight_suggestion = e.target.value;
                                setEditingDay({...editingDay, exercises: updatedExercises});
                              }}
                              placeholder="60kg"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Notes (Optional)</Label>
                          <Textarea
                            value={exercise.notes}
                            onChange={(e) => {
                              const updatedExercises = [...editingDay.exercises];
                              updatedExercises[exerciseIndex].notes = e.target.value;
                              setEditingDay({...editingDay, exercises: updatedExercises});
                            }}
                            placeholder="Any special instructions..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveDay} disabled={!editingDay.name.trim()}>
                    Save Day
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CreateRoutine;