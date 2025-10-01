import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share, 
  Users, 
  Dumbbell, 
  Timer, 
  Calendar 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CommentThread } from "@/components/CommentThread";
import { ShareDialog } from "@/components/ShareDialog";

interface Post {
  id: string;
  content?: string;
  post_type: 'general' | 'workout' | 'workout_summary';
  workout_session_id?: string;
  created_at: string;
  user_id: string;
  profiles: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
  workout_session?: {
    name: string;
    start_time: string;
    end_time?: string;
  };
  post_likes: { id: string; user_id: string }[];
  post_comments: { id: string; content: string; user_id: string; created_at: string; parent_comment_id?: string; profiles: { display_name?: string; avatar_url?: string }; replies?: any[] }[];
}

const PostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            display_name,
            username,
            avatar_url
          ),
          workout_session (
            name,
            start_time,
            end_time
          ),
          post_likes (
            id,
            user_id
          ),
          post_comments (
            id,
            content,
            user_id,
            created_at,
            parent_comment_id,
            profiles (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      setPost(data);
      
      // Check if current user liked this post
      if (user && data.post_likes) {
        const userLiked = data.post_likes.some(like => like.user_id === user.id);
        setIsLiked(userLiked);
        setLikeCount(data.post_likes.length);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Post not found');
      navigate('/social');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user || !post) return;

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Like
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });

        if (error) throw error;

        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const toggleComments = () => {
    setShowComments(prev => !prev);
  };

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  const formatWorkoutDuration = (start: string, end?: string) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <Layout title="Loading Post">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout title="Post Not Found">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Post not found</h2>
            <p className="text-muted-foreground mb-4">This post may have been deleted or doesn't exist.</p>
            <Button onClick={() => navigate('/social')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Social
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Post by ${post.profiles.display_name || post.profiles.username || 'User'}`}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/social')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Social
        </Button>

        {/* Post Card */}
        <Card className="p-6 bg-gradient-card shadow-card border-border/50">
          {/* Post Header */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src={post.profiles.avatar_url} />
              <AvatarFallback>
                {post.profiles.display_name?.[0] || post.profiles.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {post.profiles.display_name || post.profiles.username || 'Anonymous'}
                </h3>
                {post.post_type === 'workout' && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    <Dumbbell className="w-3 h-3 mr-1" />
                    Workout
                  </Badge>
                )}
                {post.post_type === 'workout_summary' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <Calendar className="w-3 h-3 mr-1" />
                    Summary
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Workout Session Info */}
          {post.workout_session && (
            <div className="mb-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <h4 className="font-medium">{post.workout_session.name}</h4>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {formatWorkoutDuration(post.workout_session.start_time, post.workout_session.end_time)}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.workout_session.start_time).toLocaleDateString()}
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

          {/* Post Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLike}
              className={`gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground"
              onClick={toggleComments}
            >
              <MessageCircle className="w-4 h-4" />
              {post.post_comments.length} {post.post_comments.length === 1 ? 'Comment' : 'Comments'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 text-muted-foreground"
              onClick={handleShare}
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4">
              <CommentThread 
                postId={post.id}
                comments={post.post_comments}
                onCommentAdded={fetchPost}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Share Dialog */}
      {post && (
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          postId={post.id}
          postContent={post.content}
          postType={post.post_type}
        />
      )}
    </Layout>
  );
};

export default PostPage;
