import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, X, Zap, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface PersonalRecord {
  id: string;
  exercise_name: string;
  weight: number;
  reps: number | null;
  achieved_at: string;
  workout_session_id: string | null;
}

export const PRAlert = () => {
  const [recentPRs, setRecentPRs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedPRs, setDismissedPRs] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRecentPRs();
    }
  }, [user]);

  const fetchRecentPRs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('PRAlert: Fetching PRs for user:', user.id);
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('PRAlert: Error fetching PRs:', error);
        throw error;
      }
      
      console.log('PRAlert: Fetched PRs:', data);
      setRecentPRs(data || []);
    } catch (error) {
      console.error('Error fetching recent PRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissPR = (prId: string) => {
    setDismissedPRs(prev => new Set([...prev, prId]));
  };

  const dismissAllPRs = () => {
    const allPRIds = recentPRs.map(pr => pr.id);
    setDismissedPRs(new Set(allPRIds));
  };

  const visiblePRs = recentPRs.filter(pr => !dismissedPRs.has(pr.id));

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <div className="animate-pulse">
          <div className="h-4 bg-yellow-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-yellow-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  if (visiblePRs.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-100 rounded-full">
            <Trophy className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
              Personal Records! 🎉
              <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                <Zap className="w-3 h-3 mr-1" />
                {visiblePRs.length} New
              </Badge>
            </h3>
            <p className="text-sm text-yellow-700">
              You've achieved new personal bests!
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissAllPRs}
            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {visiblePRs.map((pr) => (
          <div
            key={pr.id}
            className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-yellow-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-yellow-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{pr.exercise_name}</p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-yellow-700">{pr.weight}kg</span>
                  {pr.reps && <span> × {pr.reps} reps</span>}
                  <span className="text-gray-500 ml-2">
                    {formatDistanceToNow(new Date(pr.achieved_at), { addSuffix: true })}
                  </span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissPR(pr.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-yellow-200">
        <p className="text-xs text-yellow-600 text-center">
          Keep pushing your limits! 💪
        </p>
      </div>
    </Card>
  );
};
