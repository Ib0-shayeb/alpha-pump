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
  const [loading, setLoading] = useState(true);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);

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
            weight
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
    if (!clientId || !user) return;

    try {
      const { error } = await supabase
        .from('routine_recommendations')
        .insert({
          trainer_id: user.id,
          client_id: clientId,
          routine_id: routineId,
          message: `Your trainer has recommended the "${routineName}" routine for you.`,
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
          message: `Your trainer has recommended a new routine: ${routineName}`,
          data: { routine_id: routineId, trainer_id: user.id }
        });

      toast({
        title: "Routine Assigned",
        description: `Successfully recommended "${routineName}" to ${client?.display_name}`,
      });
      
      setIsRoutineDialogOpen(false);
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
              <Badge variant={client.status === 'accepted' ? 'default' : 'secondary'}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
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
              {client.fitness_goals && client.fitness_goals.length > 0 && (
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

              {client.activity_level && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Dumbbell size={16} />
                    Activity Level
                  </h4>
                  <Badge variant="outline">{client.activity_level.replace('_', ' ')}</Badge>
                </div>
              )}

              {(client.height || client.weight) && (
                <div>
                  <h4 className="font-medium mb-2">Physical Stats</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {client.height && <p>Height: {client.height} cm</p>}
                    {client.weight && <p>Weight: {client.weight} kg</p>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {client.status === 'accepted' && (
          <div className="flex gap-3">
            <Dialog open={isRoutineDialogOpen} onOpenChange={setIsRoutineDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenRoutineDialog} className="flex items-center gap-2">
                  <Dumbbell size={16} />
                  Assign Routine
                </Button>
              </DialogTrigger>
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
      </div>
    </Layout>
  );
};