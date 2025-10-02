import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Image, ExternalLink } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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

const ExercisePage = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (exerciseId) {
      fetchExerciseDetails();
    }
  }, [exerciseId]);

  const fetchExerciseDetails = async () => {
    if (!exerciseId) return;

    try {
      setLoading(true);
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
        .eq('id', exerciseId)
        .single();

      if (error) throw error;
      setExercise(data);
    } catch (error) {
      console.error('Error fetching exercise details:', error);
      setError('Exercise not found');
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryMuscles = () => {
    if (!exercise) return [];
    return exercise.exercise_muscle_groups
      .filter(mg => mg.is_primary)
      .map(mg => mg.muscle_groups.name);
  };

  const getSecondaryMuscles = () => {
    if (!exercise) return [];
    return exercise.exercise_muscle_groups
      .filter(mg => !mg.is_primary)
      .map(mg => mg.muscle_groups.name);
  };

  if (loading) {
    return (
      <Layout title="Loading Exercise...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !exercise) {
    return (
      <Layout title="Exercise Not Found">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Exercise Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The exercise you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={exercise.name}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              {exercise.difficulty_level}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.close()}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Close Tab
            </Button>
          </div>
        </div>

        {/* Exercise Header */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h1 className="text-3xl font-bold">{exercise.name}</h1>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {exercise.difficulty_level}
              </Badge>
            </div>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              {exercise.description}
            </p>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Category:</span>
                <Badge variant="secondary">{exercise.exercise_categories.name}</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Equipment:</span>
                <Badge variant="outline">{exercise.equipment.name}</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Media Section */}
        {(exercise.video_url || exercise.image_url) && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Media</h2>
            <div className="flex gap-4">
              {exercise.video_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(exercise.video_url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Watch Video
                </Button>
              )}
              {exercise.image_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(exercise.image_url, '_blank')}
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  View Image
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Target Muscles */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Target Muscles</h2>
          <div className="space-y-4">
            {getPrimaryMuscles().length > 0 && (
              <div>
                <h3 className="font-medium text-muted-foreground mb-2">Primary Muscles</h3>
                <div className="flex flex-wrap gap-2">
                  {getPrimaryMuscles().map((muscle, index) => (
                    <Badge key={index} variant="default" className="text-sm">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {getSecondaryMuscles().length > 0 && (
              <div>
                <h3 className="font-medium text-muted-foreground mb-2">Secondary Muscles</h3>
                <div className="flex flex-wrap gap-2">
                  {getSecondaryMuscles().map((muscle, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Instructions */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <ol className="space-y-4">
              {exercise.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{instruction}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Exercise Tips */}
        <Card className="p-6 bg-muted/30">
          <h2 className="text-xl font-semibold mb-4">Exercise Tips</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Focus on proper form over heavy weights</p>
            <p>• Control the movement throughout the full range of motion</p>
            <p>• Breathe properly - exhale on exertion, inhale on the return</p>
            <p>• Start with lighter weights to master the technique</p>
            <p>• Listen to your body and stop if you feel pain</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ExercisePage;

