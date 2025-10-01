import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Dumbbell, Calendar, Trophy, Target, Users, Shield, SkipForward, Bot, Zap, Heart, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClientWorkoutCalendar } from "@/components/ClientWorkoutCalendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
 
import { endOfWeek, format, startOfWeek } from "date-fns";

interface ActiveRoutine {
  id: string;
  routine_id: string;
  plan_type: 'strict' | 'flexible';
  start_date: string;
  routine: {
    name: string;
    description?: string;
    days_per_week: number;
  };
}

const Dashboard = () => {
  const [activeRoutines, setActiveRoutines] = useState<ActiveRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'trainer'>('client');
  const { user } = useAuth();
  const [totalWorkouts, setTotalWorkouts] = useState<number>(0);
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState<number>(0);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setUserRole((profile?.role as 'client' | 'trainer') || 'client');
    };

    const fetchActiveRoutines = async () => {
      if (!user) return;

      try {
        // First get the assignments
        const { data: assignments, error: assignmentsError } = await supabase
          .from('client_routine_assignments')
          .select('id, routine_id, plan_type, start_date')
          .eq('client_id', user.id)
          .eq('is_active', true)
          .order('start_date', { ascending: false });

        if (assignmentsError) throw assignmentsError;

        if (!assignments || assignments.length === 0) {
          setActiveRoutines([]);
          return;
        }

        // Then get the routine details
        const routineIds = assignments.map(a => a.routine_id);
        const { data: routines, error: routinesError } = await supabase
          .from('workout_routines')
          .select('id, name, description, days_per_week')
          .in('id', routineIds);

        if (routinesError) throw routinesError;

        // Combine the data
        const formattedRoutines: ActiveRoutine[] = assignments.map(assignment => {
          const routine = routines?.find(r => r.id === assignment.routine_id);
          return {
            id: assignment.id,
            routine_id: assignment.routine_id,
            plan_type: assignment.plan_type as 'strict' | 'flexible',
            start_date: assignment.start_date,
            routine: routine ? {
              name: routine.name,
              description: routine.description || undefined,
              days_per_week: routine.days_per_week
            } : {
              name: 'Unknown Routine',
              days_per_week: 0
            }
          };
        }).filter(assignment => assignment.routine.name !== 'Unknown Routine');

        setActiveRoutines(formattedRoutines);
      } catch (error) {
        console.error('Error fetching active routines:', error);
      } finally {
        setRoutinesLoading(false);
      }
    };

    fetchUserRole();
    if (userRole === 'client') {
      fetchActiveRoutines();
    }
    fetchRecentPosts();
    fetchSuggestedUsers();
    fetchSocialStats();
  }, [user, userRole]);

  const fetchRecentPosts = async () => {
    if (!user) return;
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (display_name, username, avatar_url),
          post_likes (id)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      setRecentPosts(posts || []);
    } catch (error) {
      console.error('Error fetching recent posts:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, bio')
        .neq('user_id', user.id)
        .limit(3);

      setSuggestedUsers(users || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const fetchSocialStats = async () => {
    if (!user) return;
    try {
      const [{ count: followingCount }, { count: friendCount }] = await Promise.all([
        supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', user.id),
        supabase
          .from('friends')
          .select('id', { count: 'exact', head: true })
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      ]);
      
      setFollowingCount(followingCount || 0);
      setFriendCount(friendCount || 0);
    } catch (error) {
      console.error('Error fetching social stats:', error);
    }
  };

  // Removed recent activity feature

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        // Total completed workouts (end_time not null)
        const { count: totalCount, error: totalErr } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (totalErr) throw totalErr;
        setTotalWorkouts(totalCount || 0);

        // Workouts this week (Mon-Sun)
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd 23:59:59');
        const { count: weekCount, error: weekErr } = await supabase
          .from('workout_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('start_time', weekStart)
          .lte('start_time', weekEnd)
          ;
        if (weekErr) throw weekErr;
        setWorkoutsThisWeek(weekCount || 0);
      } catch (e) {
        console.error('Failed to fetch stats', e);
        setTotalWorkouts(0);
        setWorkoutsThisWeek(0);
      }
    };
    fetchStats();
  }, [user]);

  const stats = [
    { label: "Workouts This Week", value: String(workoutsThisWeek), icon: Dumbbell, color: "text-primary" },
    { label: "Total Workouts", value: String(totalWorkouts), icon: Trophy, color: "text-accent" },
    { label: "Following", value: String(followingCount), icon: Users, color: "text-blue-500" },
    { label: "Friends", value: String(friendCount), icon: Heart, color: "text-pink-500" },
  ];

  return (
    <Layout title="GymTracker">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-card rounded-lg p-6 shadow-card">
          <h2 className="text-xl font-semibold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground mb-4">
            Ready to crush your workout goals today?
          </p>
          <Link to="/start-workout">
            <Button className="bg-gradient-primary hover:shadow-primary">
              <Plus size={16} className="mr-2" />
              Start Workout
            </Button>
          </Link>
        </div>

        {/* AI Trainer Access */}
        {userRole === 'client' && (
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-primary/5 shadow-card">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      AI Fitness Coach
                      <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
                        <Zap className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">Get personalized fitness guidance 24/7</p>
                  </div>
                </div>
                <Link to="/ai-trainer">
                  <Button variant="default" size="sm">
                    Chat Now
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4 bg-gradient-card shadow-card border-border/50">
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={20} className={stat.color} />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Social Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Posts */}
          <Card className="p-6 bg-gradient-card shadow-card border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Recent Activity
              </h3>
              <Link to="/social">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            
            {recentPosts.length > 0 ? (
              <div className="space-y-3">
                {recentPosts.slice(0, 2).map((post) => (
                  <div key={post.id} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={post.profiles?.avatar_url} />
                      <AvatarFallback>
                        {post.profiles?.display_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {post.profiles?.display_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.post_likes?.length || 0}
                        </span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <Link to="/social">
                  <Button variant="outline" size="sm" className="mt-2">
                    Explore Feed
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Suggested Users */}
          <Card className="p-6 bg-gradient-card shadow-card border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Discover Users
              </h3>
              <Link to="/discover">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            
            {suggestedUsers.length > 0 ? (
              <div className="space-y-3">
                {suggestedUsers.slice(0, 2).map((profile) => (
                  <div key={profile.user_id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {profile.display_name || profile.username || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile.role === 'trainer' ? 'Personal Trainer' : 'Fitness Enthusiast'}
                        </p>
                      </div>
                    </div>
                    <Link to={`/profile/${profile.user_id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No suggestions yet</p>
                <Link to="/discover">
                  <Button variant="outline" size="sm" className="mt-2">
                    Find Users
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>


        {/* Client Workout Calendar */}
        {userRole === 'client' && (
          <ClientWorkoutCalendar />
        )}

        {/* Active Routines section removed for clients */}

        {/* Recent Activity removed */}

        {/* Trainer Connection removed */}
        
        {/* Privacy Settings moved to Settings page */}
      </div>
    </Layout>
  );
};

export default Dashboard;