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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward: number | null
        }
        Insert: {
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
          xp_reward?: number | null
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number | null
        }
        Relationships: []
      }
      assessment_history: {
        Row: {
          assessment_type: string
          attempted: number
          correct: number
          created_at: string
          difficulty: string
          final_score: number
          id: string
          mode: string
          negative_marks: number | null
          passed: boolean | null
          requirements_met: boolean | null
          score_percentage: number
          similarity_score: number | null
          skill: string
          skill_category: string
          time_taken_seconds: number | null
          topic: string
          total_questions: number
          unanswered: number
          user_id: string
          wrong: number
        }
        Insert: {
          assessment_type: string
          attempted?: number
          correct?: number
          created_at?: string
          difficulty: string
          final_score?: number
          id?: string
          mode: string
          negative_marks?: number | null
          passed?: boolean | null
          requirements_met?: boolean | null
          score_percentage?: number
          similarity_score?: number | null
          skill: string
          skill_category: string
          time_taken_seconds?: number | null
          topic: string
          total_questions?: number
          unanswered?: number
          user_id: string
          wrong?: number
        }
        Update: {
          assessment_type?: string
          attempted?: number
          correct?: number
          created_at?: string
          difficulty?: string
          final_score?: number
          id?: string
          mode?: string
          negative_marks?: number | null
          passed?: boolean | null
          requirements_met?: boolean | null
          score_percentage?: number
          similarity_score?: number | null
          skill?: string
          skill_category?: string
          time_taken_seconds?: number | null
          topic?: string
          total_questions?: number
          unanswered?: number
          user_id?: string
          wrong?: number
        }
        Relationships: []
      }
      exam_schedule: {
        Row: {
          created_at: string
          exam_date: string
          exam_name: string | null
          id: string
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          exam_name?: string | null
          id?: string
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          exam_name?: string | null
          id?: string
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedule_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_activity: {
        Row: {
          created_at: string
          distraction_events: number | null
          focus_score: number | null
          id: string
          idle_time_seconds: number | null
          pause_count: number | null
          session_id: string | null
          tab_switch_count: number | null
          time_away_seconds: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          distraction_events?: number | null
          focus_score?: number | null
          id?: string
          idle_time_seconds?: number | null
          pause_count?: number | null
          session_id?: string | null
          tab_switch_count?: number | null
          time_away_seconds?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          distraction_events?: number | null
          focus_score?: number | null
          id?: string
          idle_time_seconds?: number | null
          pause_count?: number | null
          session_id?: string | null
          tab_switch_count?: number | null
          time_away_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_activity_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed: boolean | null
          created_at: string | null
          current_value: number | null
          end_date: string | null
          goal_type: string
          id: string
          start_date: string
          subject_id: string | null
          target_value: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          current_value?: number | null
          end_date?: string | null
          goal_type: string
          id?: string
          start_date?: string
          subject_id?: string | null
          target_value: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          current_value?: number | null
          end_date?: string | null
          goal_type?: string
          id?: string
          start_date?: string
          subject_id?: string | null
          target_value?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_snapshots: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          rank: number | null
          score: number | null
          snapshot_date: string
          tasks_completed: number | null
          user_id: string
          weekly_study_minutes: number | null
          xp_total: number
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          rank?: number | null
          score?: number | null
          snapshot_date?: string
          tasks_completed?: number | null
          user_id: string
          weekly_study_minutes?: number | null
          xp_total?: number
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          rank?: number | null
          score?: number | null
          snapshot_date?: string
          tasks_completed?: number | null
          user_id?: string
          weekly_study_minutes?: number | null
          xp_total?: number
        }
        Relationships: []
      }
      learning_progress_predictions: {
        Row: {
          alert_message: string | null
          calculated_at: string
          current_readiness: number
          days_remaining: number | null
          exam_date: string | null
          id: string
          learning_speed: number
          predicted_readiness: number
          predicted_study_hours: number
          probability_ready: number | null
          recommended_additional_hours: number | null
          subject_id: string | null
          user_id: string
        }
        Insert: {
          alert_message?: string | null
          calculated_at?: string
          current_readiness?: number
          days_remaining?: number | null
          exam_date?: string | null
          id?: string
          learning_speed?: number
          predicted_readiness?: number
          predicted_study_hours?: number
          probability_ready?: number | null
          recommended_additional_hours?: number | null
          subject_id?: string | null
          user_id: string
        }
        Update: {
          alert_message?: string | null
          calculated_at?: string
          current_readiness?: number
          days_remaining?: number | null
          exam_date?: string | null
          id?: string
          learning_speed?: number
          predicted_readiness?: number
          predicted_study_hours?: number
          probability_ready?: number | null
          recommended_additional_hours?: number | null
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_predictions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          id: string
          last_study_date: string | null
          level: number | null
          longest_streak: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          id?: string
          last_study_date?: string | null
          level?: number | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          id?: string
          last_study_date?: string | null
          level?: number | null
          longest_streak?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          correct_answer: string
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          options: Json | null
          question_text: string
          question_type: string
          skill: string
          topic: string
          validated: boolean
        }
        Insert: {
          correct_answer: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          question_text: string
          question_type?: string
          skill: string
          topic: string
          validated?: boolean
        }
        Update: {
          correct_answer?: string
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          question_text?: string
          question_type?: string
          skill?: string
          topic?: string
          validated?: boolean
        }
        Relationships: []
      }
      readiness_scores: {
        Row: {
          calculated_at: string
          consistency_component: number | null
          focus_component: number | null
          id: string
          readiness_score: number
          revision_component: number | null
          study_hours_component: number | null
          subject_id: string | null
          task_component: number | null
          user_id: string
        }
        Insert: {
          calculated_at?: string
          consistency_component?: number | null
          focus_component?: number | null
          id?: string
          readiness_score?: number
          revision_component?: number | null
          study_hours_component?: number | null
          subject_id?: string | null
          task_component?: number | null
          user_id: string
        }
        Update: {
          calculated_at?: string
          consistency_component?: number | null
          focus_component?: number | null
          id?: string
          readiness_score?: number
          revision_component?: number | null
          study_hours_component?: number | null
          subject_id?: string | null
          task_component?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_scores_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_plans: {
        Row: {
          analysis_data: Json | null
          created_at: string
          daily_hours: number
          experience_level: string | null
          id: string
          progress_percentage: number | null
          skill_name: string
          specific_topic: string | null
          status: string | null
          target_days: number
          total_estimated_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data?: Json | null
          created_at?: string
          daily_hours?: number
          experience_level?: string | null
          id?: string
          progress_percentage?: number | null
          skill_name: string
          specific_topic?: string | null
          status?: string | null
          target_days?: number
          total_estimated_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json | null
          created_at?: string
          daily_hours?: number
          experience_level?: string | null
          id?: string
          progress_percentage?: number | null
          skill_name?: string
          specific_topic?: string | null
          status?: string | null
          target_days?: number
          total_estimated_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skill_resources: {
        Row: {
          created_at: string
          id: string
          resource_type: string | null
          skill_topic_id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_type?: string | null
          skill_topic_id: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_type?: string | null
          skill_topic_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_resources_skill_topic_id_fkey"
            columns: ["skill_topic_id"]
            isOneToOne: false
            referencedRelation: "skill_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_topics: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_minutes: number
          id: string
          scheduled_date: string | null
          skill_plan_id: string
          sort_order: number
          time_spent_minutes: number | null
          topic_name: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          id?: string
          scheduled_date?: string | null
          skill_plan_id: string
          sort_order?: number
          time_spent_minutes?: number | null
          topic_name: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number
          id?: string
          scheduled_date?: string | null
          skill_plan_id?: string
          sort_order?: number
          time_spent_minutes?: number | null
          topic_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_topics_skill_plan_id_fkey"
            columns: ["skill_plan_id"]
            isOneToOne: false
            referencedRelation: "skill_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          subject_id: string
          title: string
          type: string | null
          updated_at: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          subject_id: string
          title: string
          type?: string | null
          updated_at?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          subject_id?: string
          title?: string
          type?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          locked: boolean | null
          plan_date: string
          priority: string | null
          reason: string | null
          recommended_minutes: number
          subject_id: string | null
          subject_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          locked?: boolean | null
          plan_date: string
          priority?: string | null
          reason?: string | null
          recommended_minutes?: number
          subject_id?: string | null
          subject_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          locked?: boolean | null
          plan_date?: string
          priority?: string | null
          reason?: string | null
          recommended_minutes?: number
          subject_id?: string | null
          subject_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string | null
          duration_seconds: number
          end_time: string
          focus_score: number | null
          id: string
          session_type: string | null
          start_time: string
          subject_id: string | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          end_time: string
          focus_score?: number | null
          id?: string
          session_type?: string | null
          start_time: string
          subject_id?: string | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          end_time?: string
          focus_score?: number | null
          id?: string
          session_type?: string | null
          start_time?: string
          subject_id?: string | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          completion_percentage: number | null
          created_at: string | null
          icon: string | null
          id: string
          last_studied_at: string | null
          name: string
          total_study_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          last_studied_at?: string | null
          name: string
          total_study_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          last_studied_at?: string | null
          name?: string
          total_study_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          position: number | null
          priority: string | null
          subject_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          position?: number | null
          priority?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          position?: number | null
          priority?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      weak_topics: {
        Row: {
          detected_at: string
          id: string
          reason: string | null
          recommendation: string | null
          subject_id: string | null
          topic_name: string
          user_id: string
          weakness_score: number
        }
        Insert: {
          detected_at?: string
          id?: string
          reason?: string | null
          recommendation?: string | null
          subject_id?: string | null
          topic_name: string
          user_id: string
          weakness_score?: number
        }
        Update: {
          detected_at?: string
          id?: string
          reason?: string | null
          recommendation?: string | null
          subject_id?: string | null
          topic_name?: string
          user_id?: string
          weakness_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "weak_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_log: {
        Row: {
          created_at: string
          id: string
          source: string
          source_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          created_at?: string
          id?: string
          source: string
          source_id?: string | null
          user_id: string
          xp_amount: number
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          source_id?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
