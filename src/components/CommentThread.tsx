import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  parent_comment_id?: string;
  profiles: {
    display_name?: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  onReply: (commentId: string, content: string) => Promise<void>;
  depth?: number;
}

export const CommentThread = ({ 
  comment, 
  postId, 
  currentUserId,
  onReply, 
  depth = 0 
}: CommentThreadProps) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent("");
      setShowReplyInput(false);
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const marginLeft = depth > 0 ? `${Math.min(depth * 2.5, 10)}rem` : "0";

  return (
    <div className="space-y-3" style={{ marginLeft }}>
      <div className="flex gap-2">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.profiles.avatar_url || undefined} />
          <AvatarFallback>
            {comment.profiles.display_name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-background/50 px-3 py-2 rounded-lg">
            <p className="font-semibold text-sm">{comment.profiles.display_name || 'Anonymous'}</p>
            <p className="text-sm break-words">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-3">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>

          {/* Reply Input */}
          {showReplyInput && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleReply()}
                className="flex-1 px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSubmitting}
              />
              <Button 
                size="sm"
                onClick={handleReply}
                disabled={!replyContent.trim() || isSubmitting}
              >
                {isSubmitting ? "..." : "Reply"}
              </Button>
              <Button 
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowReplyInput(false);
                  setReplyContent("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
