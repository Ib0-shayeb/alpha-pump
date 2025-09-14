import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Users, Star, Play, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
  days_per_week: number;
  user_id: string;
  created_at: string;
  routine_days: Array<{
    name: string;
    routine_exercises: Array<{ exercise_name: string }>;
  }>;
  profiles?: {
    display_name: string | null;
    username: string | null;
  } | null;
}

const WorkoutRoutines = () => {
  const [myRoutines, setMyRoutines] = useState<WorkoutRoutine[]>([]);
  const [publicRoutines, setPublicRoutines] = useState<WorkoutRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRoutines();
  }, [user]);

  const fetchRoutines = async () => {
    if (!user) return;
    
    try {
      // Fetch user's own routines
      const { data: userRoutines, error: userError } = await supabase
        .from('workout_routines')
        .select(`
          *,
          routine_days (
            name,
            routine_exercises (exercise_name)
          )
        `)
        .eq('user_id', user.id)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (userError) throw userError;

      // Fetch public routines
      const { data: publicRoutinesData, error: publicError } = await supabase
        .from('workout_routines')
        .select(`
          id,
          name,
          description,
          is_active,
          is_public,
          days_per_week,
          user_id,
          created_at,
          routine_days (
            name,
            routine_exercises (exercise_name)
          )
        `)
        .eq('is_public', true)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (publicError) throw publicError;

      // Fetch profiles separately for public routines
      const profilePromises = (publicRoutinesData || []).map(async (routine) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('user_id', routine.user_id)
          .single();
        
        return {
          ...routine,
          profiles: profile
        };
      });

      const publicRoutinesWithProfiles = await Promise.all(profilePromises);

      setMyRoutines(userRoutines || []);
      setPublicRoutines(publicRoutinesWithProfiles as WorkoutRoutine[]);
    } catch (error) {
      console.error('Error fetching routines:', error);
      toast({
        title: "Error",
        description: "Failed to load routines",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRoutineActive = async (routineId: string, currentActive: boolean) => {
    try {
      // If activating this routine, deactivate all others first
      if (!currentActive) {
        await supabase
          .from('workout_routines')
          .update({ is_active: false })
          .eq('user_id', user?.id);
      }

      // Toggle this routine
      const { error } = await supabase
        .from('workout_routines')
        .update({ is_active: !currentActive })
        .eq('id', routineId);

      if (error) throw error;

      // Refresh routines
      await fetchRoutines();
      
      toast({
        title: currentActive ? "Routine Deactivated" : "Routine Activated",
        description: currentActive 
          ? "This routine is no longer active" 
          : "This routine is now your active routine"
      });
    } catch (error) {
      console.error('Error toggling routine:', error);
      toast({
        title: "Error",
        description: "Failed to update routine",
        variant: "destructive"
      });
    }
  };

  const copyPublicRoutine = async (routine: WorkoutRoutine) => {
    if (!user) return;
    
    try {
      // Create a copy of the routine for the user
      const { data: newRoutine, error: routineError } = await supabase
        .from('workout_routines')
        .insert({
          user_id: user.id,
          name: `${routine.name} (Copy)`,
          description: routine.description,
          days_per_week: routine.days_per_week,
          is_public: false,
          is_active: false
        })
        .select()
        .single();

      if (routineError) throw routineError;

      // Copy all routine days and exercises
      for (const day of routine.routine_days) {
        const { data: newDay, error: dayError } = await supabase
          .from('routine_days')
          .insert({
            routine_id: newRoutine.id,
            day_number: routine.routine_days.indexOf(day) + 1,
            name: day.name,
            description: null
          })
          .select()
          .single();

        if (dayError) throw dayError;

        // Copy exercises for this day
        for (const exercise of day.routine_exercises) {
          const { error: exerciseError } = await supabase
            .from('routine_exercises')
            .insert({
              routine_day_id: newDay.id,
              exercise_name: exercise.exercise_name,
              sets: 3,
              reps: '8-12',
              order_index: day.routine_exercises.indexOf(exercise)
            });

          if (exerciseError) throw exerciseError;
        }
      }

      await fetchRoutines();
      
      toast({
        title: "Routine Copied!",
        description: `${routine.name} has been added to your routines`
      });
    } catch (error) {
      console.error('Error copying routine:', error);
      toast({
        title: "Error",
        description: "Failed to copy routine",
        variant: "destructive"
      });
    }
  };

  const RoutineCard = ({ routine, showAuthor = false, showCopyButton = false }: { 
    routine: WorkoutRoutine; 
    showAuthor?: boolean;
    showCopyButton?: boolean;
  }) => {
    const totalExercises = routine.routine_days.reduce(
      (total, day) => total + day.routine_exercises.length, 0
    );

    return (
      <Card className="p-6 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold">{routine.name}</h3>
              {routine.is_active && (
                <Badge className="bg-gradient-primary text-primary-foreground">Active</Badge>
              )}
              {routine.is_public && (
                <Badge variant="outline">
                  <Users size={12} className="mr-1" />
                  Public
                </Badge>
              )}
            </div>
            
            {routine.description && (
              <p className="text-sm text-muted-foreground mb-3">{routine.description}</p>
            )}
            
            {showAuthor && routine.profiles && (
              <p className="text-xs text-muted-foreground mb-2">
                By {routine.profiles.display_name || routine.profiles.username}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{routine.days_per_week} days/week</span>
              </div>
              <div className="flex items-center space-x-1">
                <Settings size={14} />
                <span>{totalExercises} exercises</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2 ml-4">
            {showCopyButton ? (
              <Button 
                size="sm" 
                onClick={() => copyPublicRoutine(routine)}
                className="bg-gradient-primary"
              >
                <Plus size={14} className="mr-1" />
                Copy
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={routine.is_active ? "default" : "outline"}
                  onClick={() => toggleRoutineActive(routine.id, routine.is_active)}
                >
                  {routine.is_active ? (
                    <>
                      <Play size={14} className="mr-1" />
                      Active
                    </>
                  ) : (
                    "Activate"
                  )}
                </Button>
                <Link to={`/routines/${routine.id}/edit`}>
                  <Button size="sm" variant="outline" className="w-full">
                    Edit
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Days:</h4>
          <div className="flex flex-wrap gap-1">
            {routine.routine_days.map((day, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {day.name}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout title="Workout Routines">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 bg-gradient-card shadow-card">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Workout Routines">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Workout Routines</h1>
          <Link to="/routines/create">
            <Button className="bg-gradient-primary">
              <Plus size={16} className="mr-2" />
              Create Routine
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="my-routines" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-routines">My Routines ({myRoutines.length})</TabsTrigger>
            <TabsTrigger value="public-routines">
              <Star size={16} className="mr-2" />
              Popular Routines
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-routines" className="space-y-4">
            {myRoutines.length === 0 ? (
              <Card className="p-8 bg-gradient-card shadow-card text-center">
                <div className="text-muted-foreground">
                  <Calendar size={32} className="mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No routines yet</h3>
                  <p className="mb-4">Create your first workout routine to get started!</p>
                  <Link to="/routines/create">
                    <Button className="bg-gradient-primary">
                      <Plus size={16} className="mr-2" />
                      Create Your First Routine
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {myRoutines.map((routine) => (
                  <RoutineCard key={routine.id} routine={routine} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="public-routines" className="space-y-4">
            {publicRoutines.length === 0 ? (
              <Card className="p-8 bg-gradient-card shadow-card text-center">
                <div className="text-muted-foreground">
                  <Users size={32} className="mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No public routines available</h3>
                  <p>Check back later for community-shared routines!</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {publicRoutines.map((routine) => (
                  <RoutineCard 
                    key={routine.id} 
                    routine={routine} 
                    showAuthor={true}
                    showCopyButton={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default WorkoutRoutines;