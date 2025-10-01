import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  Heart,
  Compass,
  Calendar, 
  Plus,
  Dumbbell, 
  User, 
  Bell,
  MessageCircle,
  Settings,
  LogOut 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const mainItems = [
  { title: "Main", url: "/", icon: Home },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Messages", url: "/messages", icon: MessageCircle },
  { title: "Inbox", url: "/inbox", icon: Bell, badge: true },
];

const socialItems = [
  { title: "Social", url: "/social", icon: Heart },
  { title: "Discover", url: "/discover", icon: Compass },
];

const workoutItems = [
  { title: "Workout Routines", url: "/routines", icon: Calendar },
  { title: "Create New Routine", url: "/routines/create", icon: Plus },
  { title: "Browse Exercises", url: "/exercises", icon: Dumbbell },
];

const trainerItems = [
  { title: "Trainer Profile", url: "/trainer/profile/edit", icon: User },
];

const clientTrainerItems = [
  { title: "My Trainers", url: "#", icon: Users },
  { title: "Clients", url: "/trainer", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('client');
  const [unreadCount, setUnreadCount] = useState(0);

  const collapsed = state === "collapsed";

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFollowerCount();
      fetchUserRole();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('display_name, username, avatar_url')
      .eq('user_id', user.id)
      .single();
    setProfile(data);
  };

  const fetchFollowerCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id);
    setFollowerCount(count || 0);
  };

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setUserRole(profile?.role || 'client');
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);
    
    setUnreadCount(count || 0);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/auth';
    }
  };

  const mainHref = userRole === 'trainer' ? '/trainer' : '/';

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"}>
      <SidebarContent className="flex flex-col h-full">
        {/* User Profile Section */}
        {!collapsed && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.display_name?.[0] || profile?.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {profile?.display_name || profile?.username || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {followerCount} followers
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.title === "Main" ? mainHref : item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.badge && unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="h-5 w-5 flex items-center justify-center text-xs p-0 ml-auto"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Social Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Social</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Workout Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Workouts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workoutItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Trainer Profile (conditional) */}
        {userRole === 'trainer' && (
          <SidebarGroup>
            <SidebarGroupLabel>Trainer</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {trainerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`
                        }
                      >
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Client/Trainer Relations */}
        <SidebarGroup>
          <SidebarGroupLabel>Connections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clientTrainerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.url === "#" ? (
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed text-muted-foreground">
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </div>
                    ) : (
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`
                        }
                      >
                        <item.icon className="w-5 h-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`
                    }
                  >
                    <Settings className="w-5 h-5" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Out */}
        <div className="p-4 border-t border-border/50">
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className={`w-full justify-start gap-3 text-muted-foreground hover:text-foreground ${
              collapsed ? "px-2" : ""
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}