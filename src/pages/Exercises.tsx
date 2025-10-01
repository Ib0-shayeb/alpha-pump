import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  difficulty_level: string;
  video_url?: string;
  image_url?: string;
  exercise_categories: {
    name: string;
  };
  equipment: {
    name: string;
  };
  exercise_muscle_groups: {
    muscle_groups: {
      name: string;
    };
    is_primary: boolean;
  }[];
}

interface Category {
  id: string;
  name: string;
}

const Exercises = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
    fetchCategories();
  }, []);

  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          *,
          exercise_categories (name),
          equipment (name),
          exercise_muscle_groups (
            muscle_groups (name),
            is_primary
          )
        `)
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.exercise_muscle_groups.some(mg => 
                           mg.muscle_groups.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesCategory = !selectedCategory || exercise.exercise_categories.name === selectedCategory;
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
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? "default" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                className={selectedCategory === category.name ? "bg-gradient-primary" : ""}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading exercises...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="p-4 bg-gradient-card shadow-card border-border/50">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{exercise.name}</h3>
                      <p className="text-sm text-muted-foreground">{exercise.description}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {exercise.exercise_categories.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {exercise.difficulty_level}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Target Muscles</h4>
                      <div className="flex flex-wrap gap-1">
                        {exercise.exercise_muscle_groups.map((mg, index) => (
                          <Badge 
                            key={index} 
                            variant={mg.is_primary ? "default" : "outline"} 
                            className="text-xs"
                          >
                            {mg.muscle_groups.name}
                            {mg.is_primary && " (Primary)"}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Equipment</h4>
                      <Badge variant="outline" className="text-xs">
                        {exercise.equipment.name}
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

                    {(exercise.video_url || exercise.image_url) && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Media</h4>
                        <div className="flex gap-2">
                          {exercise.video_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={exercise.video_url} target="_blank" rel="noopener noreferrer">
                                Watch Video
                              </a>
                            </Button>
                          )}
                          {exercise.image_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={exercise.image_url} target="_blank" rel="noopener noreferrer">
                                View Image
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="w-full">
                    Add to Routine
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredExercises.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No exercises found matching your criteria.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Exercises;