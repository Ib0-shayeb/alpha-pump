import { useState } from "react";
import { Menu, X, Bell, Calendar, Plus, Dumbbell, Home, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface HamburgerMenuProps {
  unreadCount?: number;
  incompleteProfile?: boolean;
}

export const HamburgerMenu = ({ unreadCount = 0, incompleteProfile = false }: HamburgerMenuProps) => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  
  // Get user role from user metadata, default to 'client'
  const userRole = user?.user_metadata?.role || 'client';
  const mainHref = userRole === 'trainer' ? '/trainer' : '/';

  const menuItems = [
    {
      label: "Main",
      icon: Home,
      href: mainHref,
    },
    {
      label: "Inbox",
      icon: Bell,
      href: "/inbox",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: "Workout Routines",
      icon: Calendar,
      href: "/routines",
    },
    {
      label: "Create New Routine",
      icon: Plus,
      href: "/routines/create",
    },
    {
      label: "Browse Exercises",
      icon: Dumbbell,
      href: "/exercises",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu size={20} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Menu</h2>
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            incompleteProfile ? (
              <div
                key={item.href}
                className="flex items-center justify-between p-3 rounded-lg opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} className="text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center text-xs p-0">
                    {item.badge > 9 ? "9+" : item.badge}
                  </Badge>
                )}
              </div>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} className="text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center text-xs p-0">
                    {item.badge > 9 ? "9+" : item.badge}
                  </Badge>
                )}
              </Link>
            )
          ))}
          
          <div className="pt-4 mt-4 border-t border-border">
            <Button
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              variant="ghost"
              className="w-full justify-start p-3 h-auto text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <LogOut size={20} className="mr-3" />
              <span>Sign Out</span>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};