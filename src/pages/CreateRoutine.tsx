import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const CreateRoutine = () => {
  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<string[]>([]);

  const addDay = () => {
    setDays([...days, `Day ${days.length + 1}`]);
  };

  return (
    <Layout title="Create New Routine">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="p-6 bg-gradient-card shadow-card border-border/50">
          <h2 className="text-xl font-semibold mb-4">Routine Details</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="routineName">Routine Name</Label>
              <Input
                id="routineName"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                placeholder="e.g., Push/Pull/Legs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your workout routine..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card shadow-card border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Workout Days</h2>
            <Button onClick={addDay} size="sm" className="bg-gradient-primary">
              <Plus size={16} className="mr-2" />
              Add Day
            </Button>
          </div>
          
          {days.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No days added yet. Click "Add Day" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {days.map((day, index) => (
                <Card key={index} className="p-4 bg-card/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{day}</span>
                    <Button variant="outline" size="sm">
                      Edit Day
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <div className="flex space-x-4">
          <Button className="flex-1 bg-gradient-primary hover:shadow-primary">
            <Save size={16} className="mr-2" />
            Save Routine
          </Button>
          <Button variant="outline" className="flex-1">
            Save as Draft
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CreateRoutine;