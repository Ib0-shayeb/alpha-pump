import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const RoleToggle = () => {
  const [isTrainer, setIsTrainer] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsTrainer(profile?.role === 'trainer');
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const toggleRole = async (checked: boolean) => {
    if (!user) return;
    
    try {
      const newRole = checked ? 'trainer' : 'client';
      
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsTrainer(checked);
      toast({
        title: "Role updated",
        description: `You are now viewing as a ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  if (loading) return null;

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="role-toggle" className="text-sm">
        Client
      </Label>
      <Switch
        id="role-toggle"
        checked={isTrainer}
        onCheckedChange={toggleRole}
      />
      <Label htmlFor="role-toggle" className="text-sm">
        Trainer
      </Label>
    </div>
  );
};