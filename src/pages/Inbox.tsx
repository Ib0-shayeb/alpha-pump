import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PlanTypeDialog } from "@/components/PlanTypeDialog";

interface Notification {
  id: string;
  type: 'connection_request' | 'routine_recommendation' | 'connection_accepted' | 'routine_accepted';
  title: string;
  message: string | null;
  data: {
    trainer_id?: string;
    client_id?: string;
    routine_id?: string;
    recommendation_id?: string;
    plan_type?: 'strict' | 'flexible';
  } | null;
  read: boolean;
  created_at: string;
  trainer?: {
    display_name: string;
    username: string;
  };
  client?: {
    display_name: string;
    username: string;
  };
  routine?: {
    name: string;
    description: string;
    days_per_week?: number;
  };
}

export const Inbox = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlanTypeDialogOpen, setIsPlanTypeDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<{
    notificationId: string;
    recommendationId: string;
    routineId: string;
    routineName: string;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data based on notification type
      const enrichedNotifications = await Promise.all(
        (data || []).map(async (notification) => {
          let enriched: Notification = { ...notification } as Notification;
          const notificationData = notification.data as any;
          
          if (notification.type === 'connection_request' && notificationData?.trainer_id) {
            const { data: trainer } = await supabase
              .from('profiles')
              .select('display_name, username')
              .eq('user_id', notificationData.trainer_id)
              .maybeSingle();
            enriched.trainer = trainer || undefined;
          }
          
          if (notification.type === 'routine_recommendation' && notificationData?.routine_id) {
            // Get routine details with days count
            const { data: routine, error: routineError } = await supabase
              .from('workout_routines')
              .select('name, description, days_per_week')
              .eq('id', notificationData.routine_id)
              .maybeSingle();
            
            enriched.routine = routine || undefined;
            
            // Get recommendation_id by looking up the routine_recommendations table
            const { data: recommendation } = await supabase
              .from('routine_recommendations')
              .select('id')
              .eq('routine_id', notificationData.routine_id)
              .eq('trainer_id', notificationData.trainer_id)
              .eq('client_id', user.id)
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
              .maybeSingle();
            
            if (recommendation) {
              enriched.data = {
                ...notificationData,
                recommendation_id: recommendation.id
              };
            }

            // Get trainer info for routine recommendations
            if (notificationData?.trainer_id) {
              const { data: trainer } = await supabase
                .from('profiles')
                .select('display_name, username')
                .eq('user_id', notificationData.trainer_id)
                .maybeSingle();
              enriched.trainer = trainer || undefined;
            }
          }
          
          return enriched;
        })
      );

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleConnectionRequest = async (notificationId: string, trainerId: string, accept: boolean) => {
    try {
      // Update connection status
      const { error: connectionError } = await supabase
        .from('trainer_client_connections')
        .update({ 
          status: accept ? 'accepted' : 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('trainer_id', trainerId)
        .eq('client_id', user?.id);

      if (connectionError) throw connectionError;

      if (accept) {
        // Create notification for trainer
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: trainerId,
            type: 'connection_accepted',
            title: 'Connection Accepted',
            message: 'A client has accepted your connection request',
            data: { client_id: user?.id }
          });

        if (notificationError) throw notificationError;
      }

      // Mark notification as read and remove it
      await markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      toast({
        title: accept ? "Connection accepted" : "Connection declined",
        description: accept ? "You are now connected with this trainer" : "Connection request declined",
      });
    } catch (error) {
      console.error('Error handling connection request:', error);
      toast({
        title: "Error",
        description: "Failed to handle request",
        variant: "destructive",
      });
    }
  };

  const handleRoutineRecommendation = async (notificationId: string, recommendationId: string, accept: boolean) => {
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification || !notification.data) {
      toast({
        title: "Error",
        description: "Notification data not found",
        variant: "destructive",
      });
      return;
    }

    // If no recommendationId provided, try to find it
    let actualRecommendationId = recommendationId;
    if (!actualRecommendationId && notification.data) {
      console.log('Looking up recommendation for:', {
        routine_id: notification.data.routine_id,
        trainer_id: notification.data.trainer_id,
        client_id: user?.id
      });
      
      const { data: recommendation, error: recError } = await supabase
        .from('routine_recommendations')
        .select('id')
        .eq('routine_id', notification.data.routine_id)
        .eq('trainer_id', notification.data.trainer_id)
        .eq('client_id', user?.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      console.log('Recommendation lookup result:', { recommendation, recError });
      
      if (recommendation) {
        actualRecommendationId = recommendation.id;
      } else {
        toast({
          title: "Error", 
          description: "Recommendation not found in database",
          variant: "destructive",
        });
        return;
      }
    }

    if (!accept) {
      // Handle decline directly
      try {
        const { error } = await supabase
          .from('routine_recommendations')
          .update({ status: 'declined' })
          .eq('id', actualRecommendationId);

        if (error) throw error;

        await markAsRead(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        toast({
          title: "Routine declined",
          description: "Routine recommendation declined",
        });
      } catch (error) {
        console.error('Error declining routine recommendation:', error);
        toast({
          title: "Error",
          description: "Failed to decline recommendation",
          variant: "destructive",
        });
      }
      return;
    }

    // For accept, show plan type dialog
    if (notification && notification.routine) {
      setSelectedRecommendation({
        notificationId,
        recommendationId: actualRecommendationId,
        routineId: notification.data?.routine_id || '',
        routineName: notification.routine.name
      });
      setIsPlanTypeDialogOpen(true);
    }
  };

  const handleConfirmRoutineAcceptance = async (planType: 'strict' | 'flexible') => {
    if (!selectedRecommendation || !user) return;

    try {
      // Update recommendation status
      const { error: updateError } = await supabase
        .from('routine_recommendations')
        .update({ status: 'accepted' })
        .eq('id', selectedRecommendation.recommendationId);

      if (updateError) throw updateError;

      // Create client routine assignment
      const { error: assignmentError } = await supabase
        .from('client_routine_assignments')
        .insert({
          client_id: user.id,
          routine_id: selectedRecommendation.routineId,
          plan_type: planType,
          start_date: new Date().toISOString().split('T')[0], // Today
          is_active: true
        });

      if (assignmentError) throw assignmentError;

      // Mark notification as read and remove it
      await markAsRead(selectedRecommendation.notificationId);
      setNotifications(prev => prev.filter(n => n.id !== selectedRecommendation.notificationId));

      // Create notification for trainer about accepted recommendation
      const { error: trainerNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: (notifications.find(n => n.id === selectedRecommendation.notificationId)?.data as any)?.trainer_id,
          type: 'routine_accepted',
          title: 'Routine Accepted',
          message: `Your routine recommendation "${selectedRecommendation.routineName}" was accepted`,
          data: { 
            client_id: user.id,
            routine_id: selectedRecommendation.routineId,
            plan_type: planType
          }
        });

      if (trainerNotificationError) {
        console.error('Error creating trainer notification:', trainerNotificationError);
      }

      toast({
        title: "Routine accepted",
        description: `The routine has been added with ${planType} plan type`,
      });

      setIsPlanTypeDialogOpen(false);
      setSelectedRecommendation(null);
    } catch (error) {
      console.error('Error accepting routine recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to accept recommendation",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return Bell;
      case 'routine_recommendation':
        return Calendar;
      case 'connection_accepted':
        return Check;
      case 'routine_accepted':
        return Check;
      default:
        return Bell;
    }
  };

  return (
    <Layout title="Inbox">
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="h-8 bg-muted rounded w-1/4"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            
            return (
              <Card 
                key={notification.id} 
                className={`p-4 ${!notification.read ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon size={20} className="text-primary mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.read && <Badge variant="secondary" className="h-5">New</Badge>}
                      </div>
                      
                      {notification.type === 'connection_request' && notification.trainer && (
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            <button 
                              onClick={() => window.open(`/trainer/${notification.data?.trainer_id}`, '_blank')}
                              className="text-primary hover:underline font-medium"
                            >
                              {notification.trainer.display_name}
                            </button> (@{notification.trainer.username}) wants to connect with you as your trainer
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Click the trainer's name to view their profile and learn more about them.
                          </div>
                        </div>
                      )}
                      
                      {notification.type === 'routine_recommendation' && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm text-muted-foreground">Recommended by:</span>
                            {notification.trainer ? (
                              <button 
                                onClick={() => window.open(`/trainer/${notification.data?.trainer_id}`, '_blank')}
                                className="text-primary hover:underline font-semibold"
                              >
                                {notification.trainer.display_name || notification.trainer.username || 'Unknown Trainer'}
                              </button>
                            ) : (
                              <span className="font-semibold text-muted-foreground">Trainer</span>
                            )}
                          </div>
                          
                          {notification.routine ? (
                            <div className="bg-muted/50 p-3 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm">{notification.routine.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {notification.routine.days_per_week || 0} days/week
                                </Badge>
                              </div>
                              {notification.routine.description && (
                                <p className="text-xs text-muted-foreground">{notification.routine.description}</p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-muted/50 p-3 rounded">
                              <p className="text-sm text-muted-foreground">Loading routine details...</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {notification.type === 'connection_accepted' && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>
                      )}
                      
                      {notification.type === 'routine_accepted' && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                      {notification.type === 'connection_request' && notification.data?.trainer_id && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleConnectionRequest(notification.id, notification.data!.trainer_id!, false)}
                          >
                            <X size={14} />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleConnectionRequest(notification.id, notification.data!.trainer_id!, true)}
                          >
                            <Check size={14} />
                          </Button>
                        </>
                      )}
                    
                      {notification.type === 'routine_recommendation' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRoutineRecommendation(notification.id, notification.data?.recommendation_id || '', false)}
                          >
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleRoutineRecommendation(notification.id, notification.data?.recommendation_id || '', true)}
                          >
                            Accept
                          </Button>
                        </>
                      )}
                    
                    {notification.type === 'connection_accepted' && !notification.read && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                    
                    {notification.type === 'routine_accepted' && !notification.read && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center">
            <Bell size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </Card>
        )}
        
        <PlanTypeDialog
          open={isPlanTypeDialogOpen}
          onOpenChange={setIsPlanTypeDialogOpen}
          routineId={selectedRecommendation?.routineId || ''}
          routineName={selectedRecommendation?.routineName || ''}
          onConfirm={handleConfirmRoutineAcceptance}
        />
      </div>
    </Layout>
  );
};