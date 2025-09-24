import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Dumbbell, Clock, Target, FileText, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RoutineDay {
  id: string;
  name: string;
  description?: string;
  day_number: number;
  routine_exercises: RoutineExercise[];
}

interface RoutineExercise {
  id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  weight_suggestion?: string;
  rest_time_seconds?: number;
  notes?: string;
  order_index: number;
}

interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  days_per_week: number;
  created_at: string;
  routine_days: RoutineDay[];
}

export const RoutineDetails = () => {
  const { routineId, dayId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [selectedDay, setSelectedDay] = useState<RoutineDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (routineId) {
      fetchRoutineDetails();
    }
  }, [routineId, dayId, user]);

  const fetchRoutineDetails = async () => {
    if (!user || !routineId) return;
    
    setLoading(true);
    try {
      // Fetch routine details with all days and exercises
      const { data: routineData, error: routineError } = await supabase
        .from('workout_routines')
        .select(`
          id,
          name,
          description,
          days_per_week,
          created_at,
          routine_days (
            id,
            name,
            description,
            day_number,
            routine_exercises (
              id,
              exercise_name,
              sets,
              reps,
              weight_suggestion,
              rest_time_seconds,
              notes,
              order_index
            )
          )
        `)
        .eq('id', routineId)
        .single();

      if (routineError) throw routineError;
      setRoutine(routineData);

      // If a specific day is requested, find it
      if (dayId && routineData) {
        const day = routineData.routine_days.find(d => d.id === dayId);
        setSelectedDay(day || null);
      } else if (routineData && routineData.routine_days.length > 0) {
        // Default to first day if no specific day requested
        setSelectedDay(routineData.routine_days[0]);
      }
    } catch (error) {
      console.error('Error fetching routine details:', error);
      toast({
        title: "Error",
        description: "Failed to load routine details",
        variant: "destructive"
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const getTotalExercises = () => {
    return selectedDay?.routine_exercises.length || 0;
  };

  const getTotalSets = () => {
    return selectedDay?.routine_exercises.reduce((total, exercise) => total + exercise.sets, 0) || 0;
  };

  const getEstimatedDuration = () => {
    if (!selectedDay) return 0;
    const totalSets = getTotalSets();
    const avgRestTime = selectedDay.routine_exercises.reduce((total, exercise) => 
      total + (exercise.rest_time_seconds || 60), 0
    ) / selectedDay.routine_exercises.length;
    const estimatedMinutes = Math.round((totalSets * 2) + (totalSets * avgRestTime / 60));
    return estimatedMinutes;
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!routine) {
    return (
      <Layout>
        <div className="text-center py-8">
          <Dumbbell size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Routine Not Found</h2>
          <p className="text-muted-foreground mb-4">This routine could not be found or you don't have permission to view it.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" />
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{routine.name}</h1>
            {routine.description && (
              <p className="text-muted-foreground mt-1">{routine.description}</p>
            )}
          </div>
        </div>

        {/* Routine Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={20} />
              Routine Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{routine.days_per_week}</div>
                <div className="text-sm text-muted-foreground">Days per Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{routine.routine_days.length}</div>
                <div className="text-sm text-muted-foreground">Workout Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{getTotalExercises()}</div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{getTotalSets()}</div>
                <div className="text-sm text-muted-foreground">Total Sets</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Selection */}
        {routine.routine_days.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Select Workout Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {routine.routine_days.map((day) => (
                  <Button
                    key={day.id}
                    variant={selectedDay?.id === day.id ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => setSelectedDay(day)}
                  >
                    <div className="font-medium">{day.name}</div>
                    {day.description && (
                      <div className="text-sm text-muted-foreground mt-1">{day.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      {day.routine_exercises.length} exercises
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Day Details */}
        {selectedDay && (
          <>
            {/* Day Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell size={20} />
                  {selectedDay.name}
                </CardTitle>
                {selectedDay.description && (
                  <p className="text-muted-foreground">{selectedDay.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{selectedDay.routine_exercises.length}</div>
                    <div className="text-sm text-muted-foreground">Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{getTotalSets()}</div>
                    <div className="text-sm text-muted-foreground">Total Sets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{getEstimatedDuration()}m</div>
                    <div className="text-sm text-muted-foreground">Est. Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(selectedDay.routine_exercises.reduce((total, exercise) => 
                        total + (exercise.rest_time_seconds || 60), 0
                      ) / selectedDay.routine_exercises.length / 60)}m
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Rest</div>
                  </div>
                </div>
                
                {/* Start Workout Button */}
                <div className="mt-6">
                  <Button 
                    onClick={() => navigate('/start-workout')} 
                    className="w-full"
                    size="lg"
                  >
                    <Play size={20} className="mr-2" />
                    Start Workout
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exercises */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Dumbbell size={20} />
                Exercises
              </h2>
              
              {selectedDay.routine_exercises.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Dumbbell size={32} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No exercises assigned to this day</p>
                  </CardContent>
                </Card>
              ) : (
                selectedDay.routine_exercises
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((exercise, index) => (
                    <Card key={exercise.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {index + 1}. {exercise.exercise_name}
                          </CardTitle>
                          <Badge variant="secondary">
                            {exercise.sets} sets
                          </Badge>
                        </div>
                        {exercise.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{exercise.notes}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Sets</div>
                            <div className="text-lg font-semibold">{exercise.sets}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Reps</div>
                            <div className="text-lg font-semibold">{exercise.reps}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Weight</div>
                            <div className="text-lg font-semibold">{exercise.weight_suggestion || 'Bodyweight'}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Rest</div>
                            <div className="text-lg font-semibold">
                              {exercise.rest_time_seconds ? `${Math.round(exercise.rest_time_seconds / 60)}m` : '60s'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
