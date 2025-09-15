import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Profile {
  display_name: string | null;
  username: string | null;
  height: number | null;
  weight: number | null;
  date_of_birth: string | null;
  gender: string | null;
  activity_level: string | null;
  fitness_goals: string[] | null;
  preferred_units: string | null;
}

export const useProfileCompletion = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name, username, height, weight, date_of_birth, gender, activity_level, fitness_goals, preferred_units')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(profile);
      
      // Check if profile is complete - require at least display_name and username
      const complete = !!(profile?.display_name && profile?.username);
      setIsComplete(complete);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setIsComplete(false);
    } finally {
      setLoading(false);
    }
  };

  const markComplete = () => {
    setIsComplete(true);
  };

  return {
    profile,
    loading,
    isComplete,
    markComplete,
    refetch: fetchProfile
  };
};