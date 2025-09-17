import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, isSameDay, isWithinInterval, startOfWeek, endOfWeek } from "date-fns";

interface RoutineDay {
  id: string;
  name: string;
  description?: string;
  day_number: number;
}

interface Assignment {
  id: string;
  routine_id: string;
  plan_type: 'strict' | 'flexible';
  start_date: string;
  is_active: boolean;
  routine: {
    days_per_week: number;
    routine_days: RoutineDay[];
  };
}

interface WorkoutSession {
  id: string;
  name: string;
  start_time: string;
  routine_day_id?: string;
}

export interface ScheduleDay {
  id: string;
  assignment_id: string;
  scheduled_date: string;
  is_rest_day: boolean;
  is_completed: boolean;
  was_skipped: boolean;
  routine_day?: {
    name: string;
    description?: string;
  };
  workout_session?: {
    name: string;
  };
  assignment?: {
    plan_type: 'strict' | 'flexible';
  };
}

export interface RoutineSchedule {
  routine_name: string;
  assignment_id: string;
  schedule: ScheduleDay[];
}

interface SkippedDay {
  date: string;
  assignment_id: string;
}

export const useWorkoutSchedule = (clientId: string, weekDate: Date) => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [routineSchedules, setRoutineSchedules] = useState<RoutineSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [skippedDays, setSkippedDays] = useState<SkippedDay[]>([]);

  useEffect(() => {
    if (clientId) {
      fetchAndGenerateSchedule();
    }
  }, [clientId, weekDate]);

  const fetchAndGenerateSchedule = async () => {
    setLoading(true);
    try {
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekDate, { weekStartsOn: 1 });
      
      console.log('Fetching schedule for client:', clientId, 'week:', format(weekStart, 'yyyy-MM-dd'), 'to', format(weekEnd, 'yyyy-MM-dd'));

      // Fetch active assignments with routine data
      const { data: assignments, error: assignmentError } = await supabase
        .from('client_routine_assignments')
        .select(`
          id,
          routine_id,
          plan_type,
          start_date,
          is_active,
          workout_routines (
            name,
            days_per_week,
            routine_days (
              id,
              name,
              description,
              day_number
            )
          )
        `)
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (assignmentError) throw assignmentError;
      
      console.log('Fetched assignments:', assignments);
      console.log('Assignments count:', Array.isArray(assignments) ? assignments.length : 0,
        Array.isArray(assignments) ? assignments.map((a: any) => ({ id: a.id, routine_id: a.routine_id, plan_type: a.plan_type })) : []);

      // Fetch completed workout sessions for the week
      const { data: sessions, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('id, name, start_time, routine_day_id')
        .eq('user_id', clientId)
        .gte('start_time', format(weekStart, 'yyyy-MM-dd'))
        .lte('start_time', format(weekEnd, 'yyyy-MM-dd 23:59:59'));

      if (sessionError) throw sessionError;

      // Load skipped days from localStorage (temporary storage for client-side skips)
      const storedSkips = localStorage.getItem(`skipped_days_${clientId}`);
      const parsedSkips: SkippedDay[] = storedSkips ? JSON.parse(storedSkips) : [];
      setSkippedDays(parsedSkips);

      // Generate routine-based schedules (one row per active assignment)
      const routineBasedSchedules = generateRoutineSchedules(
        assignments || [],
        sessions || [],
        parsedSkips,
        weekStart,
        weekEnd
      );
      
      console.log('Generated routine schedules count:', routineBasedSchedules.length,
        routineBasedSchedules.map((r) => ({ assignment_id: r.assignment_id, routine_name: r.routine_name, days: r.schedule.length })));
      setRoutineSchedules(routineBasedSchedules);
      
      // Keep flat schedule for backward compatibility (first assignment per day)
      const flatSchedule = routineBasedSchedules.flatMap(row => row.schedule);
      setSchedule(flatSchedule);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };


  const skipDay = (date: string, assignmentId: string) => {
    const newSkip: SkippedDay = { date, assignment_id: assignmentId };
    const updatedSkips = [...skippedDays, newSkip];
    
    // Store in localStorage
    localStorage.setItem(`skipped_days_${clientId}`, JSON.stringify(updatedSkips));
    setSkippedDays(updatedSkips);
    
    // Refresh schedule
    fetchAndGenerateSchedule();
  };

  const generateRoutineSchedules = (
    assignments: any[],
    sessions: WorkoutSession[],
    skipped: SkippedDay[],
    weekStart: Date,
    weekEnd: Date
  ): RoutineSchedule[] => {
    return assignments.map(assignment => {
      const routine = assignment.workout_routines;
      const routineName = routine?.name || 'Unnamed Routine';
      
      const routineSchedule: ScheduleDay[] = [];
      
      // Generate schedule for each day of the week for this specific routine
      let currentDate = weekStart;
      while (currentDate <= weekEnd) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const assignmentStart = new Date(assignment.start_date);
        
        // Only generate schedule for dates after assignment start
        if (currentDate >= assignmentStart) {
          const routineDays = routine?.routine_days?.sort((a: RoutineDay, b: RoutineDay) => a.day_number - b.day_number) || [];
          
          // Check if this day was skipped
          const wasSkipped = skipped.some(skip => 
            skip.date === dateStr && skip.assignment_id === assignment.id
          );

          let daySchedule: ScheduleDay | null = null;

          if (wasSkipped) {
            daySchedule = {
              id: `${assignment.id}-${dateStr}`,
              assignment_id: assignment.id,
              scheduled_date: dateStr,
              is_rest_day: true,
              is_completed: false,
              was_skipped: true,
              assignment: { plan_type: assignment.plan_type }
            };
          } else {
            // Generate based on plan type
            if (assignment.plan_type === 'strict') {
              // Strict plan: Based on days of week
              const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
              const mondayBasedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to Monday=1 system
              
              if (mondayBasedDay <= (routine?.days_per_week || 0)) {
                const routineDay = routineDays[mondayBasedDay - 1];
                if (routineDay) {
                  daySchedule = {
                    id: `${assignment.id}-${dateStr}`,
                    assignment_id: assignment.id,
                    scheduled_date: dateStr,
                    is_rest_day: false,
                    is_completed: false,
                    was_skipped: false,
                    routine_day: {
                      name: routineDay.name,
                      description: routineDay.description
                    },
                    assignment: { plan_type: assignment.plan_type }
                  };
                }
              } else {
                // Rest day for strict plan
                daySchedule = {
                  id: `${assignment.id}-${dateStr}`,
                  assignment_id: assignment.id,
                  scheduled_date: dateStr,
                  is_rest_day: true,
                  is_completed: false,
                  was_skipped: false,
                  assignment: { plan_type: assignment.plan_type }
                };
              }
            } else {
              // Flexible plan: Cycle through routine days
              const daysSinceStart = Math.floor((currentDate.getTime() - assignmentStart.getTime()) / (1000 * 60 * 60 * 24));
              // Adjust days since start by subtracting skipped days before this date
              const skippedDaysBeforeThis = skipped.filter(skip => 
                skip.assignment_id === assignment.id && 
                new Date(skip.date) < currentDate
              ).length;
              
              const adjustedDaysSinceStart = daysSinceStart - skippedDaysBeforeThis;
              const routineDay = routineDays[adjustedDaysSinceStart % routineDays.length];
              
              if (routineDay) {
                daySchedule = {
                  id: `${assignment.id}-${dateStr}`,
                  assignment_id: assignment.id,
                  scheduled_date: dateStr,
                  is_rest_day: false,
                  is_completed: false,
                  was_skipped: false,
                  routine_day: {
                    name: routineDay.name,
                    description: routineDay.description
                  },
                  assignment: { plan_type: assignment.plan_type }
                };
              }
            }
          }

          // Check if there's a completed workout session for this day
          if (daySchedule) {
            const session = sessions.find(s => 
              isSameDay(new Date(s.start_time), currentDate) && 
              (!s.routine_day_id || routineDays.some((rd: RoutineDay) => rd.id === s.routine_day_id))
            );
            
            if (session) {
              daySchedule.is_completed = true;
              daySchedule.workout_session = {
                name: session.name
              };
            }

            routineSchedule.push(daySchedule);
          }
        }
        
        currentDate = addDays(currentDate, 1);
      }
      
      return {
        routine_name: routineName,
        assignment_id: assignment.id,
        schedule: routineSchedule
      };
    });
  };

  return {
    schedule,
    routineSchedules,
    loading,
    skipDay,
    refreshSchedule: fetchAndGenerateSchedule
  };
};