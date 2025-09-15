export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      client_routine_assignments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_active: boolean
          plan_type: Database["public"]["Enums"]["plan_type"]
          routine_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          plan_type?: Database["public"]["Enums"]["plan_type"]
          routine_id: string
          start_date?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          plan_type?: Database["public"]["Enums"]["plan_type"]
          routine_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          fitness_goals: Database["public"]["Enums"]["fitness_goal"][] | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height: number | null
          id: string
          preferred_units: Database["public"]["Enums"]["unit_preference"] | null
          role: string | null
          trainer_can_see_height: boolean | null
          trainer_can_see_personal_info: boolean | null
          trainer_can_see_weight: boolean | null
          trainer_can_see_workout_history: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          weight: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          fitness_goals?: Database["public"]["Enums"]["fitness_goal"][] | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height?: number | null
          id?: string
          preferred_units?:
            | Database["public"]["Enums"]["unit_preference"]
            | null
          role?: string | null
          trainer_can_see_height?: boolean | null
          trainer_can_see_personal_info?: boolean | null
          trainer_can_see_weight?: boolean | null
          trainer_can_see_workout_history?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          weight?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          fitness_goals?: Database["public"]["Enums"]["fitness_goal"][] | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height?: number | null
          id?: string
          preferred_units?:
            | Database["public"]["Enums"]["unit_preference"]
            | null
          role?: string | null
          trainer_can_see_height?: boolean | null
          trainer_can_see_personal_info?: boolean | null
          trainer_can_see_weight?: boolean | null
          trainer_can_see_workout_history?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      routine_days: {
        Row: {
          created_at: string
          day_number: number
          description: string | null
          id: string
          name: string
          routine_id: string
        }
        Insert: {
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          name: string
          routine_id: string
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          name?: string
          routine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_days_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "workout_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          notes: string | null
          order_index: number | null
          reps: string | null
          rest_time_seconds: number | null
          routine_day_id: string
          sets: number | null
          weight_suggestion: string | null
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps?: string | null
          rest_time_seconds?: number | null
          routine_day_id: string
          sets?: number | null
          weight_suggestion?: string | null
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          reps?: string | null
          rest_time_seconds?: number | null
          routine_day_id?: string
          sets?: number | null
          weight_suggestion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_recommendations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          message: string | null
          routine_id: string
          status: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          message?: string | null
          routine_id: string
          status?: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          message?: string | null
          routine_id?: string
          status?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "routine_recommendations_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "workout_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_recommendations_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trainer_client_connections: {
        Row: {
          client_id: string
          created_at: string
          id: string
          requested_by: string
          status: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          requested_by: string
          status?: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          requested_by?: string
          status?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_client_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trainer_client_connections_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          id: string
          notes: string | null
          order_index: number | null
          session_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          id?: string
          notes?: string | null
          order_index?: number | null
          session_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          id?: string
          notes?: string | null
          order_index?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_routines: {
        Row: {
          created_at: string
          days_per_week: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_per_week?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_per_week?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_schedule: {
        Row: {
          assignment_id: string
          client_id: string
          created_at: string
          id: string
          is_completed: boolean
          is_rest_day: boolean
          routine_day_id: string | null
          scheduled_date: string
          was_skipped: boolean
          workout_session_id: string | null
        }
        Insert: {
          assignment_id: string
          client_id: string
          created_at?: string
          id?: string
          is_completed?: boolean
          is_rest_day?: boolean
          routine_day_id?: string | null
          scheduled_date: string
          was_skipped?: boolean
          workout_session_id?: string | null
        }
        Update: {
          assignment_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          is_rest_day?: boolean
          routine_day_id?: string | null
          scheduled_date?: string
          was_skipped?: boolean
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_schedule_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "client_routine_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_schedule_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_schedule_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          name: string
          notes: string | null
          routine_day_id: string | null
          routine_id: string | null
          start_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          name: string
          notes?: string | null
          routine_day_id?: string | null
          routine_id?: string | null
          start_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          name?: string
          notes?: string | null
          routine_day_id?: string | null
          routine_id?: string | null
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "workout_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed: boolean | null
          created_at: string
          distance: number | null
          duration_seconds: number | null
          id: string
          reps: number | null
          rpe: number | null
          set_number: number
          weight: number | null
          workout_exercise_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          distance?: number | null
          duration_seconds?: number | null
          id?: string
          reps?: number | null
          rpe?: number | null
          set_number: number
          weight?: number | null
          workout_exercise_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          distance?: number | null
          duration_seconds?: number | null
          id?: string
          reps?: number | null
          rpe?: number | null
          set_number?: number
          weight?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_workout_schedule: {
        Args: {
          _assignment_id: string
          _client_id: string
          _days_to_generate?: number
          _routine_id: string
          _start_date: string
        }
        Returns: undefined
      }
      is_accepted_trainer: {
        Args: { _client_id: string; _trainer_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
        | "extremely_active"
      fitness_goal:
        | "weight_loss"
        | "muscle_gain"
        | "endurance"
        | "strength"
        | "general_fitness"
        | "maintenance"
      gender_type: "male" | "female" | "other" | "prefer_not_to_say"
      plan_type: "strict" | "flexible"
      unit_preference: "metric" | "imperial"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extremely_active",
      ],
      fitness_goal: [
        "weight_loss",
        "muscle_gain",
        "endurance",
        "strength",
        "general_fitness",
        "maintenance",
      ],
      gender_type: ["male", "female", "other", "prefer_not_to_say"],
      plan_type: ["strict", "flexible"],
      unit_preference: ["metric", "imperial"],
    },
  },
} as const
