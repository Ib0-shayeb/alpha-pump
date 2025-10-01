import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  Users, 
  Search,
  MoreVertical,
  Phone,
  Video,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

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
    bio?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchFriends();
    }
  }, [user]);

  useEffect(() => {
    if (userId && friends.length > 0) {
      const friend = friends.find(f => f.profiles.user_id === userId);
      if (friend) {
        setSelectedFriend(friend);
        fetchMessages(friend.profiles.user_id);
      }
    }
  }, [userId, friends]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time message updates
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for user:', user.id);

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${user.id},sender_id.eq.${user.id})`
        },
        (payload) => {
          console.log('New message received via real-time:', payload);
          // If we're currently viewing messages with the sender/receiver, refresh messages
          if (selectedFriend && 
              (payload.new.sender_id === selectedFriend.profiles.user_id || 
               payload.new.receiver_id === selectedFriend.profiles.user_id)) {
            console.log('Refreshing messages for current conversation');
            fetchMessages(selectedFriend.profiles.user_id);
          }
          // Always refresh friends list to update last message and unread counts
          console.log('Refreshing friends list');
          fetchFriends();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, selectedFriend]);

  // Fallback: periodic refresh if real-time isn't working
  useEffect(() => {
    if (!selectedFriend || !user) return;

    const interval = setInterval(() => {
      console.log('Periodic refresh of messages');
      fetchMessages(selectedFriend.profiles.user_id);
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [selectedFriend, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Get friends where user is user1_id
      const { data: friends1Data, error: friends1Error } = await supabase
        .from('friends')
        .select('id, user2_id, created_at')
        .eq('user1_id', user.id);

      if (friends1Error) throw friends1Error;

      // Get friends where user is user2_id
      const { data: friends2Data, error: friends2Error } = await supabase
        .from('friends')
        .select('id, user1_id, created_at')
        .eq('user2_id', user.id);

      if (friends2Error) throw friends2Error;

      // Combine and get unique friend IDs
      const allFriends = [
        ...(friends1Data || []).map(f => ({ ...f, friend_id: f.user2_id })),
        ...(friends2Data || []).map(f => ({ ...f, friend_id: f.user1_id }))
      ];

      // Remove duplicates based on friend_id
      const uniqueFriends = allFriends.filter((friend, index, self) => 
        index === self.findIndex(f => f.friend_id === friend.friend_id)
      );

      if (uniqueFriends.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Get profile data for friends
      const friendIds = uniqueFriends.map(f => f.friend_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio')
        .in('user_id', friendIds);

      if (profilesError) throw profilesError;

      // Get last messages and unread counts for each friend
      const friendsWithData = await Promise.all(
        uniqueFriends.map(async (friend) => {
          const profile = profilesData?.find(p => p.user_id === friend.friend_id) || {
            user_id: friend.friend_id,
            display_name: null,
            username: null,
            avatar_url: null,
            bio: null
          };

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .or(`sender_id.eq.${friend.friend_id},receiver_id.eq.${friend.friend_id}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('sender_id', friend.friend_id)
            .eq('is_read', false);

          return {
            ...friend,
            profiles: profile,
            last_message: lastMessageData,
            unread_count: unreadCount || 0
          };
        })
      );

      // Sort by last message time
      friendsWithData.sort((a, b) => {
        if (!a.last_message && !b.last_message) return 0;
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
      });

      setFriends(friendsWithData);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (friendId: string) => {
    if (!user) return;

    console.log('Fetching messages between', user.id, 'and', friendId);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Fetched messages:', data);

      setMessages(data || []);

      // Mark messages as read
      const { error: readError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', friendId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (readError) {
        console.error('Error marking messages as read:', readError);
      }

      // Update unread count for this friend
      setFriends(prev => prev.map(friend => 
        friend.profiles.user_id === friendId 
          ? { ...friend, unread_count: 0 }
          : friend
      ));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedFriend || !newMessage.trim()) return;

    console.log('Sending message from', user.id, 'to', selectedFriend.profiles.user_id, ':', newMessage.trim());

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedFriend.profiles.user_id,
          content: newMessage.trim()
        })
        .select();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      console.log('Message sent successfully:', data);

      setNewMessage("");
      
      // Refresh messages
      await fetchMessages(selectedFriend.profiles.user_id);
      
      // Refresh friends list to update last message
      await fetchFriends();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.profiles.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.profiles.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Layout title="Messages">
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
    <Layout title="Messages">
      <div className="flex h-[calc(100vh-200px)]">
        {/* Friends List */}
        <div className="w-1/3 border-r border-border">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile/followers')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-y-auto">
            {filteredFriends.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                <p className="text-muted-foreground">
                  Add friends to start messaging them.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => navigate('/profile/followers')}
                >
                  Find Friends
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedFriend?.profiles.user_id === friend.profiles.user_id ? 'bg-muted' : ''
                    }`}
                    onClick={() => {
                      setSelectedFriend(friend);
                      navigate(`/messages/${friend.profiles.user_id}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={friend.profiles.avatar_url} />
                          <AvatarFallback>
                            {friend.profiles.display_name?.[0] || friend.profiles.username?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {friend.unread_count && friend.unread_count > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {friend.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {friend.profiles.display_name || friend.profiles.username || 'Anonymous'}
                        </h4>
                        {friend.last_message && (
                          <p className="text-sm text-muted-foreground truncate">
                            {friend.last_message.sender_id === user?.id ? 'You: ' : ''}
                            {friend.last_message.content}
                          </p>
                        )}
                        {friend.last_message && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(friend.last_message.created_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedFriend.profiles.avatar_url} />
                    <AvatarFallback>
                      {selectedFriend.profiles.display_name?.[0] || selectedFriend.profiles.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {selectedFriend.profiles.display_name || selectedFriend.profiles.username || 'Anonymous'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedFriend.profiles.username && selectedFriend.profiles.display_name && 
                        `@${selectedFriend.profiles.username}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (selectedFriend) {
                        console.log('Manual refresh triggered');
                        fetchMessages(selectedFriend.profiles.user_id);
                      }
                    }}
                    title="Refresh messages"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                    <p className="text-muted-foreground">
                      Start a conversation with {selectedFriend.profiles.display_name || selectedFriend.profiles.username || 'this person'}.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.sender_id === user?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user?.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Select a friend to start chatting</h3>
                <p className="text-muted-foreground">
                  Choose a friend from the list to begin your conversation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MessagesPage;
