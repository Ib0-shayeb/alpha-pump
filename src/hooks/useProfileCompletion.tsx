import { useState, useEffect, useCallback, useRef } from "react";
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
  const hasFetched = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (!user || hasFetched.current) {
      console.log('Skipping profile fetch - user:', !!user, 'hasFetched:', hasFetched.current);
      return;
    }

    console.log('Starting profile fetch for user:', user.id);
    hasFetched.current = true;
    setLoading(true);

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name, username, height, weight, date_of_birth, gender, activity_level, fitness_goals, preferred_units')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile(profile);
      
      // Check if profile is complete - require essential fields
      const complete = !!(
        profile?.display_name && 
        profile?.username && 
        profile?.fitness_goals && 
        profile?.fitness_goals.length > 0 &&
        profile?.activity_level
      );
      setIsComplete(complete);
      console.log('Profile completion check:', { 
        profile, 
        complete,
        hasDisplayName: !!profile?.display_name,
        hasUsername: !!profile?.username,
        hasGoals: !!profile?.fitness_goals?.length,
        hasActivityLevel: !!profile?.activity_level
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setIsComplete(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('useProfileCompletion useEffect triggered - user:', !!user, 'user.id:', user?.id);
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
      hasFetched.current = false;
    }
  }, [user, fetchProfile]);

  const markComplete = () => {
    setIsComplete(true);
  };

  const refetch = useCallback(() => {
    hasFetched.current = false;
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    isComplete,
    markComplete,
    refetch
  };
};