import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus, Users, Dumbbell, Trophy, Heart, Calendar, Target } from "lucide-react";
import { UserWorkoutCalendar } from "@/components/UserWorkoutCalendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UserProfileData {
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
  isFollowing?: boolean;
  isFriend?: boolean;
  followsYou?: boolean;
  friendRequestStatus?: 'none' | 'sent' | 'received' | 'pending';
  followerCount?: number;
  followingCount?: number;
  friendCount?: number;
}

export const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get the previous location from state, or default to discover
  const previousLocation = location.state?.from || '/discover';

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId, user]);

  const fetchUserProfile = async () => {
    if (!userId) return;

    try {
      // Fetch user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Get relationship status for current user
      let isFollowing = false;
      let isFriend = false;
      let followsYou = false;
      let friendRequestStatus: 'none' | 'sent' | 'received' | 'pending' = 'none';
      
      if (user && user.id !== userId) {
        // Check if user follows them
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle();
        isFollowing = !!followData;

        // Check if they follow user
        const { data: followerData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', user.id)
          .maybeSingle();
        followsYou = !!followerData;

        // Check if they are friends
        const { data: friendData } = await supabase
          .from('friends')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
          .maybeSingle();
        isFriend = !!friendData;

        // Check friend request status
        if (!isFriend) {
          const { data: sentRequest } = await supabase
            .from('friend_requests')
            .select('status')
            .eq('sender_id', user.id)
            .eq('receiver_id', userId)
            .maybeSingle();

          const { data: receivedRequest } = await supabase
            .from('friend_requests')
            .select('status')
            .eq('sender_id', userId)
            .eq('receiver_id', user.id)
            .maybeSingle();

          if (sentRequest) {
            friendRequestStatus = sentRequest.status === 'pending' ? 'sent' : 'none';
          } else if (receivedRequest) {
            friendRequestStatus = receivedRequest.status === 'pending' ? 'received' : 'none';
          }
        }
      }

      // Get follower/following/friends counts
      const [{ count: followerCount }, { count: followingCount }, { count: friendCount }] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId),
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', userId),
        supabase
          .from('friends')
          .select('id', { count: 'exact', head: true })
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      ]);

      setProfile({
        ...data,
        isFollowing,
        isFriend,
        followsYou,
        friendRequestStatus,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        friendCount: friendCount || 0
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
      navigate(previousLocation);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (!user || !profile || user.id === profile.user_id) return;

    try {
      if (profile.isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id);
        toast.success('Unfollowed user');
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: profile.user_id
          });
        toast.success('Following user');
      }
      
      // Update local state
      setProfile(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const sendFriendRequest = async () => {
    if (!user || !profile || user.id === profile.user_id) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: profile.user_id,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Friend request sent!');
      // Refresh profile to update status
      fetchUserProfile();
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  const cancelFriendRequest = async () => {
    if (!user || !profile || user.id === profile.user_id) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('sender_id', user.id)
        .eq('receiver_id', profile.user_id);

      if (error) throw error;

      toast.success('Friend request cancelled');
      // Refresh profile to update status
      fetchUserProfile();
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast.error('Failed to cancel friend request');
    }
  };

  const acceptFriendRequest = async () => {
    if (!user || !profile || user.id === profile.user_id) return;

    try {
      // Update the friend request status to accepted
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('sender_id', profile.user_id)
        .eq('receiver_id', user.id);

      if (updateError) throw updateError;

      toast.success('Friend request accepted!');
      // Refresh profile to update status
      fetchUserProfile();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const declineFriendRequest = async () => {
    if (!user || !profile || user.id === profile.user_id) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('sender_id', profile.user_id)
        .eq('receiver_id', user.id);

      if (error) throw error;

      toast.success('Friend request declined');
      // Refresh profile to update status
      fetchUserProfile();
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error('Failed to decline friend request');
    }
  };

  const unfriend = async () => {
    if (!user || !profile || user.id === profile.user_id) return;

    try {
      // Delete the single friendship row
      await supabase
        .from('friends')
        .delete()
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${profile.user_id}),and(user1_id.eq.${profile.user_id},user2_id.eq.${user.id})`);
      
      toast.success('Unfriended user');
      // Refresh profile to update status
      fetchUserProfile();
    } catch (error) {
      console.error('Error unfriending:', error);
      toast.error('Failed to unfriend');
    }
  };

  if (loading) {
    return (
      <Layout title="Loading Profile...">
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
      <Layout title="Profile Not Found">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Profile not found</h2>
          <p className="text-muted-foreground mb-4">The user profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(previousLocation)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title={`${profile.display_name || profile.username || 'User'} Profile`}>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(previousLocation)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

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

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-2">
                {profile.display_name || profile.username || 'Anonymous'}
              </h1>
              {profile.username && profile.display_name && (
                <p className="text-muted-foreground mb-2">@{profile.username}</p>
              )}
              
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
                <div className="text-center">
                  <div className="font-semibold text-lg">{profile.followerCount}</div>
                  <div className="text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{profile.followingCount}</div>
                  <div className="text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg">{profile.friendCount}</div>
                  <div className="text-muted-foreground">Friends</div>
                </div>
              </div>

              {/* Relationship Status Badges */}
              {user && user.id !== profile.user_id && (
                <div className="flex justify-center md:justify-start gap-2 mt-3">
                  {profile.isFriend && (
                    <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                      <Heart className="w-3 h-3 mr-1" />
                      Friend
                    </Badge>
                  )}
                  {profile.friendRequestStatus === 'sent' && (
                    <Badge variant="outline" className="border-yellow-200 text-yellow-700">
                      Friend request sent
                    </Badge>
                  )}
                  {profile.friendRequestStatus === 'received' && (
                    <Badge variant="outline" className="border-orange-200 text-orange-700">
                      Friend request received
                    </Badge>
                  )}
                  {profile.followsYou && (
                    <Badge variant="outline" className="border-blue-200 text-blue-700">
                      Follows you
                    </Badge>
                  )}
                  {profile.isFollowing && (
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      You follow
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {user && user.id !== profile.user_id && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={toggleFollow}
                  variant={profile.isFollowing ? "outline" : "default"}
                  size="lg"
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
                
                {/* Friend Request Actions */}
                {profile.isFriend ? (
                  <Button
                    onClick={unfriend}
                    variant="outline"
                    size="lg"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Unfriend
                  </Button>
                ) : profile.friendRequestStatus === 'sent' ? (
                  <Button
                    onClick={cancelFriendRequest}
                    variant="outline"
                    size="lg"
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Cancel Request
                  </Button>
                ) : profile.friendRequestStatus === 'received' ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={acceptFriendRequest}
                      variant="default"
                      size="lg"
                      className="flex-1"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={declineFriendRequest}
                      variant="outline"
                      size="lg"
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      Decline
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={sendFriendRequest}
                    variant="secondary"
                    size="lg"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Send Friend Request
                  </Button>
                )}
              </div>
            )}
          </div>
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

        {/* Trainer Stats */}
        {profile.role === 'trainer' && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Trainer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.years_experience && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span className="font-medium">Experience:</span>
                    <span>{profile.years_experience} years</span>
                  </div>
                )}
                {profile.rating && (
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-medium">Rating:</span>
                    <span>{profile.rating}/5 ({profile.total_reviews || 0} reviews)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal Stats (if available) */}
        {(profile.activity_level || profile.height || profile.weight) && (
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile.activity_level && (
                  <div>
                    <span className="font-medium">Activity Level:</span>
                    <p className="text-muted-foreground capitalize">{profile.activity_level}</p>
                  </div>
                )}
                {profile.height && (
                  <div>
                    <span className="font-medium">Height:</span>
                    <p className="text-muted-foreground">{profile.height} cm</p>
                  </div>
                )}
                {profile.weight && (
                  <div>
                    <span className="font-medium">Weight:</span>
                    <p className="text-muted-foreground">{profile.weight} kg</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workout Schedule */}
        <UserWorkoutCalendar userId={userId} />
      </div>
    </Layout>
  );
};

