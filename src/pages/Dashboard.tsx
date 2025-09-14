import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Calendar, Trophy, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

const Dashboard = () => {
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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
    { label: "Active Routines", value: "2", icon: Calendar, color: "text-secondary-foreground" },
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

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/routines">
              <Card className="p-4 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Workout Routines</h4>
                    <p className="text-sm text-muted-foreground">Manage your routines</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/routines/create">
              <Card className="p-4 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Create New Routine</h4>
                    <p className="text-sm text-muted-foreground">Build your workout plan</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/exercises">
              <Card className="p-4 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Dumbbell size={20} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">Browse Exercises</h4>
                    <p className="text-sm text-muted-foreground">Explore exercise library</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

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
      </div>
    </Layout>
  );
};

export default Dashboard;