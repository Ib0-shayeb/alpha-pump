import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const PRTestButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const createTestPR = async () => {
    if (!user) return;

    try {
      // Insert a test PR
      const { data, error } = await supabase
        .from('personal_records')
        .insert({
          user_id: user.id,
          exercise_name: 'Test Exercise',
          weight: 100,
          reps: 10,
          achieved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Test PR Created!",
        description: "Check your dashboard for the PR alert"
      });

      console.log('Test PR created:', data);
    } catch (error) {
      console.error('Error creating test PR:', error);
      toast({
        title: "Error",
        description: "Failed to create test PR",
        variant: "destructive"
      });
    }
  };

  return (
    <Button onClick={createTestPR} variant="outline" size="sm">
      Create Test PR
    </Button>
  );
};

