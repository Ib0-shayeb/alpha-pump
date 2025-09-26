import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useSocialFeatures = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createWorkoutPost = async (workoutSessionId: string, content?: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content || "Just completed a great workout! 💪",
          post_type: 'workout_summary',
          workout_session_id: workoutSessionId
        });

      if (error) throw error;
      toast.success('Workout shared to your feed!');
      return true;
    } catch (error) {
      console.error('Error creating workout post:', error);
      toast.error('Failed to share workout');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createGeneralPost = async (content: string) => {
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          post_type: 'general'
        });

      if (error) throw error;
      toast.success('Post created!');
      return true;
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId
        });

      if (error) throw error;
      toast.success('Following user!');
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
      return false;
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;
      toast.success('Unfollowed user');
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      toast.error('Failed to unfollow user');
      return false;
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      return false;
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      return false;
    }
  };

  return {
    createWorkoutPost,
    createGeneralPost,
    followUser,
    unfollowUser,
    likePost,
    unlikePost,
    loading
  };
};