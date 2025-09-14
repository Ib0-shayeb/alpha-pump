import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Calendar, Dumbbell, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TodaysRoutine {
  routine_id: string;
  routine_name: string;
  day_id: string;
  day_name: string;
  day_number: number;
  exercises_count: number;
}

const StartWorkout = () => {
  const [todaysRoutine, setTodaysRoutine] = useState<TodaysRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTodaysRoutine = async () => {
      if (!user) return;
      
      try {
        // Get active routines for the user
        const { data: activeRoutines, error: routinesError } = await supabase
          .from('workout_routines')
          .select(`
            id,
            name,
            days_per_week,
            routine_days (
              id,
              name,
              day_number,
              routine_exercises (count)
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (routinesError) throw routinesError;

        if (activeRoutines && activeRoutines.length > 0) {
          // Simple logic: calculate which day based on days since routine started
          // In a real app, you'd want more sophisticated scheduling
          const routine = activeRoutines[0];
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
          
          // Map to routine day (simple cycling through days)
          const routineDay = routine.routine_days[dayOfWeek % routine.routine_days.length];
          
          if (routineDay) {
            setTodaysRoutine({
              routine_id: routine.id,
              routine_name: routine.name,
              day_id: routineDay.id,
              day_name: routineDay.name,
              day_number: routineDay.day_number,
              exercises_count: routineDay.routine_exercises?.length || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching today\'s routine:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysRoutine();
  }, [user]);

  const startTodaysWorkout = async () => {
    if (!user || !todaysRoutine) return;
    
    try {
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          routine_id: todaysRoutine.routine_id,
          routine_day_id: todaysRoutine.day_id,
          name: todaysRoutine.day_name,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Navigate to custom workout with pre-populated exercises
      window.location.href = `/custom-workout?sessionId=${session.id}&routineDay=${todaysRoutine.day_id}`;
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  return (
    <Layout title="Start Workout">
      <div className="space-y-6">
        <div className="bg-gradient-card rounded-lg p-6 shadow-card">
          <h2 className="text-xl font-semibold mb-2">Ready to Train?</h2>
          <p className="text-muted-foreground mb-4">
            Check your routine for today or start a custom workout
          </p>
        </div>

        {/* Today's Routine Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Calendar size={20} className="mr-2" />
            Today's Routine
          </h3>
          
          {loading ? (
            <Card className="p-6 bg-gradient-card shadow-card border-border/50">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </Card>
          ) : todaysRoutine ? (
            <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-lg mb-1">{todaysRoutine.day_name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    From {todaysRoutine.routine_name} • Day {todaysRoutine.day_number}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Dumbbell size={14} className="mr-1" />
                    <span>{todaysRoutine.exercises_count} exercises</span>
                  </div>
                </div>
                <Button 
                  className="bg-gradient-primary hover:shadow-primary"
                  onClick={startTodaysWorkout}
                >
                  <Play size={16} className="mr-2" />
                  Start Today's Workout
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-card shadow-card border-border/50">
              <div className="text-center py-4">
                <Calendar size={32} className="mx-auto mb-2 text-muted-foreground" />
                <h4 className="font-medium mb-1">Rest Day</h4>
                <p className="text-sm text-muted-foreground">
                  No routine scheduled for today. Take a rest or start a custom workout!
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Custom Workout Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Custom Workout</h3>
          <Link to="/custom-workout">
            <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Plus size={24} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg">Start Custom Workout</h4>
                    <p className="text-sm text-muted-foreground">
                      Build your workout on the go with any exercises
                    </p>
                  </div>
                </div>
                <Button className="bg-gradient-primary hover:shadow-primary">
                  <Play size={16} className="mr-2" />
                  Start
                </Button>
              </div>
            </Card>
          </Link>
        </div>

        {/* Quick Access */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Access</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/routines">
              <Card className="p-4 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">My Workout Routines</h4>
                    <p className="text-sm text-muted-foreground">Manage and assign your routines</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StartWorkout;