import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, UserPlus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Client {
  user_id: string;
  display_name: string;
  username: string;
  email?: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface SearchResult {
  user_id: string;
  display_name: string;
  username: string;
  email?: string;
}

export const TrainerView = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;

    try {
      const { data: connections, error } = await supabase
        .from('trainer_client_connections')
        .select(`
          client_id,
          status,
          profiles!trainer_client_connections_client_id_fkey (
            user_id,
            display_name,
            username
          )
        `)
        .eq('trainer_id', user.id);

      if (error) throw error;

      const formattedClients = connections?.map(conn => ({
        user_id: conn.client_id,
        display_name: conn.profiles?.display_name || 'Unknown',
        username: conn.profiles?.username || 'unknown',
        status: conn.status as 'pending' | 'accepted' | 'declined'
      })) || [];

      setClients(formattedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, username')
        .neq('user_id', user?.id)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(profiles || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const sendConnectionRequest = async (clientId: string) => {
    if (!user) return;

    try {
      const { error: connectionError } = await supabase
        .from('trainer_client_connections')
        .insert({
          trainer_id: user.id,
          client_id: clientId,
          requested_by: 'trainer'
        });

      if (connectionError) throw connectionError;

      // Create notification for client
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: clientId,
          type: 'connection_request',
          title: 'New Connection Request',
          message: 'A trainer wants to connect with you',
          data: { trainer_id: user.id }
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Request sent",
        description: "Connection request sent successfully",
      });

      // Remove from search results
      setSearchResults(prev => prev.filter(result => result.user_id !== clientId));
      fetchClients(); // Refresh clients list
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

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      accepted: "default",
      declined: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Layout title="Trainer Dashboard">
      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users size={16} />
            My Clients
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <UserPlus size={16} />
            Find Clients
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : clients.length > 0 ? (
            <div className="space-y-3">
              {clients.map((client) => (
                <Card key={client.user_id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{client.display_name}</h3>
                      <p className="text-sm text-muted-foreground">@{client.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(client.status)}
                      {client.status === 'accepted' && (
                        <Button size="sm" variant="outline">
                          Recommend Routine
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No clients yet</h3>
              <p className="text-muted-foreground">Search for clients to start building connections</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={searching}>
              <Search size={16} />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((result) => (
                <Card key={result.user_id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{result.display_name}</h3>
                      <p className="text-sm text-muted-foreground">@{result.username}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => sendConnectionRequest(result.user_id)}
                      className="flex items-center gap-2"
                    >
                      <Send size={14} />
                      Connect
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <Card className="p-8 text-center">
              <Search size={48} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">Try searching with different keywords</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};