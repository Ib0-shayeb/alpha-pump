import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell, Calendar, Trophy, Target, Users, Shield, SkipForward, Bot, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClientWorkoutCalendar } from "@/components/ClientWorkoutCalendar";
 
import { endOfWeek, format, startOfWeek } from "date-fns";

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
  const [activeRoutines, setActiveRoutines] = useState<ActiveRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'trainer'>('client');
  const { user } = useAuth();
  const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState<number>(0);

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

  // Removed recent activity feature

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        // Total completed workouts (end_time not null)
        const { count: totalCount, error: totalErr } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (totalErr) throw totalErr;
        setTotalWorkouts(totalCount || 0);

        // Workouts this week (Mon-Sun)
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd 23:59:59');
        const { count: weekCount, error: weekErr } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('start_time', weekStart)
          .lte('start_time', weekEnd)
          ;
        if (weekErr) throw weekErr;
        setWorkoutsThisWeek(weekCount || 0);
      } catch (e) {
        console.error('Failed to fetch stats', e);
        setTotalWorkouts(0);
        setWorkoutsThisWeek(0);
      }
    };
    fetchStats();
  }, [user]);

  const stats = [
    { label: "Workouts This Week", value: String(workoutsThisWeek), icon: Dumbbell, color: "text-primary" },
    { label: "Total Workouts", value: String(totalWorkouts), icon: Trophy, color: "text-accent" },
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

        {/* Recent Activity removed */}

        {/* Trainer Connection removed */}
        
        {/* Privacy Settings moved to Settings page */}
      </div>
    </Layout>
  );
};

export default Dashboard;