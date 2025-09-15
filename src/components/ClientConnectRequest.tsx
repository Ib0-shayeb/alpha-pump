import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Send, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Trainer {
  user_id: string;
  display_name: string;
  username: string;
}

export const ClientConnectRequest = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Trainer[]>([]);
  const [searching, setSearching] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const searchTrainers = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, email')
        .eq('role', 'trainer')
        .neq('user_id', user?.id)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(profiles || []);
    } catch (error) {
      console.error('Error searching trainers:', error);
      toast({
        title: "Error",
        description: "Failed to search trainers",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const sendConnectionRequest = async (trainerId: string) => {
    if (!user) return;

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

      // Remove from search results
      setSearchResults(prev => prev.filter(result => result.user_id !== trainerId));
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

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus size={20} className="text-primary" />
        <h3 className="font-medium">Connect with a Trainer</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search trainers by username, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchTrainers()}
          />
          <Button onClick={searchTrainers} disabled={searching} size="sm">
            <Search size={16} />
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((trainer) => (
              <div key={trainer.user_id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium text-sm">{trainer.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{trainer.username}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => sendConnectionRequest(trainer.user_id)}
                  className="flex items-center gap-1"
                >
                  <Send size={12} />
                  Connect
                </Button>
              </div>
            ))}
          </div>
        )}

        {searchQuery && searchResults.length === 0 && !searching && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No trainers found. Try different search terms.
          </p>
        )}
      </div>
    </Card>
  );
};