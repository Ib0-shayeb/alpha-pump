import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, UserX, Dumbbell, Calendar, Target, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { WorkoutCalendar } from "@/components/WorkoutCalendar";
import { PlanTypeDialog } from "@/components/PlanTypeDialog";

interface ClientProfile {
  user_id: string;
  display_name: string;
  username: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  fitness_goals?: string[];
  activity_level?: string;
  height?: number;
  weight?: number;
  status: 'pending' | 'accepted' | 'declined';
  trainer_can_see_weight?: boolean;
  trainer_can_see_height?: boolean;
  trainer_can_see_personal_info?: boolean;
  trainer_can_see_workout_history?: boolean;
}

interface WorkoutSession {
  id: string;
  name: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  exercise_count: number;
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

interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  days_per_week: number;
  created_at: string;
}

export const ClientDetails = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [activeRoutines, setActiveRoutines] = useState<ActiveRoutine[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const [activeRoutinesLoading, setActiveRoutinesLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
  const [isPlanTypeDialogOpen, setIsPlanTypeDialogOpen] = useState(false);
  const [selectedRoutineForAssignment, setSelectedRoutineForAssignment] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchClientDetails();
  }, [clientId, user]);

  const fetchClientDetails = async () => {
    if (!clientId || !user) return;

    try {
      // Fetch client details with connection status
      const { data: connection, error: connectionError } = await supabase
        .from('trainer_client_connections')
        .select(`
          status,
          profiles!trainer_client_connections_client_id_fkey (
            user_id,
            display_name,
            username,
            email,
            bio,
            avatar_url,
            fitness_goals,
            activity_level,
            height,
            weight,
            trainer_can_see_weight,
            trainer_can_see_height,
            trainer_can_see_personal_info,
            trainer_can_see_workout_history
          )
        `)
        .eq('trainer_id', user.id)
        .eq('client_id', clientId)
        .single();

      if (connectionError) throw connectionError;

      if (connection?.profiles) {
        setClient({
          ...connection.profiles,
          status: connection.status
        } as ClientProfile);
        
        // Fetch workout history if client allows it
        if (connection.profiles.trainer_can_see_workout_history) {
          fetchWorkoutHistory();
        }
        
        // Fetch active routines
        fetchActiveRoutines();
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast({
        title: "Error",
        description: "Failed to load client details",
        variant: "destructive",
      });
      navigate('/trainer');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveRoutines = async () => {
    if (!clientId) return;

    setActiveRoutinesLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_routine_assignments')
        .select(`
          id,
          routine_id,
          plan_type,
          start_date,
          workout_routines (
            name,
            description,
            days_per_week
          )
        `)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const formattedRoutines = data?.map(assignment => ({
        id: assignment.id,
        routine_id: assignment.routine_id,
        plan_type: assignment.plan_type as 'strict' | 'flexible',
        start_date: assignment.start_date,
        routine: assignment.workout_routines
      })).filter(assignment => assignment.routine) || [];

      setActiveRoutines(formattedRoutines as ActiveRoutine[]);
    } catch (error) {
      console.error('Error fetching active routines:', error);
      toast({
        title: "Error",
        description: "Failed to load active routines",
        variant: "destructive",
      });
    } finally {
      setActiveRoutinesLoading(false);
    }
  };

  const fetchWorkoutHistory = async () => {
    if (!clientId) return;

    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          name,
          start_time,
          end_time,
          notes,
          workout_exercises (count)
        `)
        .eq('user_id', clientId)
        .order('start_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedHistory = data?.map(session => ({
        ...session,
        exercise_count: session.workout_exercises?.[0]?.count || 0
      })) || [];

      setWorkoutHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching workout history:', error);
      toast({
        title: "Error",
        description: "Failed to load workout history",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchTrainerRoutines = async () => {
    if (!user) return;

    setRoutinesLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .select('id, name, description, days_per_week, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
      toast({
        title: "Error",
        description: "Failed to load routines",
        variant: "destructive",
      });
    } finally {
      setRoutinesLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!clientId || !user) return;

    try {
      const { error } = await supabase
        .from('trainer_client_connections')
        .update({ status: 'declined' })
        .eq('trainer_id', user.id)
        .eq('client_id', clientId);

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: "Successfully disconnected from client",
      });
      
      navigate('/trainer');
    } catch (error) {
      console.error('Error disconnecting client:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect client",
        variant: "destructive",
      });
    }
  };

  const handleAssignRoutine = async (routineId: string, routineName: string) => {
    setSelectedRoutineForAssignment({ id: routineId, name: routineName });
    setIsRoutineDialogOpen(false);
    setIsPlanTypeDialogOpen(true);
  };

  const handleConfirmPlanAssignment = async (planType: 'strict' | 'flexible') => {
    if (!clientId || !user || !selectedRoutineForAssignment) return;

    try {
      const { error } = await supabase
        .from('routine_recommendations')
        .insert({
          trainer_id: user.id,
          client_id: clientId,
          routine_id: selectedRoutineForAssignment.id,
          message: `Your trainer has recommended the "${selectedRoutineForAssignment.name}" routine with a ${planType} plan.`,
          status: 'pending'
        });

      if (error) throw error;

      // Create notification for client
      await supabase
        .from('notifications')
        .insert({
          user_id: clientId,
          type: 'routine_recommendation',
          title: 'New Routine Recommendation',
          message: `Your trainer has recommended a new routine: ${selectedRoutineForAssignment.name}`,
          data: { 
            routine_id: selectedRoutineForAssignment.id, 
            trainer_id: user.id,
            plan_type: planType
          }
        });

      toast({
        title: "Routine Assigned",
        description: `Successfully recommended "${selectedRoutineForAssignment.name}" with ${planType} plan to ${client?.display_name}`,
      });
      
      setIsPlanTypeDialogOpen(false);
      setSelectedRoutineForAssignment(null);
    } catch (error: any) {
      console.error('Error assigning routine:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate') ? 
          "Routine already recommended to this client" : "Failed to assign routine",
        variant: "destructive",
      });
    }
  };

  const handleOpenRoutineDialog = () => {
    setIsRoutineDialogOpen(true);
    fetchTrainerRoutines();
  };

  if (loading) {
    return (
      <Layout title="Client Details">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <Card className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout title="Client Not Found">
        <Card className="p-8 text-center">
          <User size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Client not found</h3>
          <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist or you don't have access to view them.</p>
          <Button onClick={() => navigate('/trainer')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Clients
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title={`Client: ${client.display_name}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/trainer')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Clients
          </Button>
        </div>

        {/* Client Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {client.avatar_url ? (
                    <img 
                      src={client.avatar_url} 
                      alt={client.display_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl">{client.display_name}</CardTitle>
                  <p className="text-muted-foreground">@{client.username}</p>
                  {client.email && (
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={client.status === 'accepted' ? 'default' : 'secondary'}>
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </Badge>
                
                {/* Quick Actions */}
                {client.status === 'accepted' && (
                  <Button 
                    onClick={handleOpenRoutineDialog}
                    size="sm"
                    className="ml-2"
                  >
                    <Dumbbell size={14} className="mr-1" />
                    Assign Routine
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.bio && (
              <div>
                <h4 className="font-medium mb-2">Bio</h4>
                <p className="text-muted-foreground">{client.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.trainer_can_see_personal_info && client.fitness_goals && client.fitness_goals.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target size={16} />
                    Fitness Goals
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {client.fitness_goals.map((goal, index) => (
                      <Badge key={index} variant="outline">{goal}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {client.trainer_can_see_personal_info && client.activity_level && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Dumbbell size={16} />
                    Activity Level
                  </h4>
                  <Badge variant="outline">{client.activity_level.replace('_', ' ')}</Badge>
                </div>
              )}

              {((client.trainer_can_see_height && client.height) || (client.trainer_can_see_weight && client.weight)) && (
                <div>
                  <h4 className="font-medium mb-2">Physical Stats</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {client.trainer_can_see_height && client.height && <p>Height: {client.height} cm</p>}
                    {client.trainer_can_see_weight && client.weight && <p>Weight: {client.weight} kg</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Privacy Information */}
            {(!client.trainer_can_see_personal_info || !client.trainer_can_see_height || !client.trainer_can_see_weight || !client.trainer_can_see_workout_history) && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Some client information is private and not visible to trainers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Routines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} />
              Active Routines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRoutinesLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : activeRoutines.length > 0 ? (
              <div className="space-y-3">
                {activeRoutines.map((assignment) => (
                  <div key={assignment.id} className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{assignment.routine.name}</h4>
                          <Badge variant={assignment.plan_type === 'flexible' ? 'secondary' : 'default'}>
                            {assignment.plan_type === 'flexible' ? 'Flexible Plan' : 'Strict Plan'}
                          </Badge>
                        </div>
                        {assignment.routine.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {assignment.routine.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {assignment.routine.days_per_week} days/week
                          </span>
                          <span>
                            Started: {new Date(assignment.start_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar size={32} className="mx-auto mb-2" />
                <p>No active routines</p>
                <p className="text-sm">Assign a routine to get this client started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Calendar */}
        <WorkoutCalendar 
          clientId={clientId!} 
          canSeeWorkoutHistory={client.trainer_can_see_workout_history || false}
        />

        {/* Workout History */}
        {client.trainer_can_see_workout_history && client.status === 'accepted' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Recent Workout History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : workoutHistory.length > 0 ? (
                <div className="space-y-3">
                  {workoutHistory.map((session) => (
                    <div key={session.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{session.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.start_time).toLocaleDateString()} at {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {session.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{session.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{session.exercise_count} exercises</p>
                          {session.end_time && (
                            <p className="text-sm text-muted-foreground">
                              {Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))} min
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell size={32} className="mx-auto mb-2" />
                  <p>No workout history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Actions */}
        {client.status === 'accepted' && (
          <div className="flex gap-3">
            <Dialog open={isRoutineDialogOpen} onOpenChange={setIsRoutineDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign Routine to {client.display_name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {routinesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-muted rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : routines.length > 0 ? (
                    routines.map((routine) => (
                      <Card key={routine.id} className="p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{routine.name}</h4>
                            {routine.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">{routine.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar size={12} className="text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {routine.days_per_week} days/week
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleAssignRoutine(routine.id, routine.name)}
                          >
                            Assign
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-6 text-center">
                      <Dumbbell size={32} className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No routines available</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => navigate(`/routines/create?returnTo=/trainer/client/${clientId}`)}
                        className="mt-2"
                      >
                        Create a routine first
                      </Button>
                    </Card>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="destructive" 
              onClick={handleDisconnect}
              className="flex items-center gap-2"
            >
              <UserX size={16} />
              Disconnect Client
            </Button>
          </div>
        )}
        
        <PlanTypeDialog
          open={isPlanTypeDialogOpen}
          onOpenChange={setIsPlanTypeDialogOpen}
          routineId={selectedRoutineForAssignment?.id || ''}
          routineName={selectedRoutineForAssignment?.name || ''}
          onConfirm={handleConfirmPlanAssignment}
        />
      </div>
    </Layout>
  );
};