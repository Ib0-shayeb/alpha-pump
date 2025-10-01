import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, Users, Plus, Dumbbell, Timer, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { MyScheduleDialog } from "@/components/MyScheduleDialog";

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
  post_comments: { id: string; content: string; user_id: string; created_at: string; profiles: { display_name?: string; avatar_url?: string } }[];
}

interface SelectedWorkout {
  session_id: string;
  session_name: string;
  routine_name: string;
  routine_day_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

const Social = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<SelectedWorkout | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch related data separately
      const postsWithDetails = await Promise.all(
        (postsData || []).map(async (post) => {
          const [profileResult, likesResult, commentsResult, sessionResult] = await Promise.all([
            supabase.from('profiles').select('display_name, username, avatar_url').eq('user_id', post.user_id).single(),
            supabase.from('post_likes').select('id, user_id').eq('post_id', post.id),
            supabase.from('post_comments').select('id, content, user_id').eq('post_id', post.id),
            post.workout_session_id 
              ? supabase.from('workout_sessions').select('name, start_time, end_time').eq('id', post.workout_session_id).single()
              : Promise.resolve({ data: null })
          ]);

          const comments = await Promise.all(
            (commentsResult.data || []).map(async (comment) => {
              const { data: commentProfile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('user_id', comment.user_id)
                .single();
              return {
                ...comment,
                profiles: commentProfile || { display_name: 'Anonymous', avatar_url: null }
              };
            })
          );

          return {
            ...post,
            post_type: post.post_type as 'general' | 'workout' | 'workout_summary',
            profiles: profileResult.data || { display_name: 'Anonymous', username: null, avatar_url: null },
            post_likes: likesResult.data || [],
            post_comments: comments,
            workout_session: sessionResult.data
          };
        })
      );

      setPosts(postsWithDetails);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) return;

    try {
      const postData: any = {
        user_id: user.id,
        content: newPost,
        post_type: selectedWorkout ? 'workout_summary' : 'general'
      };

      // If a completed workout is selected, link it to the post
      if (selectedWorkout) {
        postData.workout_session_id = selectedWorkout.session_id;
      }

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;
      
      setNewPost('');
      setSelectedWorkout(null);
      toast.success('Post created!');
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleWorkoutSelect = (workout: SelectedWorkout) => {
    setSelectedWorkout(workout);
  };

  const handleRemoveWorkout = () => {
    setSelectedWorkout(null);
  };

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !commentInputs[postId]?.trim()) return;

    try {
      await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentInputs[postId].trim()
        });

      setCommentInputs({ ...commentInputs, [postId]: '' });
      toast.success('Comment added!');
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
  };

  const formatWorkoutDuration = (start: string, end?: string) => {
    if (!end) return 'In progress...';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <Layout title="Social Feed">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Social Feed">
      <div className="space-y-6">
        {/* Create Post */}
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex gap-4">
            <Avatar>
              <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea
                placeholder="Share your fitness journey..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] border-border/50"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsScheduleDialogOpen(true)}
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    {selectedWorkout ? 'Change Workout' : 'Add Workout'}
                  </Button>
                </div>
                <Button 
                  onClick={createPost}
                  disabled={!newPost.trim()}
                  className="bg-gradient-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>

              {/* Selected Workout Display */}
              {selectedWorkout && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Dumbbell className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800">
                          {selectedWorkout.session_name}
                        </h4>
                        <p className="text-sm text-green-600">
                          {selectedWorkout.routine_name} • {selectedWorkout.routine_day_name}
                        </p>
                        <p className="text-xs text-green-500">
                          {new Date(selectedWorkout.start_time).toLocaleDateString()} • {selectedWorkout.duration_minutes} min
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveWorkout}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.map((post) => {
            const isLiked = post.post_likes.some(like => like.user_id === user?.id);
            const likeCount = post.post_likes.length;
            const commentCount = post.post_comments.length;

            return (
              <Card key={post.id} className="p-6 bg-gradient-card shadow-card border-border/50">
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
                        <Badge variant="secondary" className="bg-accent/10 text-accent">
                          <Timer className="w-3 h-3 mr-1" />
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
                          <Timer className="w-4 h-4 ml-2" />
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

                {/* Post Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLike(post.id, isLiked)}
                    className={`gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-muted-foreground"
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Share className="w-4 h-4" />
                    Share
                  </Button>
                </div>

                {/* Comments Section */}
                {showComments[post.id] && (
                  <div className="mt-4 space-y-4">
                    {/* Add Comment */}
                    <div className="flex gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback><Users className="w-4 h-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && addComment(post.id)}
                          className="flex-1 px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Button 
                          size="sm"
                          onClick={() => addComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim()}
                        >
                          Post
                        </Button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {post.post_comments.length > 0 && (
                      <div className="space-y-3">
                        {post.post_comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.profiles.avatar_url || undefined} />
                              <AvatarFallback>
                                {comment.profiles.display_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-background/50 px-3 py-2 rounded-lg">
                                <p className="font-semibold text-sm">{comment.profiles.display_name || 'Anonymous'}</p>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 ml-3">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {posts.length === 0 && (
            <Card className="p-8 text-center bg-gradient-card shadow-card">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share your fitness journey!
              </p>
              <Link to="/discover">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Discover Users
                </Button>
              </Link>
            </Card>
          )}
        </div>
      </div>

      {/* My Schedule Dialog */}
      <MyScheduleDialog
        isOpen={isScheduleDialogOpen}
        onClose={() => setIsScheduleDialogOpen(false)}
        onSelectWorkout={handleWorkoutSelect}
      />
    </Layout>
  );
};

export default Social;