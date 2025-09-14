import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Target, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";

const StartWorkout = () => {
  const quickWorkouts = [
    {
      name: "Quick Push",
      duration: "30 min",
      exercises: 5,
      description: "Chest, shoulders, and triceps focus"
    },
    {
      name: "Pull Day",
      duration: "45 min", 
      exercises: 6,
      description: "Back and biceps workout"
    },
    {
      name: "Leg Blast",
      duration: "50 min",
      exercises: 7,
      description: "Complete lower body session"
    }
  ];

  return (
    <Layout title="Start Workout">
      <div className="space-y-6">
        <div className="bg-gradient-card rounded-lg p-6 shadow-card">
          <h2 className="text-xl font-semibold mb-2">Ready to Train?</h2>
          <p className="text-muted-foreground mb-4">
            Choose a workout routine or start a custom session
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quick Start Workouts</h3>
          <div className="space-y-3">
            {quickWorkouts.map((workout) => (
              <Card key={workout.name} className="p-4 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{workout.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{workout.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{workout.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Dumbbell size={14} />
                        <span>{workout.exercises} exercises</span>
                      </div>
                    </div>
                  </div>
                  <Button className="bg-gradient-primary hover:shadow-primary">
                    <Play size={16} className="mr-2" />
                    Start
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Custom Options</h3>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/routines">
              <Card className="p-4 bg-gradient-card shadow-card border-border/50 hover:shadow-primary/20 transition-all duration-200 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Use My Routine</h4>
                    <p className="text-sm text-muted-foreground">Start from your saved routines</p>
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
                    <h4 className="font-medium">Custom Workout</h4>
                    <p className="text-sm text-muted-foreground">Build workout from exercises</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StartWorkout;