import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell, Calendar, Trophy, Target, Users, Shield, SkipForward, Bot, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClientConnectRequest } from "@/components/ClientConnectRequest";
import { PrivacySettings } from "@/components/PrivacySettings";
import { ClientWorkoutCalendar } from "@/components/ClientWorkoutCalendar";
import { TrainerView } from "./TrainerView";

interface RecentWorkout {
  id: string;
  name: string;
  created_at: string;
  exercises: Array<{
    name: string;
    best_set: {
      weight: number | null;
      reps: number | null;
    };
  }>;
}

interface ActiveRoutine {
  id: string;
  routine_id: string;
  plan_type: 'strict' | 'flexible';
  start_date: string;
  routine: {
    name: string;
    description?: string;
    days_per_week: number;
  };
}

const Dashboard = () => {
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [activeRoutines, setActiveRoutines] = useState<ActiveRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'trainer'>('client');
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setUserRole((profile?.role as 'client' | 'trainer') || 'client');
    };

    const fetchActiveRoutines = async () => {
      if (!user) return;

      try {
        // First get the assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('client_routine_assignments')
          .select('id, routine_id, plan_type, start_date')
          .eq('client_id', user.id)
          .eq('is_active', true)
          .order('start_date', { ascending: false });

        if (assignmentsError) throw assignmentsError;

        if (!assignments || assignments.length === 0) {
          setActiveRoutines([]);
          return;
        }

        // Then get the routine details
        const routineIds = assignments.map(a => a.routine_id);
        const { data: routines, error: routinesError } = await supabase
          .from('workout_routines')
          .select('id, name, description, days_per_week')
          .in('id', routineIds);

        if (routinesError) throw routinesError;

        // Combine the data
        const formattedRoutines: ActiveRoutine[] = assignments.map(assignment => {
          const routine = routines?.find(r => r.id === assignment.routine_id);
          return {
            id: assignment.id,
            routine_id: assignment.routine_id,
            plan_type: assignment.plan_type as 'strict' | 'flexible',
            start_date: assignment.start_date,
            routine: routine ? {
              name: routine.name,
              description: routine.description || undefined,
              days_per_week: routine.days_per_week
            } : {
              name: 'Unknown Routine',
              days_per_week: 0
            }
          };
        }).filter(assignment => assignment.routine.name !== 'Unknown Routine');

        setActiveRoutines(formattedRoutines);
      } catch (error) {
        console.error('Error fetching active routines:', error);
      } finally {
        setRoutinesLoading(false);
      }
    };

    fetchUserRole();
    if (userRole === 'client') {
      fetchActiveRoutines();
    }
  }, [user, userRole]);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user) return;
      
      try {
        // Get recent workout sessions with exercises and sets
        const { data: sessions, error } = await supabase
          .from('workout_sessions')
          .select(`
            id,
            name,
            created_at,
            workout_exercises (
              exercise_name,
              workout_sets (
                weight,
                reps
              )
            )
          `)
          .eq('user_id', user.id)
          .not('end_time', 'is', null)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        const formattedWorkouts = sessions?.map(session => ({
          id: session.id,
          name: session.name,
          created_at: session.created_at,
          exercises: session.workout_exercises.map(exercise => {
            // Find the best set (highest weight × reps)
            const bestSet = exercise.workout_sets.reduce((best, current) => {
              const currentScore = (current.weight || 0) * (current.reps || 1);
              const bestScore = (best.weight || 0) * (best.reps || 1);
              return currentScore > bestScore ? current : best;
            }, exercise.workout_sets[0] || { weight: null, reps: null });

            return {
              name: exercise.exercise_name,
              best_set: bestSet
            };
          })
        })) || [];

        setRecentWorkouts(formattedWorkouts);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [user]);

  const stats = [
    { label: "Workouts This Week", value: "3", icon: Dumbbell, color: "text-primary" },
    { label: "Current Streak", value: "5 days", icon: Target, color: "text-workout-complete" },
    { label: "Total Workouts", value: "24", icon: Trophy, color: "text-accent" },
  ];

  return (
    <Layout title="GymTracker">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-card rounded-lg p-6 shadow-card">
          <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground mb-4">
            Ready to crush your workout goals today?
          </p>
          <Link to="/start-workout">
            <Button className="bg-gradient-primary hover:shadow-primary">
              <Plus size={16} className="mr-2" />
              Start Workout
            </Button>
          </Link>
        </div>

        {/* AI Trainer Access */}
        {userRole === 'client' && (
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-primary/5 shadow-card">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      AI Fitness Coach
                      <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
                        <Zap className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">Get personalized fitness guidance 24/7</p>
                  </div>
                </div>
                <Link to="/ai-trainer">
                  <Button variant="default" size="sm">
                    Chat Now
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 bg-gradient-card shadow-card border-border/50">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={20} className={stat.color} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>


        {/* Client Workout Calendar */}
        {userRole === 'client' && (
          <ClientWorkoutCalendar />
        )}

        {/* Active Routines section removed for clients */}

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          {loading ? (
            <Card className="p-4 bg-gradient-card shadow-card border-border/50">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          ) : recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout) => (
              <Card key={workout.id} className="p-4 bg-gradient-card shadow-card border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{workout.name}</h4>
                  <span className="text-sm text-muted-foreground">
                    {new Date(workout.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {workout.exercises.slice(0, 3).map((exercise, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{exercise.name}</span>
                      <span className="text-primary font-medium">
                        {exercise.best_set.weight ? `${exercise.best_set.weight} kg` : 'Bodyweight'} 
                        {exercise.best_set.reps ? ` × ${exercise.best_set.reps}` : ''}
                      </span>
                    </div>
                  ))}
                  {workout.exercises.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{workout.exercises.length - 3} more exercises
                    </div>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-4 bg-gradient-card shadow-card border-border/50">
              <div className="text-center py-4">
                <Dumbbell size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No recent workouts</p>
                <p className="text-sm text-muted-foreground">Complete a workout to see your activity here</p>
              </div>
            </Card>
          )}
        </div>

        {/* Trainer Connection for Clients */}
        <ClientConnectRequest />
        
        {/* Privacy Settings for Clients */}
        {userRole === 'client' && <PrivacySettings />}
      </div>
    </Layout>
  );
};

export default Dashboard;