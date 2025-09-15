import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Dumbbell, Moon, CheckCircle, XCircle } from "lucide-react";
import { useWorkoutSchedule, type ScheduleDay } from "@/hooks/useWorkoutSchedule";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast, addWeeks, subWeeks } from "date-fns";

interface WorkoutCalendarProps {
  clientId: string;
  canSeeWorkoutHistory: boolean;
}

export const WorkoutCalendar = ({ clientId, canSeeWorkoutHistory }: WorkoutCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const { schedule, loading } = useWorkoutSchedule(
    canSeeWorkoutHistory ? clientId : '', 
    currentWeek
  );


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

  const getDayStatus = (date: Date, scheduleDay?: ScheduleDay) => {
    if (!scheduleDay) {
      return { icon: Moon, color: "text-muted-foreground", bgColor: "bg-muted/30", label: "Rest" };
    }

    if (scheduleDay.was_skipped) {
      return { icon: XCircle, color: "text-orange-600", bgColor: "bg-orange-100", label: "Skipped" };
    }

    if (scheduleDay.is_completed) {
      return { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Completed" };
    }

    if (scheduleDay.is_rest_day) {
      return { icon: Moon, color: "text-muted-foreground", bgColor: "bg-muted/30", label: "Rest" };
    }

    if (isPast(date) && !isToday(date)) {
      return { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "Missed" };
    }

    return { icon: Dumbbell, color: "text-blue-600", bgColor: "bg-blue-100", label: "Scheduled" };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => 
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  if (!canSeeWorkoutHistory) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Calendar size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Workout schedule is private</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Workout Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
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
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {getWeekDays().map((date, index) => {
              const scheduleDay = getScheduleForDay(date);
              const { icon: StatusIcon, color, bgColor, label } = getDayStatus(date, scheduleDay);
              const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              
              return (
                <div key={date.toISOString()} className="space-y-1">
                  <div className="text-center">
                    <div className="text-xs font-medium text-muted-foreground">
                      {dayNames[index]}
                    </div>
                    <div className={`text-sm font-medium ${isToday(date) ? 'text-primary' : 'text-foreground'}`}>
                      {format(date, 'd')}
                    </div>
                  </div>
                  
                  <div className={`min-h-[80px] p-2 rounded-lg border-2 ${
                    isToday(date) ? 'border-primary' : 'border-border'
                  } ${bgColor} transition-colors`}>
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <StatusIcon size={16} className={`mb-1 ${color}`} />
                      <div className="text-xs font-medium">{label}</div>
                      
                      {scheduleDay && !scheduleDay.is_rest_day && (
                        <div className="mt-1">
                          {scheduleDay.workout_session ? (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {scheduleDay.workout_session.name}
                            </Badge>
                          ) : scheduleDay.routine_day ? (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {scheduleDay.routine_day.name}
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle size={12} className="text-green-600" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell size={12} className="text-blue-600" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle size={12} className="text-red-600" />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle size={12} className="text-orange-600" />
              <span>Skipped</span>
            </div>
            <div className="flex items-center gap-1">
              <Moon size={12} className="text-muted-foreground" />
              <span>Rest</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};