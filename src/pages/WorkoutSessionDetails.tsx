import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, Dumbbell, Target, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WorkoutSession {
  id: string;
  name: string;
  start_time: string;
  end_time?: string;
  notes?: string;
}

interface WorkoutExercise {
  id: string;
  exercise_name: string;
  notes?: string;
  order_index: number;
  workout_sets: WorkoutSet[];
}

interface WorkoutSet {
  id: string;
  set_number: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  duration_seconds?: number;
  distance?: number;
  completed: boolean;
}

export const WorkoutSessionDetails = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId, user]);

  const fetchSessionDetails = async () => {
    if (!user || !sessionId) return;
    
    setLoading(true);
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch exercises with sets
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          exercise_name,
          notes,
          order_index,
          workout_sets (
            id,
            set_number,
            weight,
            reps,
            rpe,
            duration_seconds,
            distance,
            completed
          )
        `)
        .eq('session_id', sessionId)
        .order('order_index');

      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast({
        title: "Error",
        description: "Failed to load workout session details",
        variant: "destructive"
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const getDuration = () => {
    if (!session?.start_time || !session?.end_time) return null;
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);
    const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    return minutes;
  };

  const getTotalSets = () => {
    return exercises.reduce((total, exercise) => total + exercise.workout_sets.length, 0);
  };

  const getCompletedSets = () => {
    return exercises.reduce((total, exercise) => 
      total + exercise.workout_sets.filter(set => set.completed).length, 0
    );
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

  if (!session) {
    return (
      <Layout>
        <div className="text-center py-8">
          <Dumbbell size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
          <p className="text-muted-foreground mb-4">This workout session could not be found or you don't have permission to view it.</p>
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
            <h1 className="text-2xl font-bold">{session.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {format(new Date(session.start_time), 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                {format(new Date(session.start_time), 'h:mm a')}
                {session.end_time && (
                  <>
                    {' - '}
                    {format(new Date(session.end_time), 'h:mm a')}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Session Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={20} />
              Session Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{exercises.length}</div>
                <div className="text-sm text-muted-foreground">Exercises</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{getTotalSets()}</div>
                <div className="text-sm text-muted-foreground">Total Sets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{getCompletedSets()}</div>
                <div className="text-sm text-muted-foreground">Completed Sets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {getDuration() ? `${getDuration()}m` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Notes */}
        {session.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{session.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Exercises */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Dumbbell size={20} />
            Exercises
          </h2>
          
          {exercises.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Dumbbell size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No exercises recorded for this session</p>
              </CardContent>
            </Card>
          ) : (
            exercises.map((exercise, index) => (
              <Card key={exercise.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {index + 1}. {exercise.exercise_name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {exercise.workout_sets.length} sets
                    </Badge>
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{exercise.notes}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {exercise.workout_sets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sets recorded</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                        <div>Set</div>
                        <div>Weight</div>
                        <div>Reps</div>
                        <div>RPE</div>
                        <div>Duration</div>
                        <div>Status</div>
                      </div>
                      {exercise.workout_sets.map((set) => (
                        <div key={set.id} className="grid grid-cols-6 gap-2 text-sm">
                          <div className="font-medium">{set.set_number}</div>
                          <div>{set.weight ? `${set.weight}kg` : '-'}</div>
                          <div>{set.reps || '-'}</div>
                          <div>{set.rpe || '-'}</div>
                          <div>{set.duration_seconds ? `${set.duration_seconds}s` : '-'}</div>
                          <div>
                            <Badge variant={set.completed ? "default" : "secondary"} className="text-xs">
                              {set.completed ? 'Completed' : 'Incomplete'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};
