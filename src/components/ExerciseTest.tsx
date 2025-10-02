import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const ExerciseTest = () => {
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testQuery = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing basic exercise query...');
      
      // Test 1: Simple query
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, description')
        .limit(5);
      
      console.log('Query result:', { data, error });
      
      if (error) {
        setError(`Database error: ${error.message}`);
        console.error('Database error:', error);
      } else {
        setExercises(data || []);
        console.log('Success! Found exercises:', data?.length || 0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Connection error: ${errorMessage}`);
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Exercise Database Test</h3>
      
      <Button onClick={testQuery} disabled={loading} className="mb-4">
        {loading ? 'Testing...' : 'Test Database Connection'}
      </Button>
      
      {error && (
        <div className="text-red-600 mb-4 p-2 bg-red-50 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {exercises.length > 0 && (
        <div className="text-green-600 mb-4 p-2 bg-green-50 rounded">
          <strong>Success!</strong> Found {exercises.length} exercises
        </div>
      )}
      
      {exercises.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Exercises found:</h4>
          <ul className="list-disc list-inside space-y-1">
            {exercises.map(ex => (
              <li key={ex.id}>{ex.name} - {ex.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExerciseTest;

