import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Edit, 
  Users, 
  UserPlus, 
  Heart, 
  MessageCircle, 
  Share, 
  Calendar, 
  Clock, 
  Dumbbell, 
  Trophy,
  Settings,
  Target,
  Activity,
  Ruler,
  Weight,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  activity_level?: string;
  height?: number;
  weight?: number;
  followerCount?: number;
  followingCount?: number;
  friendCount?: number;
  created_at: string;
}

interface Post {
  id: string;
  content?: string;
  post_type: 'general' | 'workout' | 'workout_summary';
  workout_session_id?: string;
  created_at: string;
  workout_session?: {
    name: string;
    start_time: string;
    end_time?: string;
  };
  post_likes: { id: string; user_id: string }[];
  post_comments: { id: string; content: string; profiles: { display_name?: string } }[];
}

interface Follower {
  id: string;
  follower_id: string;
  created_at: string;
  profiles: {
    user_id: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
  };
}

const UserProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      console.log('User found, starting to fetch data:', user.id);
      setLoading(true);
      fetchProfile();
      fetchPosts();
      fetchFollowers();
      fetchFollowing();
    } else {
      console.log('No user found');
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      console.log('Fetching profile for user:', user.id);
      
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Profile query error:', error);
        // If profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating basic profile');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              display_name: user.email?.split('@')[0] || 'User',
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }
          
          console.log('Created new profile:', newProfile);
          data = newProfile;
        } else {
          throw error;
        }
      }

      console.log('Profile data:', data);

      // Get follower/following/friends counts
      const [{ count: followerCount }, { count: followingCount }, { count: friendCount }] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', user.id),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id),
        supabase
          .from('friends')
          .select('id', { count: 'exact', head: true })
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      ]);

      console.log('Follower counts:', { followerCount, followingCount });

      setProfile({
        ...data,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        friendCount: friendCount || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!user) return;

    try {
      // First get the posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Get workout sessions and profiles for posts that have them
      const postsWithWorkoutSessions = await Promise.all(
        (postsData || []).map(async (post) => {
          let workoutSession = null;
          
          if (post.workout_session_id) {
            const { data: sessionData } = await supabase
              .from('workout_sessions')
              .select('name, start_time, end_time')
              .eq('id', post.workout_session_id)
              .single();
            workoutSession = sessionData;
          }

          // Get profile data for the post author
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, username, avatar_url')
            .eq('user_id', post.user_id)
            .single();

          return {
            ...post,
            workout_session: workoutSession,
            profiles: profileData || { display_name: 'Anonymous', username: null, avatar_url: null }
          };
        })
      );

      // Get likes for all posts
      const postIds = postsData.map(post => post.id);
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('id, user_id, post_id')
        .in('post_id', postIds);

      // Get comments for all posts
      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('id, content, user_id, post_id')
        .in('post_id', postIds);

      // Get comment authors
      const commentUserIds = [...new Set(commentsData?.map(comment => comment.user_id) || [])];
      const { data: commentProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', commentUserIds);

      // Combine all data
      const postsWithAllData = postsWithWorkoutSessions.map(post => {
        const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
        const postComments = (commentsData?.filter(comment => comment.post_id === post.id) || []).map(comment => ({
          ...comment,
          profiles: commentProfiles?.find(profile => profile.user_id === comment.user_id) || { display_name: 'Anonymous' }
        }));

        return {
          ...post,
          post_type: post.post_type as 'general' | 'workout' | 'workout_summary',
          post_likes: postLikes,
          post_comments: postComments
        };
      });

      setPosts(postsWithAllData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    }
  };

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

      setFollowing(followingWithProfiles as any);
    } catch (error) {
      console.error('Error fetching following:', error);
      toast.error('Failed to load following');
    }
  };


  const formatWorkoutDuration = (start: string, end?: string) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <Layout title="My Profile">
        <div className="space-y-6">
          <Card className="p-6 animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout title="My Profile">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Profile not found</h2>
          <p className="text-muted-foreground">Unable to load your profile.</p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.[0] || profile.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || profile.username || 'Anonymous'}
                </h1>
                {profile.username && profile.display_name && (
                  <span className="text-muted-foreground">@{profile.username}</span>
                )}
              </div>

              {/* Role Badge */}
              {profile.role === 'trainer' && (
                <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary">
                  <Dumbbell className="w-3 h-3 mr-1" />
                  Trainer
                </Badge>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-6 text-sm">
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/profile/followers')}
                >
                  <div className="font-semibold text-lg">{profile.followerCount}</div>
                  <div className="text-muted-foreground">Followers</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/profile/followers')}
                >
                  <div className="font-semibold text-lg">{profile.followingCount}</div>
                  <div className="text-muted-foreground">Following</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/profile/followers')}
                >
                  <div className="font-semibold text-lg">{profile.friendCount}</div>
                  <div className="text-muted-foreground">Friends</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{posts.length}</div>
                  <div className="text-muted-foreground">Posts</div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              onClick={() => navigate('/profile/edit')}
              variant="outline"
              size="lg"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </Card>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Info */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.height && (
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Height:</span>
                  <span>{profile.height} cm</span>
                </div>
              )}
              {profile.weight && (
                <div className="flex items-center gap-2">
                  <Weight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Weight:</span>
                  <span>{profile.weight} kg</span>
                </div>
              )}
              {profile.activity_level && (
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Activity Level:</span>
                  <span className="capitalize">{profile.activity_level}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Member since:</span>
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Fitness Goals */}
          {profile.fitness_goals && profile.fitness_goals.length > 0 && (
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Fitness Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.fitness_goals.map((goal) => (
                    <Badge key={goal} variant="outline">
                      {goal.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Posts Section */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Posts ({posts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  Share your fitness journey with the community!
                </p>
              </div>
            ) : (
              posts.map((post) => {
                const likeCount = post.post_likes.length;
                const commentCount = post.post_comments.length;

                return (
                  <Card key={post.id} className="p-6 bg-gradient-card shadow-card border-border/50">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {profile.display_name || profile.username || 'Anonymous'}
                          </h3>
                          {post.post_type === 'workout' && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              <Dumbbell className="w-3 h-3 mr-1" />
                              Workout
                            </Badge>
                          )}
                          {post.post_type === 'workout_summary' && (
                            <Badge variant="secondary" className="bg-accent/10 text-accent">
                              <Trophy className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Workout Info */}
                    {post.workout_session && (
                      <div className="mb-4 p-4 bg-background/50 rounded-lg border border-border/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{post.workout_session.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(post.workout_session.start_time).toLocaleDateString()}
                              <Clock className="w-4 h-4 ml-2" />
                              {formatWorkoutDuration(post.workout_session.start_time, post.workout_session.end_time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Post Content */}
                    {post.content && (
                      <div className="mb-4">
                        <p className="text-foreground leading-relaxed">{post.content}</p>
                      </div>
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center gap-6 pt-4 border-t border-border/30">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>


      </div>
    </Layout>
  );
};

export default UserProfilePage;
