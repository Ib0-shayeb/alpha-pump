import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ExternalLink, Play, Image, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Exercise {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  category: string;
  equipment: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  instructions: string[];
  media_links: string[];
}

interface ExerciseDetailsModalProps {
  exerciseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({
  exerciseId,
  isOpen,
  onClose
}) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exerciseId && isOpen) {
      fetchExerciseDetails();
    }
  }, [exerciseId, isOpen]);

  const fetchExerciseDetails = async () => {
    if (!exerciseId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select(`
          id,
          name,
          description,
          difficulty,
          instructions,
          media_links,
          exercise_categories(name),
          equipment(name),
          exercise_muscle_groups(
            muscle_group_id,
            is_primary,
            muscle_groups(name)
          )
        `)
        .eq('id', exerciseId)
        .single();

      if (error) throw error;

      const formattedExercise: Exercise = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        difficulty: data.difficulty || 'beginner',
        category: data.exercise_categories?.name || 'General',
        equipment: data.equipment?.name || 'Bodyweight',
        primary_muscles: data.exercise_muscle_groups
          ?.filter(emg => emg.is_primary)
          .map(emg => emg.muscle_groups?.name || '')
          .filter(Boolean) || [],
        secondary_muscles: data.exercise_muscle_groups
          ?.filter(emg => !emg.is_primary)
          .map(emg => emg.muscle_groups?.name || '')
          .filter(Boolean) || [],
        instructions: data.instructions || [],
        media_links: data.media_links || []
      };

      setExercise(formattedExercise);
    } catch (error) {
      console.error('Error fetching exercise details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullPage = () => {
    if (exercise) {
      window.open(`/exercise/${exercise.id}`, '_blank');
    }
  };

  const getMediaIcon = (link: string) => {
    if (link.includes('youtube') || link.includes('youtu.be')) {
      return <Play className="h-4 w-4" />;
    } else if (link.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Exercise Details</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewFullPage}
              className="h-8"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Full Page
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading exercise details...</div>
          </div>
        ) : exercise ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold mb-2">{exercise.name}</h2>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{exercise.difficulty}</Badge>
                <Badge variant="outline">{exercise.category}</Badge>
                <Badge variant="outline">{exercise.equipment}</Badge>
              </div>
            </div>

            {/* Description */}
            {exercise.description && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{exercise.description}</p>
              </div>
            )}

            {/* Target Muscles */}
            {(exercise.primary_muscles.length > 0 || exercise.secondary_muscles.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Target Muscles</h3>
                <div className="space-y-2">
                  {exercise.primary_muscles.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Primary:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.primary_muscles.map((muscle, idx) => (
                          <Badge key={idx} variant="default" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {exercise.secondary_muscles.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Secondary:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.secondary_muscles.map((muscle, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions */}
            {exercise.instructions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                <ol className="space-y-2">
                  {exercise.instructions.map((instruction, idx) => (
                    <li key={idx} className="flex">
                      <span className="font-medium text-blue-600 mr-2">{idx + 1}.</span>
                      <span className="text-gray-700">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Media Links */}
            {exercise.media_links.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Media Resources</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exercise.media_links.map((link, idx) => (
                    <Card key={idx} className="p-3">
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        {getMediaIcon(link)}
                        <span className="text-sm truncate">
                          {link.includes('youtube') || link.includes('youtu.be') 
                            ? 'Video Tutorial' 
                            : link.includes('image') || link.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                            ? 'Image Reference'
                            : 'Resource'
                          }
                        </span>
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Exercise not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};