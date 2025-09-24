import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, Moon, CheckCircle, XCircle, SkipForward, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useWorkoutSchedule, type ScheduleDay } from "@/hooks/useWorkoutSchedule";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast, addWeeks, subWeeks, isBefore } from "date-fns";

interface ClientWorkoutCalendarProps {
  className?: string;
}

export const ClientWorkoutCalendar = ({ className }: ClientWorkoutCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [selectedSkipDay, setSelectedSkipDay] = useState<ScheduleDay | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  console.log('ClientWorkoutCalendar - user:', user?.id, 'currentWeek:', currentWeek);
  
  const { schedule, routineSchedules, loading, skipDay } = useWorkoutSchedule(user?.id || '', currentWeek);
  console.log('RoutineSchedules in ClientWorkoutCalendar:', routineSchedules?.length, routineSchedules?.map(r => ({ assignment_id: r.assignment_id, routine_name: r.routine_name })));


  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const getScheduleForDay = (date: Date) => {
    return schedule.find(s => 
      isSameDay(new Date(s.scheduled_date), date)
    );
  };

  const getScheduleForDayForAssignment = (assignmentId: string, date: Date) => {
    const row = routineSchedules.find(r => r.assignment_id === assignmentId);
    return row?.schedule.find(s => isSameDay(new Date(s.scheduled_date), date));
  };

  const getDayStatus = (date: Date, scheduleDay?: ScheduleDay) => {
    if (!scheduleDay) {
      return { icon: Moon, color: "text-muted-foreground", bgColor: "bg-muted/30 text-foreground", label: "Rest" };
    }

    if (scheduleDay.was_skipped) {
      return { icon: XCircle, color: "text-orange-700", bgColor: "bg-orange-200 text-slate-900", label: "Skipped" };
    }

    if (scheduleDay.is_completed) {
      return { icon: CheckCircle, color: "text-green-700", bgColor: "bg-green-200 text-slate-900", label: "Completed" };
    }

    if (scheduleDay.is_rest_day) {
      return { icon: Moon, color: "text-muted-foreground", bgColor: "bg-muted/30 text-foreground", label: "Rest" };
    }

    if (isPast(date) && !isToday(date)) {
      return { icon: XCircle, color: "text-red-700", bgColor: "bg-red-200 text-slate-900", label: "Missed" };
    }

    return { icon: Dumbbell, color: "text-blue-700", bgColor: "bg-blue-200 text-slate-900", label: "Scheduled" };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  const handleSkipDay = () => {
    if (!selectedSkipDay || !user) return;

    try {
      skipDay(selectedSkipDay.scheduled_date, selectedSkipDay.assignment_id);

      toast({
        title: "Day skipped",
        description: "Workout day has been skipped and schedule adjusted",
      });

      setSkipDialogOpen(false);
      setSelectedSkipDay(null);
    } catch (error: any) {
      console.error('Error skipping day:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to skip workout day",
        variant: "destructive",
      });
    }
  };

  const canSkipDay = (scheduleDay: ScheduleDay, date: Date) => {
    return (
      scheduleDay.assignment?.plan_type === 'flexible' &&
      !scheduleDay.is_completed &&
      !scheduleDay.was_skipped &&
      !scheduleDay.is_rest_day &&
      (isToday(date) || isBefore(new Date(), date))
    );
  };

  const handleDayClick = (scheduleDay: ScheduleDay, date: Date) => {
    console.log('Day clicked:', { 
      isToday: isToday(date), 
      isCompleted: scheduleDay.is_completed,
      isRestDay: scheduleDay.is_rest_day,
      hasRoutineDay: !!scheduleDay.routine_day?.id,
      hasWorkoutSession: !!scheduleDay.workout_session?.id,
      routineId: scheduleDay.routine_id
    });
    
    if (scheduleDay.is_completed && scheduleDay.workout_session?.id) {
      // Navigate to completed workout session details
      navigate(`/workout-session/${scheduleDay.workout_session.id}`);
    } else if (isToday(date) && !scheduleDay.is_rest_day && scheduleDay.routine_day?.id) {
      // Only navigate to scheduled routine details if it's today and there's a scheduled workout
      navigate(`/routine/${scheduleDay.routine_id}/day/${scheduleDay.routine_day.id}`);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            My Workout Schedule
          </CardTitle>
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xs sm:text-sm font-medium min-w-[100px] sm:min-w-[120px] text-center px-1">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-14 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Week day header shown once for all rows */}
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((date) => (
                <div key={`header-${date.toISOString()}`} className="text-center">
                  <div className="text-xs font-medium text-muted-foreground">
                    {format(date, 'EEE')}
                  </div>
                  <div className={`text-sm font-medium ${isToday(date) ? 'text-primary' : 'text-foreground'}`}>
                    {format(date, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {routineSchedules.map((row) => (
              <div key={row.assignment_id}>
                <div className="mb-2 text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span>{row.routine_name}</span>
                  {(() => {
                    const planType = row.schedule.find(s => s.assignment?.plan_type)?.assignment?.plan_type as ('strict' | 'flexible' | undefined);
                    return planType ? (
                      <Badge variant={planType === 'flexible' ? 'secondary' : 'default'}>
                        {planType === 'flexible' ? 'Flexible Plan' : 'Strict Plan'}
                      </Badge>
                    ) : null;
                  })()}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getWeekDays().map((date, index) => {
                    const scheduleDay = getScheduleForDayForAssignment(row.assignment_id, date);
                    const { bgColor, icon: Icon, label } = getDayStatus(date, scheduleDay);

                    return (
                      <div key={date.toISOString()} className="">
                        <div 
                          className={`min-h-[120px] p-2 rounded-lg border-2 ${
                            isToday(date) ? 'border-primary' : 'border-border'
                          } ${bgColor} transition-colors relative flex flex-col items-center justify-between ${
                            (scheduleDay?.is_completed && scheduleDay?.workout_session?.id) || 
                            (isToday(date) && !scheduleDay?.is_rest_day && scheduleDay?.routine_day?.id) 
                              ? 'cursor-pointer hover:opacity-80' : ''
                          }`}
                          onClick={() => scheduleDay && handleDayClick(scheduleDay, date)}
                        >
                          
                          {/* Icon */}
                          <Icon size={14} className="text-current mb-1" />
                          
                          {/* Vertical Text */}
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-[10px] font-medium text-current transform -rotate-90 whitespace-nowrap">
                              {scheduleDay && !scheduleDay.is_rest_day && scheduleDay.workout_session ? (
                                scheduleDay.workout_session.name
                              ) : scheduleDay && !scheduleDay.is_rest_day && scheduleDay.routine_day ? (
                                scheduleDay.routine_day.name
                              ) : (
                                label
                              )}
                            </div>
                          </div>

                          {/* Action buttons at bottom */}
                          {scheduleDay && (
                            <div className="absolute bottom-1 right-1 flex gap-1">
                              {canSkipDay(scheduleDay, date) && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    setSelectedSkipDay(scheduleDay);
                                    setSkipDialogOpen(true);
                                  }}
                                >
                                  <SkipForward size={10} />
                                </Button>
                              )}
                              {isToday(date) && !scheduleDay.is_completed && !scheduleDay.is_rest_day && !scheduleDay.was_skipped && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    window.location.href = '/start-workout';
                                  }}
                                >
                                  <Play size={10} />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        

        {/* Skip Day Dialog */}
        <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skip Workout Day</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to skip this workout day? This will:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• Mark this day as a rest day</li>
                <li>• Shift all future workouts forward by one day</li>
                <li>• Extend your schedule to maintain the same number of workout days</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                This action can only be done with flexible plans.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSkipDay} variant="secondary">
                  Skip Day
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};