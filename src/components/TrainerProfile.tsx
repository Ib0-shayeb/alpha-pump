import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Award, Clock, Users, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";

interface TrainerProfileData {
  user_id: string;
  display_name: string;
  username: string;
  email: string;
  bio?: string;
  about?: string;
  avatar_url?: string;
  rating?: number;
  total_reviews: number;
  years_experience?: number;
  specializations?: string[];
  certifications?: string[];
  date_of_birth?: string;
}

interface ConnectionStatus {
  status: string;
  exists: boolean;
}

export const TrainerProfile = () => {
  const { trainerId } = useParams<{ trainerId: string }>();
  const [trainer, setTrainer] = useState<TrainerProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (trainerId) {
      fetchTrainerProfile();
      checkConnectionStatus();
    }
  }, [trainerId, user]);

  const fetchTrainerProfile = async () => {
    if (!trainerId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', trainerId)
        .eq('role', 'trainer')
        .maybeSingle();

      if (error) throw error;
      setTrainer(data);
    } catch (error) {
      console.error('Error fetching trainer profile:', error);
      toast({
        title: "Error",
        description: "Failed to load trainer profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!user || !trainerId) return;

    try {
      const { data, error } = await supabase
        .from('trainer_client_connections')
        .select('status')
        .eq('trainer_id', trainerId)
        .eq('client_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setConnectionStatus({
        status: data?.status || '',
        exists: !!data
      });
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const sendConnectionRequest = async () => {
    if (!user || !trainerId) return;

    try {
      const { error: connectionError } = await supabase
        .from('trainer_client_connections')
        .insert({
          trainer_id: trainerId,
          client_id: user.id,
          requested_by: 'client'
        });

      if (connectionError) throw connectionError;

      // Create notification for trainer
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: trainerId,
          type: 'connection_request',
          title: 'New Connection Request',
          message: 'A client wants to connect with you',
          data: { client_id: user.id }
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Request sent",
        description: "Connection request sent to trainer",
      });

      // Update connection status
      setConnectionStatus({
        status: 'pending',
        exists: true
      });
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      toast({
        title: "Error",
        description: error.message?.includes('duplicate') ? 
          "Connection request already exists" : "Failed to send request",
        variant: "destructive",
      });
    }
  };

  const handleConnectionRequest = async (accept: boolean) => {
    if (!user || !trainerId) return;

    try {
      const { error } = await supabase
        .from('trainer_client_connections')
        .update({ 
          status: accept ? 'accepted' : 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('trainer_id', trainerId)
        .eq('client_id', user.id);

      if (error) throw error;

      if (accept) {
        // Create notification for trainer
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: trainerId,
            type: 'connection_accepted',
            title: 'Connection Accepted',
            message: 'A client has accepted your connection request',
            data: { client_id: user.id }
          });

        if (notificationError) throw notificationError;
      }

      toast({
        title: accept ? "Connection accepted" : "Connection declined",
        description: accept ? "You are now connected with this trainer" : "Connection request declined",
      });

      // Update connection status
      setConnectionStatus({
        status: accept ? 'accepted' : 'declined',
        exists: true
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

  if (loading) {
    return (
      <Layout title="Trainer Profile">
        <div className="animate-pulse space-y-6">
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!trainer) {
    return (
      <Layout title="Trainer Profile">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-medium mb-2">Trainer not found</h3>
          <p className="text-muted-foreground">The requested trainer profile could not be found.</p>
        </Card>
      </Layout>
    );
  }

  const age = trainer.date_of_birth 
    ? Math.floor((new Date().getTime() - new Date(trainer.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const getConnectionButton = () => {
    if (!connectionStatus?.exists) {
      return (
        <Button onClick={sendConnectionRequest} className="flex items-center gap-2">
          <Send size={16} />
          Connect
        </Button>
      );
    }

    switch (connectionStatus.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => handleConnectionRequest(false)}
            >
              Decline
            </Button>
            <Button onClick={() => handleConnectionRequest(true)}>
              Accept
            </Button>
          </div>
        );
      case 'accepted':
        return <Badge variant="default" className="px-4 py-2">Connected</Badge>;
      case 'declined':
        return <Badge variant="secondary" className="px-4 py-2">Declined</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout title="Trainer Profile">
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={trainer.avatar_url} />
                <AvatarFallback className="text-lg">
                  {trainer.display_name?.split(' ').map(n => n[0]).join('') || 'T'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{trainer.display_name}</h1>
                <p className="text-muted-foreground">@{trainer.username}</p>
                
                <div className="flex items-center gap-4 mt-2">
                  {trainer.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{trainer.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({trainer.total_reviews} review{trainer.total_reviews !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                  {age && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {age} years old
                    </div>
                  )}
                  {trainer.years_experience && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {trainer.years_experience} years experience
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {getConnectionButton()}
            </div>
          </div>
        </Card>

        {/* About Section */}
        {trainer.about && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{trainer.about}</p>
          </Card>
        )}

        {/* Specializations */}
        {trainer.specializations && trainer.specializations.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-3">Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {trainer.specializations.map((spec, index) => (
                <Badge key={index} variant="secondary">
                  {spec}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Certifications */}
        {trainer.certifications && trainer.certifications.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </h2>
            <div className="space-y-2">
              {trainer.certifications.map((cert, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{cert}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};