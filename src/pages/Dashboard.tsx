import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Calendar, Trophy, Target } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    { label: "Workouts This Week", value: "3", icon: Dumbbell, color: "text-primary" },
    { label: "Current Streak", value: "5 days", icon: Target, color: "text-workout-complete" },
    { label: "Total Workouts", value: "24", icon: Trophy, color: "text-accent" },
    { label: "Active Routines", value: "2", icon: Calendar, color: "text-secondary-foreground" },
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
          <Button className="bg-gradient-primary hover:shadow-primary">
            <Plus size={16} className="mr-2" />
            Start Workout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
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

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/routines/create">
              <Card className="p-4 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Create New Routine</h4>
                    <p className="text-sm text-muted-foreground">Build your workout plan</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/exercises">
              <Card className="p-4 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Dumbbell size={20} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium">Browse Exercises</h4>
                    <p className="text-sm text-muted-foreground">Explore exercise library</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Card className="p-4 bg-gradient-card shadow-card border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Push Day</h4>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bench Press</span>
                <span className="text-primary font-medium">185 lbs × 8</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overhead Press</span>
                <span className="text-primary font-medium">135 lbs × 6</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Push-ups</span>
                <span className="text-primary font-medium">Bodyweight × 15</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;