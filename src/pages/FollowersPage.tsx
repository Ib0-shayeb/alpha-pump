import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserPlus, 
  UserMinus,
  MessageCircle,
  Calendar,
  ArrowLeft
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  profiles: {
    user_id: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
  };
}

const FollowersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("followers");

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchFollowers();
      fetchFollowing();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchFollowers = async () => {
    if (!user) return;

    try {
      // First get the follower IDs
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select('id, follower_id, created_at')
        .eq('following_id', user.id)
        .order('created_at', { ascending: false });

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowers([]);
        return;
      }

      // Then get the profile data for each follower
      const followerIds = followsData.map(follow => follow.follower_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio')
        .in('user_id', followerIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const followersWithProfiles = followsData.map(follow => ({
        ...follow,
        following_id: user.id,
        profiles: profilesData?.find(profile => profile.user_id === follow.follower_id) || {
          user_id: follow.follower_id,
          display_name: null,
          username: null,
          avatar_url: null,
          bio: null
        }
      }));

      setFollowers(followersWithProfiles);
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast.error('Failed to load followers');
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;

    try {
      // First get the following IDs
      const { data: followsData, error: followsError } = await supabase
        .from('user_follows')
        .select('id, following_id, created_at')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false });

      if (followsError) throw followsError;

      if (!followsData || followsData.length === 0) {
        setFollowing([]);
        return;
      }

      // Then get the profile data for each following
      const followingIds = followsData.map(follow => follow.following_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio')
        .in('user_id', followingIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const followingWithProfiles = followsData.map(follow => ({
        ...follow,
        follower_id: user.id,
        profiles: profilesData?.find(profile => profile.user_id === follow.following_id) || {
          user_id: follow.following_id,
          display_name: null,
          username: null,
          avatar_url: null,
          bio: null
        }
      }));

      setFollowing(followingWithProfiles);
    } catch (error) {
      console.error('Error fetching following:', error);
      toast.error('Failed to load following');
    }
  };

  const handleUnfollow = async (followingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (error) throw error;

      toast.success('Unfollowed successfully');
      fetchFollowing(); // Refresh the list
    } catch (error) {
      console.error('Error unfollowing:', error);
      toast.error('Failed to unfollow');
    }
  };

  const handleFollow = async (followerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: followerId
        });

      if (error) throw error;

      toast.success('Followed successfully');
      fetchFollowing(); // Refresh the list
    } catch (error) {
      console.error('Error following:', error);
      toast.error('Failed to follow');
    }
  };

  const renderUserCard = (userData: Follower, isFollowing: boolean) => {
    const profile = userData.profiles;
    const userId = isFollowing ? userData.following_id : userData.follower_id;
    const isCurrentUser = userId === user?.id;

    return (
      <Card key={userData.id} className="p-4 bg-gradient-card shadow-card border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>
                {profile.display_name?.[0] || profile.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">
                  {profile.display_name || profile.username || 'Anonymous'}
                </h3>
                {profile.username && profile.display_name && (
                  <span className="text-muted-foreground text-sm">@{profile.username}</span>
                )}
              </div>
              {profile.bio && (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {profile.bio}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {isFollowing ? 'Following since' : 'Followed you'} {formatDistanceToNow(new Date(userData.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isCurrentUser && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/profile/${userId}`)}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  View Profile
                </Button>
                {isFollowing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfollow(userId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <UserMinus className="w-4 h-4 mr-1" />
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFollow(userId)}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Follow Back
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout title="Followers & Following">
        <div className="space-y-6">
          <Card className="p-6 animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Followers & Following">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/profile')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Followers & Following</h1>
            <p className="text-muted-foreground">Manage your social connections</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Following ({following.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Followers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {followers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No followers yet</h3>
                    <p className="text-muted-foreground">
                      Share your profile to start building your community!
                    </p>
                  </div>
                ) : (
                  followers.map((follower) => renderUserCard(follower, false))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  People You Follow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {following.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Not following anyone yet</h3>
                    <p className="text-muted-foreground">
                      Discover and follow other fitness enthusiasts!
                    </p>
                  </div>
                ) : (
                  following.map((follow) => renderUserCard(follow, true))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default FollowersPage;

