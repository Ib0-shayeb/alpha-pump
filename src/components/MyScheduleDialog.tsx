import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Dumbbell, CheckCircle, Trophy } from "lucide-react";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MyScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkout: (workout: SelectedWorkout) => void;
}

interface SelectedWorkout {
  session_id: string;
  session_name: string;
  routine_name: string;
  routine_day_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

interface CompletedSession {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  routine_day_id: string;
  routine_id: string;
}

export const MyScheduleDialog = ({ isOpen, onClose, onSelectWorkout }: MyScheduleDialogProps) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWorkout, setSelectedWorkout] = useState<SelectedWorkout | null>(null);
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch completed workout sessions
  useEffect(() => {
    if (isOpen && user) {
      fetchCompletedSessions();
    }
  }, [isOpen, user, selectedDate]);

  const fetchCompletedSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First, let's try to get all completed sessions for this user to see if any exist
      const { data: allSessions, error: allError } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          name,
          start_time,
          end_time,
          routine_day_id,
          routine_id
        `)
        .eq('user_id', user.id)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false });

      if (allError) throw allError;
      console.log('All completed sessions for user:', allSessions);

      // Calculate date range for the selected week
      const weekStart = new Date(selectedDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Start of week (Monday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Sunday)
      weekEnd.setHours(23, 59, 59, 999);

      console.log('Week range:', weekStart.toISOString(), 'to', weekEnd.toISOString());

      // Filter by date range
      const filteredSessions = (allSessions || []).filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      console.log('Filtered sessions for week:', filteredSessions);
      setCompletedSessions(filteredSessions);
    } catch (error) {
      console.error('Error fetching completed sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group sessions by date
  const sessionsByDate = completedSessions.reduce((acc, session) => {
    const date = session.start_time.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, CompletedSession[]>);

  // Get all dates with sessions
  const sessionDates = Object.keys(sessionsByDate).sort().reverse(); // Most recent first

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMM d");
  };

  const handleWorkoutSelect = (session: CompletedSession) => {
    const duration = session.end_time 
      ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)
      : 0;

    const selected: SelectedWorkout = {
      session_id: session.id,
      session_name: session.name,
      routine_name: 'Workout Routine', // We'll get this from the session name for now
      routine_day_name: 'Workout Day', // We'll get this from the session name for now
      start_time: session.start_time,
      end_time: session.end_time,
      duration_minutes: duration
    };
    setSelectedWorkout(selected);
  };

  const handleConfirm = () => {
    if (selectedWorkout) {
      onSelectWorkout(selectedWorkout);
      onClose();
    }
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setSelectedDate(newDate);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>My Workout Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-16 bg-muted rounded"></div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            My Completed Workouts
          </DialogTitle>
        </DialogHeader>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange('prev')}
          >
            ← Previous Week
          </Button>
          <div className="text-sm font-medium">
            {format(new Date(selectedDate.getTime() - (selectedDate.getDay() - 1) * 24 * 60 * 60 * 1000), "MMM d")} - {format(new Date(selectedDate.getTime() + (7 - selectedDate.getDay()) * 24 * 60 * 60 * 1000), "MMM d, yyyy")}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange('next')}
          >
            Next Week →
          </Button>
        </div>

        {/* Completed Sessions List */}
        <div className="space-y-4">
          {sessionDates.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No completed workouts</h3>
              <p className="text-muted-foreground">
                You haven't completed any workouts this week yet.
              </p>
            </Card>
          ) : (
            sessionDates.map((dateStr) => (
              <div key={dateStr} className="space-y-2">
                <h3 className="text-lg font-semibold text-primary">
                  {getDateLabel(dateStr)}
                </h3>
                <div className="space-y-2">
                  {sessionsByDate[dateStr].map((session, index) => (
                    <Card
                      key={`${session.id}-${index}`}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedWorkout?.session_id === session.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleWorkoutSelect(session)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{session.name}</h4>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <Trophy className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-primary/10 text-primary">
                                <Dumbbell className="w-3 h-3 mr-1" />
                                Workout Session
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(session.start_time), "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {format(new Date(session.start_time), "h:mm a")} - {format(new Date(session.end_time), "h:mm a")}
                              </div>
                              {session.end_time && (
                                <div className="flex items-center gap-1">
                                  <Dumbbell className="w-4 h-4" />
                                  {Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)} min
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedWorkout?.session_id === session.id && (
                              <CheckCircle className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedWorkout}
            className="bg-gradient-primary"
          >
            <Dumbbell className="w-4 h-4 mr-2" />
            Select Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
