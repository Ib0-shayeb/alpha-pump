import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, MessageSquare, Share2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  content?: string;
  post_type: string;
  created_at: string;
  profiles: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
  post_likes: { id: string }[];
}

export const SocialActivityWidget = () => {
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get following users' posts
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = following?.map(f => f.following_id) || [];
      
      if (followingIds.length > 0) {
        // Get posts from following users
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, content, post_type, created_at, user_id')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(5);

        // Get user profiles and likes separately
        const postsWithDetails = await Promise.all(
          (postsData || []).map(async (post) => {
            const [profileResult, likesResult] = await Promise.all([
              supabase.from('profiles').select('display_name, username, avatar_url').eq('user_id', post.user_id).single(),
              supabase.from('post_likes').select('id').eq('post_id', post.id)
            ]);

            return {
              ...post,
              profiles: profileResult.data || { display_name: 'Anonymous', username: null, avatar_url: null },
              post_likes: likesResult.data || []
            };
          })
        );

        setRecentPosts(postsWithDetails);
      }

      setFollowingCount(followingIds.length);
    } catch (error) {
      console.error('Error fetching social data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-card shadow-card border-border/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Social Activity
        </h3>
        <Link to="/social">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </div>

      {followingCount === 0 ? (
        <div className="text-center py-6">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h4 className="font-medium mb-2">Connect with Others</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Follow other users to see their fitness journey and get motivated!
          </p>
          <Link to="/discover">
            <Button size="sm" className="bg-gradient-primary">
              <Users className="w-4 h-4 mr-2" />
              Discover Users
            </Button>
          </Link>
        </div>
      ) : recentPosts.length === 0 ? (
        <div className="text-center py-6">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h4 className="font-medium mb-2">No Recent Activity</h4>
          <p className="text-sm text-muted-foreground mb-4">
            The people you follow haven't posted recently.
          </p>
          <Link to="/social">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share Your Workout
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {recentPosts.slice(0, 3).map((post) => (
            <div key={post.id} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.profiles?.avatar_url} />
                <AvatarFallback>
                  {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">
                    {post.profiles?.display_name || post.profiles?.username || 'Anonymous'}
                  </p>
                  {post.post_type === 'workout_summary' && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                      Workout
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {post.content}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {post.post_likes?.length || 0}
                  </span>
                  <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))}
          
          <Link to="/social">
            <Button variant="outline" size="sm" className="w-full">
              View More Activity
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
};