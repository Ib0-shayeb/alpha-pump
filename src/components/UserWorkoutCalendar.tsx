import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell, 
  CheckCircle, 
  XCircle, 
  Moon,
  Calendar
} from "lucide-react";
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  isPast, 
  isToday, 
  addWeeks, 
  subWeeks 
} from "date-fns";
import { useWorkoutSchedule } from "@/hooks/useWorkoutSchedule";

interface UserWorkoutCalendarProps {
  userId: string;
  className?: string;
}

export const UserWorkoutCalendar = ({ userId, className }: UserWorkoutCalendarProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const { schedule, routineSchedules, loading } = useWorkoutSchedule(userId, currentWeek);

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  };

  const getScheduleForDay = (date: Date, routineSchedule?: any[]) => {
    const scheduleToCheck = routineSchedule || schedule;
    return scheduleToCheck.find(s => 
      isSameDay(new Date(s.scheduled_date), date)
    );
  };

  const getDayStatus = (date: Date, scheduleDay?: any) => {
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

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Workout Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!routineSchedules || routineSchedules.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Workout Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No workout schedule available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Workout Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentWeek, 'MMM d')} - {format(addWeeks(currentWeek, 1), 'MMM d')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {routineSchedules.map((routineSchedule) => (
            <div key={routineSchedule.assignment_id} className="space-y-3">
              <h3 className="text-base font-semibold text-foreground">
                {routineSchedule.routine_name}
              </h3>
              
              <div className="grid grid-cols-7 gap-1">
                {getWeekDays().map((date, index) => {
                  const scheduleDay = getScheduleForDay(date, routineSchedule.schedule);
                  const { bgColor, icon: Icon, label } = getDayStatus(date, scheduleDay);
                  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  
                  return (
                    <div 
                      key={`${routineSchedule.assignment_id}-${date.toISOString()}`} 
                      className={`p-2 rounded-lg border-2 ${
                        isToday(date) ? 'border-primary' : 'border-border'
                      } ${bgColor} transition-colors min-h-[120px] flex flex-col items-center justify-between`}
                    >
                      
                      {/* Day and Date */}
                      <div className="text-center mb-1">
                        <div className="text-[10px] font-medium text-muted-foreground">
                          {dayNames[index]}
                        </div>
                        <div className={`text-xs font-semibold ${isToday(date) ? 'text-primary' : 'text-foreground'}`}>
                          {format(date, 'd')}
                        </div>
                      </div>
                      
                      {/* Icon */}
                      <div className="flex-1 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      {/* Status Label */}
                      <div className="text-center">
                        <Badge 
                          variant="secondary" 
                          className={`text-[8px] px-1 py-0 ${bgColor.includes('muted') ? 'bg-muted text-muted-foreground' : ''}`}
                        >
                          {label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
