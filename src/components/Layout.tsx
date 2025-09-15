import { ReactNode, useState, useEffect } from "react";
import { Navigation } from "./Navigation";
import { HamburgerMenu } from "./HamburgerMenu";
import { RoleToggle } from "./RoleToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      {title && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HamburgerMenu unreadCount={unreadCount} />
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {title}
                </h1>
              </div>
              <RoleToggle />
            </div>
          </div>
        </header>
      )}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <Navigation />
    </div>
  );
};