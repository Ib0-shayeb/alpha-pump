import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { exercises, exerciseCategories } from "@/data/exercises";

const Exercises = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.muscles.some(muscle => muscle.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout title="Exercise Library">
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search exercises or muscle groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "bg-gradient-primary" : ""}
            >
              All
            </Button>
            {exerciseCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-gradient-primary" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="p-4 bg-gradient-card shadow-card border-border/50">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{exercise.name}</h3>
                    <p className="text-sm text-muted-foreground">{exercise.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {exercise.category}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Target Muscles</h4>
                    <div className="flex flex-wrap gap-1">
                      {exercise.muscles.map((muscle) => (
                        <Badge key={muscle} variant="outline" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Equipment</h4>
                    <Badge variant="outline" className="text-xs">
                      {exercise.equipment}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Instructions</h4>
                    <ol className="text-sm space-y-1 ml-4">
                      {exercise.instructions.map((instruction, index) => (
                        <li key={index} className="list-decimal">
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Add to Routine
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No exercises found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Exercises;