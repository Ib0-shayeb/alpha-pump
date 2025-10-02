import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Dumbbell, ExternalLink, Eye } from 'lucide-react';
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

interface ExerciseAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (exercise: Exercise) => void;
  onExerciseIdChange?: (exerciseId: string | undefined) => void;
  placeholder?: string;
  className?: string;
}

export const ExerciseAutocomplete: React.FC<ExerciseAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  onExerciseIdChange,
  placeholder = "Search exercises...",
  className = ""
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredExercise, setHoveredExercise] = useState<Exercise | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('ExerciseAutocomplete mounted, fetching exercises...');
    console.log('Component props:', { value, onChange, onSelect, onExerciseIdChange });
    fetchExercises();
  }, []);

  useEffect(() => {
    if (value.trim()) {
      filterExercises(value);
      // Check for exact match
      const exactMatch = exercises.find(ex => 
        ex.name.toLowerCase() === value.toLowerCase()
      );
      if (exactMatch && onSelect) {
        onSelect(exactMatch);
        if (onExerciseIdChange) {
          onExerciseIdChange(exactMatch.id);
        }
      }
    } else {
      setFilteredExercises([]);
    }
  }, [value, exercises]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      console.log('Fetching exercises from database...');
      
      // Fetch all exercises with only the columns that definitely exist
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, description');

      console.log('Exercise fetch result:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from database');
        return;
      }

      console.log('Raw data from database:', data);

      const formattedExercises: Exercise[] = data.map(ex => ({
        id: ex.id,
        name: ex.name,
        description: ex.description || '',
        difficulty: 'beginner', // Default value since column doesn't exist
        category: 'General',
        equipment: 'Bodyweight',
        primary_muscles: [],
        secondary_muscles: [],
        instructions: [],
        media_links: []
      }));

      console.log('Formatted exercises:', formattedExercises);
      setExercises(formattedExercises);
      console.log('Exercises state updated, count:', formattedExercises.length);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      setExercises([]); // Ensure we set empty array on error
    } finally {
      setLoading(false);
      console.log('Fetch completed, loading set to false');
    }
  };

  const filterExercises = (searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    console.log('Filtering exercises with term:', term, 'Total exercises:', exercises.length);
    const filtered = exercises.filter(exercise => 
      exercise.name.toLowerCase().includes(term) ||
      exercise.description.toLowerCase().includes(term) ||
      exercise.primary_muscles.some(muscle => muscle.toLowerCase().includes(term)) ||
      exercise.secondary_muscles.some(muscle => muscle.toLowerCase().includes(term)) ||
      exercise.equipment.toLowerCase().includes(term) ||
      exercise.category.toLowerCase().includes(term)
    );
    console.log('Filtered results:', filtered.length);
    setFilteredExercises(filtered.slice(0, 10)); // Limit to 10 results
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    onChange(exercise.name);
    onSelect(exercise);
    if (onExerciseIdChange) {
      onExerciseIdChange(exercise.id);
    }
    setIsOpen(false);
    setHoveredExercise(null);
  };

  const handleViewExercise = (exercise: Exercise) => {
    window.open(`/exercise/${exercise.id}`, '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setHoveredExercise(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredExercise(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Debug info - remove this later */}
      <div className="text-xs text-gray-500 mb-1">
        Debug: Total exercises: {exercises.length}, Loading: {loading.toString()}
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto border shadow-lg">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading exercises...</div>
          ) : filteredExercises.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No exercises found (Total: {exercises.length}, Filtered: {filteredExercises.length})
            </div>
          ) : (
            <div className="py-2">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleExerciseSelect(exercise)}
                  onMouseEnter={() => setHoveredExercise(exercise)}
                  onMouseLeave={() => setHoveredExercise(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{exercise.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {exercise.category} • {exercise.equipment}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {exercise.difficulty}
                        </Badge>
                        {exercise.primary_muscles.slice(0, 2).map((muscle, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {muscle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewExercise(exercise);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Hover Preview */}
      {hoveredExercise && (
        <div className="fixed z-50 bg-white border shadow-xl rounded-lg p-4 max-w-md max-h-96 overflow-y-auto"
             style={{
               left: '50%',
               top: '50%',
               transform: 'translate(-50%, -50%)',
               pointerEvents: 'none'
             }}>
          <div className="sticky top-0 bg-white border-b pb-2 mb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{hoveredExercise.name}</h3>
              <Button
                size="sm"
                onClick={() => handleViewExercise(hoveredExercise)}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary">{hoveredExercise.difficulty}</Badge>
              <Badge variant="outline">{hoveredExercise.category}</Badge>
              <Badge variant="outline">{hoveredExercise.equipment}</Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            {hoveredExercise.description && (
              <div>
                <h4 className="font-medium text-sm mb-1">Description</h4>
                <p className="text-sm text-gray-600">{hoveredExercise.description}</p>
              </div>
            )}
            
            {hoveredExercise.primary_muscles.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-1">Target Muscles</h4>
                <div className="flex flex-wrap gap-1">
                  {hoveredExercise.primary_muscles.map((muscle, idx) => (
                    <Badge key={idx} variant="default" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                  {hoveredExercise.secondary_muscles.map((muscle, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-3 pt-2 border-t">
            <Button
              size="sm"
              onClick={() => handleViewExercise(hoveredExercise)}
              className="w-full"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Full Exercise Page
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
