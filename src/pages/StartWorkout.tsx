import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Calendar, Dumbbell, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkoutSchedule } from "@/hooks/useWorkoutSchedule";
import { format } from "date-fns";

interface TodayWorkoutItem {
  assignment_id: string;
  routine_id: string;
  routine_name: string;
  routine_day_id: string;
  routine_day_name: string;
  exercises_count?: number;
}

const StartWorkout = () => {
  const [todayItems, setTodayItems] = useState<TodayWorkoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const { routineSchedules, loading: scheduleLoading } = useWorkoutSchedule(user?.id || '', new Date());
  const [completedTodayIds, setCompletedTodayIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    if (scheduleLoading) return;

    const items: TodayWorkoutItem[] = (routineSchedules || []).flatMap(rs =>
      (rs.schedule || [])
        .filter(d => d.scheduled_date === todayStr && !d.is_rest_day && d.routine_day?.id)
        .map(d => ({
          assignment_id: d.assignment_id,
          routine_id: d.routine_id,
          routine_name: rs.routine_name,
          routine_day_id: d.routine_day!.id,
          routine_day_name: d.routine_day!.name,
        }))
    );

    // Exclude completed/started today by routine_day_id
    const filtered = items.filter(i => !completedTodayIds.has(i.routine_day_id));
    setTodayItems(filtered);
    setLoading(false);
  }, [user, routineSchedules, scheduleLoading, todayStr, completedTodayIds]);

  // Fetch today's sessions and exclude those routine_day_ids
  useEffect(() => {
    const fetchTodaysSessions = async () => {
      if (!user) return;
      try {
        const dayStart = `${todayStr}`;
        const dayEnd = `${todayStr} 23:59:59`;
        const { data, error } = await supabase
          .from('workout_sessions')
          .select('routine_day_id')
          .eq('user_id', user.id)
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd);
        if (error) throw error;
        const done = new Set<string>();
        (data || []).forEach((s: any) => {
          if (s.routine_day_id) done.add(s.routine_day_id);
        });
        setCompletedTodayIds(done);
      } catch (err) {
        console.error('Failed to fetch today\'s sessions', err);
      }
    };
    fetchTodaysSessions();
  }, [user, todayStr]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (todayItems.length === 0) return;
      try {
        const ids = todayItems.map(i => i.routine_day_id);
        const { data, error } = await supabase
          .from('routine_exercises')
          .select('routine_day_id, id')
          .in('routine_day_id', ids);
        if (error) throw error;
        const counts = new Map<string, number>();
        (data || []).forEach((row: any) => {
          counts.set(row.routine_day_id, (counts.get(row.routine_day_id) || 0) + 1);
        });
        setTodayItems(prev => prev.map(p => ({ ...p, exercises_count: counts.get(p.routine_day_id) || 0 })));
      } catch (err) {
        console.error('Failed to fetch exercise counts', err);
      }
    };
    fetchCounts();
  }, [todayItems.length]);

  const startWorkout = async (item: TodayWorkoutItem) => {
    if (!user) return;
    try {
      const { data: session, error } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          routine_id: item.routine_id,
          routine_day_id: item.routine_day_id,
          assignment_id: item.assignment_id,
          name: item.routine_day_name,
          start_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      window.location.href = `/active-workout?sessionId=${session.id}&routineDay=${item.routine_day_id}`;
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
          ) : todayItems.length > 0 ? (
            <div className="space-y-3">
              {todayItems.map(item => (
                <Card key={`${item.assignment_id}-${item.routine_day_id}`} className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg mb-1">{item.routine_day_name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        From {item.routine_name}
                      </p>
                      {typeof item.exercises_count === 'number' && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Dumbbell size={14} className="mr-1" />
                          <span>{item.exercises_count} exercises</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      className="bg-gradient-primary hover:shadow-primary"
                      onClick={() => startWorkout(item)}
                    >
                      <Play size={16} className="mr-2" />
                      Start Workout
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
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