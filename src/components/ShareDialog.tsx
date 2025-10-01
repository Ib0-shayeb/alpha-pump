import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Share, 
  MessageCircle, 
  Copy, 
  ExternalLink,
  Search,
  Send,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Friend {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  profiles: {
    user_id: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent?: string;
  postType: 'general' | 'workout' | 'workout_summary';
}

export const ShareDialog = ({ isOpen, onClose, postId, postContent, postType }: ShareDialogProps) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareText = postContent ? `${postContent}\n\n${postUrl}` : postUrl;

  useEffect(() => {
    if (isOpen && user) {
      fetchFriends();
    }
  }, [isOpen, user]);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Get friends where user is either user1_id or user2_id
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (friendsError) throw friendsError;

      if (!friendsData || friendsData.length === 0) {
        setFriends([]);
        return;
      }

      // Get the friend IDs (the other user in each friendship)
      const friendIds = friendsData.map(friend => 
        friend.user1_id === user.id ? friend.user2_id : friend.user1_id
      );

      // Get profile data for friends
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', friendIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const friendsWithProfiles = friendsData.map(friend => {
        const friendId = friend.user1_id === user.id ? friend.user2_id : friend.user1_id;
        return {
          ...friend,
          profiles: profilesData?.find(profile => profile.user_id === friendId) || {
            user_id: friendId,
            display_name: null,
            username: null,
            avatar_url: null
          }
        };
      });

      setFriends(friendsWithProfiles);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const sendToFriends = async () => {
    if (!user || selectedFriends.length === 0) return;

    setSending(true);
    try {
      const messages = selectedFriends.map(friendId => ({
        sender_id: user.id,
        receiver_id: friendId,
        content: messageText ? `${messageText}\n\n${postUrl}` : postUrl
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messages);

      if (error) throw error;

      toast.success(`Post shared with ${selectedFriends.length} friend${selectedFriends.length === 1 ? '' : 's'}!`);
      onClose();
      setSelectedFriends([]);
      setMessageText("");
    } catch (error) {
      console.error('Error sending messages:', error);
      toast.error('Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const shareToExternal = (platform: string) => {
    let url = '';
    const encodedText = encodeURIComponent(shareText);
    
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postContent || '')}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  const filteredFriends = friends.filter(friend =>
    friend.profiles.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.profiles.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Share Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* External Sharing Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Share to external apps</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToExternal('whatsapp')}
                className="justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToExternal('telegram')}
                className="justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Telegram
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToExternal('twitter')}
                className="justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Twitter/X
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareToExternal('facebook')}
                className="justify-start"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Facebook
              </Button>
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Copy link</h4>
            <div className="flex gap-2">
              <Input
                value={postUrl}
                readOnly
                className="text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="px-3"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Share with Friends */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Send to friends</h4>
            
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No friends to share with
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filteredFriends.map((friend) => (
                    <div
                      key={friend.profiles.user_id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedFriends.includes(friend.profiles.user_id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleFriendSelection(friend.profiles.user_id)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={friend.profiles.avatar_url} />
                        <AvatarFallback>
                          {friend.profiles.display_name?.[0] || friend.profiles.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {friend.profiles.display_name || friend.profiles.username || 'Anonymous'}
                        </p>
                        {friend.profiles.username && friend.profiles.display_name && (
                          <p className="text-xs text-muted-foreground">
                            @{friend.profiles.username}
                          </p>
                        )}
                      </div>
                      {selectedFriends.includes(friend.profiles.user_id) && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                {selectedFriends.length > 0 && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Add a message (optional)..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                    <Button
                      onClick={sendToFriends}
                      disabled={sending}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sending ? 'Sending...' : `Send to ${selectedFriends.length} friend${selectedFriends.length === 1 ? '' : 's'}`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
