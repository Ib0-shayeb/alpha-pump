import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Dumbbell, Calendar, Trophy, User } from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: Dumbbell },
  { name: "Routines", href: "/routines", icon: Calendar },
  { name: "Workouts", href: "/workouts", icon: Trophy },
  { name: "Profile", href: "/profile", icon: User },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};