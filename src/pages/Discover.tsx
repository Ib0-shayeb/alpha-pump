import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users, Dumbbell, Trophy, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface UserProfile {
  user_id: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  role?: string;
  fitness_goals?: string[];
  years_experience?: number;
  rating?: number;
  total_reviews?: number;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
}

const Discover = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      fetchUsers();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      // Fetch all users except current user
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(20);

      if (error) throw error;

      // Get follow status for current user
      const { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = follows?.map(f => f.following_id) || [];

      // Get follower/following counts for each user
      const usersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
            supabase
              .from('user_follows')
              .select('id', { count: 'exact', head: true })
              .eq('following_id', profile.user_id),
            supabase
              .from('user_follows')
              .select('id', { count: 'exact', head: true })
              .eq('follower_id', profile.user_id)
          ]);

          return {
            ...profile,
            isFollowing: followingIds.includes(profile.user_id),
            followerCount: followerCount || 0,
            followingCount: followingCount || 0
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (targetUserId: string, isFollowing: boolean) => {
    if (!user) return;

    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        toast.success('Unfollowed user');
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId
          });
        toast.success('Following user');
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const filteredUsers = users.filter(profile =>
    (profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (profile.username?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (profile.bio?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <Layout title="Discover Users">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Discover Users">
      <div className="space-y-6">
        {/* Search */}
        <Card className="p-4 bg-gradient-card shadow-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-border/50"
            />
          </div>
        </Card>

        {/* Users Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((profile) => (
            <Card key={profile.user_id} className="p-6 bg-gradient-card shadow-card border-border/50">
              <div className="text-center space-y-4">
                {/* Avatar */}
                <Avatar className="w-16 h-16 mx-auto">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div>
                  <h3 className="font-semibold text-lg">
                    {profile.display_name || profile.username || 'Anonymous'}
                  </h3>
                  {profile.username && profile.display_name && (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  )}
                  
                  {/* Role Badge */}
                  {profile.role === 'trainer' && (
                    <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary">
                      <Dumbbell className="w-3 h-3 mr-1" />
                      Trainer
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="flex justify-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{profile.followerCount}</div>
                    <div className="text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{profile.followingCount}</div>
                    <div className="text-muted-foreground">Following</div>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {profile.bio}
                  </p>
                )}

                {/* Fitness Goals */}
                {profile.fitness_goals && profile.fitness_goals.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {profile.fitness_goals.slice(0, 2).map((goal) => (
                      <Badge key={goal} variant="outline" className="text-xs">
                        {goal.replace('_', ' ')}
                      </Badge>
                    ))}
                    {profile.fitness_goals.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.fitness_goals.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Trainer Stats */}
                {profile.role === 'trainer' && (
                  <div className="flex justify-center gap-4 text-sm">
                    {profile.years_experience && (
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-accent" />
                        <span>{profile.years_experience}y exp</span>
                      </div>
                    )}
                    {profile.rating && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>{profile.rating}/5</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => toggleFollow(profile.user_id, profile.isFollowing || false)}
                    variant={profile.isFollowing ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                  >
                    {profile.isFollowing ? (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  
                  <Link to={`/profile/${profile.user_id}`} className="w-full">
                    <Button variant="ghost" size="sm" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="p-8 text-center bg-gradient-card shadow-card">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to join the community!'}
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Discover;