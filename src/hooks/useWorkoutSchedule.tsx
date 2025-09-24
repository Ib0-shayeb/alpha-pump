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
  current_day_index: number;
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
  routine_id?: string;
  assignment_id?: string;
}

export interface ScheduleDay {
  id: string;
  assignment_id: string;
  routine_id: string;
  scheduled_date: string;
  is_rest_day: boolean;
  is_completed: boolean;
  was_skipped: boolean;
  routine_day?: {
    id: string;
    name: string;
    description?: string;
  };
  workout_session?: {
    id: string;
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


export const useWorkoutSchedule = (clientId: string, weekDate: Date) => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [routineSchedules, setRoutineSchedules] = useState<RoutineSchedule[]>([]);
  const [loading, setLoading] = useState(true);

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
          current_day_index,
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
        .select('id, name, start_time, routine_day_id, routine_id')
        .eq('user_id', clientId)
        .gte('start_time', format(weekStart, 'yyyy-MM-dd'))
        .lte('start_time', format(weekEnd, 'yyyy-MM-dd 23:59:59'));

      if (sessionError) throw sessionError;

      // Generate routine-based schedules (one row per active assignment)
      const routineBasedSchedules = generateRoutineSchedules(
        assignments || [],
        sessions || [],
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
    // Note: Skipped days are now computed from available data in generateRoutineSchedules
    // This function is kept for compatibility but doesn't store in localStorage anymore
    console.log('Skip day requested:', date, assignmentId);
    
    // Refresh schedule to recompute based on current data
    fetchAndGenerateSchedule();
  };

  const generateRoutineSchedules = (
    assignments: any[],
    sessions: WorkoutSession[],
    weekStart: Date,
    weekEnd: Date
  ): RoutineSchedule[] => {
    return assignments.map(assignment => {
      const routine = assignment.workout_routines;
      const routineName = routine?.name || 'Unnamed Routine';
      
      const routineSchedule: ScheduleDay[] = [];
      
      // Generate schedule for each day of the week for this specific routine
      let currentDate = weekStart;
      currentDate.setHours(0, 0, 0, 0); // Normalize to start of day
      while (currentDate <= weekEnd) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const assignmentStart = new Date(assignment.start_date);
        assignmentStart.setHours(0, 0, 0, 0); // Normalize to start of day
        
        // Only generate schedule for dates after assignment start
        if (currentDate >= assignmentStart) {
          const routineDays = routine?.routine_days?.sort((a: RoutineDay, b: RoutineDay) => a.day_number - b.day_number) || [];
          
          let daySchedule: ScheduleDay | null = null;

          // Determine if this day should have a workout based on plan type
          let shouldHaveWorkout = false;
          let expectedRoutineDay: RoutineDay | undefined;

          // Get today's date for both plan types (normalized to start of day)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (assignment.plan_type === 'strict') {
            // Strict plan: Based on days of week
            const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
            const mondayBasedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to Monday=1 system
            
            if (mondayBasedDay <= (routine?.days_per_week || 0)) {
              expectedRoutineDay = routineDays[mondayBasedDay - 1];
              shouldHaveWorkout = !!expectedRoutineDay;
            }
          } else {
            // Flexible plan: For now, treat as rest day since we don't have current_day_index
            const daysAfterToday = Math.floor((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            expectedRoutineDay = routineDays[assignment.current_day_index + daysAfterToday % routineDays.length];
            shouldHaveWorkout = false;
          }

          // Check if there's a completed workout session for this day and assignment
          const completedSession = sessions.find(s => 
            isSameDay(new Date(s.start_time), currentDate) && 
            s.routine_id === assignment.routine_id &&
            s.routine_day_id && routineDays.some((rd: RoutineDay) => rd.id === s.routine_day_id)
          );

          if(currentDate > today){
            if(assignment.plan_type === 'flexible'){
              const daysAfterToday = Math.floor((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const expectedRoutineDayIndex = assignment.current_day_index + daysAfterToday % routineDays.length;
              expectedRoutineDay = routineDays[expectedRoutineDayIndex];

              daySchedule = {
                id: `${assignment.id}-${dateStr}`,
                assignment_id: assignment.id,
                routine_id: assignment.routine_id,
                scheduled_date: dateStr,
                is_rest_day: false,
                is_completed: false,
                was_skipped: false,
                routine_day: {
                  id: expectedRoutineDay.id,
                  name: expectedRoutineDay.name,
                  description: expectedRoutineDay.description
                },
                assignment: { plan_type: assignment.plan_type }
              };
            } else {//strict plan
              if(shouldHaveWorkout){
                daySchedule = {
                  id: `${assignment.id}-${dateStr}`,
                  assignment_id: assignment.id,
                  routine_id: assignment.routine_id,
                  scheduled_date: dateStr,
                  is_rest_day: false,
                  is_completed: false,
                  was_skipped: false,
                  routine_day: {
                    id: expectedRoutineDay.id,
                    name: expectedRoutineDay.name,
                    description: expectedRoutineDay.description
                  },
                  assignment: { plan_type: assignment.plan_type }
                };
              } else {
                daySchedule = {
                  id: `${assignment.id}-${dateStr}`,
                  assignment_id: assignment.id,
                  routine_id: assignment.routine_id,
                  scheduled_date: dateStr,
                  is_rest_day: true,
                  is_completed: false,
                  was_skipped: false,
                  assignment: { plan_type: assignment.plan_type }
                };
              }
            }
          } else if (currentDate < today){//currentDate is before today
            if(assignment.plan_type === 'flexible'){

              daySchedule = {
                id: `${assignment.id}-${dateStr}`,
                assignment_id: assignment.id,
                routine_id: assignment.routine_id,
                scheduled_date: dateStr,
                is_rest_day: completedSession ? false : true,
                is_completed: completedSession ? true : false,
                was_skipped: false,
                routine_day: completedSession ? {
                  id: completedSession.routine_day_id!,
                  name: completedSession.name
                } : undefined,
                workout_session: completedSession ? {
                  id: completedSession.id,
                  name: completedSession.name
                } : undefined,
                assignment: { plan_type: assignment.plan_type }
              };
            } else {//strict plan
              daySchedule = {
                id: `${assignment.id}-${dateStr}`,
                assignment_id: assignment.id,
                routine_id: assignment.routine_id,
                scheduled_date: dateStr,
                is_rest_day: !shouldHaveWorkout,
                is_completed: shouldHaveWorkout && completedSession ? true : false,
                was_skipped: shouldHaveWorkout && !completedSession,
                routine_day: shouldHaveWorkout && completedSession ? {
                  id: completedSession.routine_day_id!,
                  name: completedSession.name
                } : undefined,
                workout_session: completedSession ? {
                  id: completedSession.id,
                  name: completedSession.name
                } : undefined,
                assignment: { plan_type: assignment.plan_type }
              };
            }
          } else {
            if(shouldHaveWorkout && !completedSession){
              if(assignment.plan_type === 'flexible'){
                const daysAfterToday = Math.floor((currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const expectedRoutineDayIndex = assignment.current_day_index + daysAfterToday % routineDays.length;
                expectedRoutineDay = routineDays[expectedRoutineDayIndex];

                daySchedule = {
                  id: `${assignment.id}-${dateStr}`,
                  assignment_id: assignment.id,
                  routine_id: assignment.routine_id,
                  scheduled_date: dateStr,
                  is_rest_day: false,
                  is_completed: false,
                  was_skipped: false,
                  routine_day: {
                    id: expectedRoutineDay.id,
                    name: expectedRoutineDay.name,
                    description: expectedRoutineDay.description
                  },
                  assignment: { plan_type: assignment.plan_type }
                };
              } else {//strict plan
                daySchedule = {
                  id: `${assignment.id}-${dateStr}`,
                  assignment_id: assignment.id,
                  routine_id: assignment.routine_id,
                  scheduled_date: dateStr,
                  is_rest_day: false,
                  is_completed: false,
                  was_skipped: false,
                  routine_day: {
                    id: expectedRoutineDay.id,
                    name: expectedRoutineDay.name,
                    description: expectedRoutineDay.description
                  },
                  assignment: { plan_type: assignment.plan_type }
                };
              }
            } else if(completedSession){
              daySchedule = {
                id: `${assignment.id}-${dateStr}`,
                assignment_id: assignment.id,
                routine_id: assignment.routine_id,
                scheduled_date: dateStr,
                is_rest_day: false,
                is_completed: true,
                was_skipped: false,
                routine_day: completedSession ? {
                  id: completedSession.routine_day_id!,
                  name: completedSession.name
                } : undefined,
                workout_session: completedSession ? {
                  id: completedSession.id,
                  name: completedSession.name
                } : undefined,
                assignment: { plan_type: assignment.plan_type }
              };
            } else {
              daySchedule = {
                id: `${assignment.id}-${dateStr}`,
                assignment_id: assignment.id,
                routine_id: assignment.routine_id,
                scheduled_date: dateStr,
                is_rest_day: true,
                is_completed: false,
                was_skipped: false,
                assignment: { plan_type: assignment.plan_type }
              };
            }
          }


          routineSchedule.push(daySchedule);
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