import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: 'connection_request' | 'routine_recommendation' | 'connection_accepted';
  title: string;
  message: string | null;
  data: {
    trainer_id?: string;
    client_id?: string;
    routine_id?: string;
    recommendation_id?: string;
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
  };
}

export const Inbox = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
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
            const { data: routine } = await supabase
              .from('workout_routines')
              .select('name, description')
              .eq('id', notificationData.routine_id)
              .maybeSingle();
            enriched.routine = routine || undefined;
            
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
    try {
      // Update recommendation status
      const { error } = await supabase
        .from('routine_recommendations')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', recommendationId);

      if (error) throw error;

      // Mark notification as read and remove it
      await markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      toast({
        title: accept ? "Routine accepted" : "Routine declined",
        description: accept ? "The routine has been added to your collection" : "Routine recommendation declined",
      });
    } catch (error) {
      console.error('Error handling routine recommendation:', error);
      toast({
        title: "Error",
        description: "Failed to handle recommendation",
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
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.trainer.display_name} (@{notification.trainer.username}) wants to connect with you as your trainer
                        </p>
                      )}
                      
                      {notification.type === 'routine_recommendation' && notification.routine && notification.trainer && (
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.trainer.display_name} recommended a workout routine:
                          </p>
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="font-medium text-sm">{notification.routine.name}</p>
                            {notification.routine.description && (
                              <p className="text-xs text-muted-foreground">{notification.routine.description}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {notification.type === 'connection_accepted' && notification.client && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.client.display_name} (@{notification.client.username}) accepted your connection request
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
                    
                      {notification.type === 'routine_recommendation' && notification.data?.recommendation_id && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRoutineRecommendation(notification.id, notification.data!.recommendation_id!, false)}
                          >
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleRoutineRecommendation(notification.id, notification.data!.recommendation_id!, true)}
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
      </div>
    </Layout>
  );
};