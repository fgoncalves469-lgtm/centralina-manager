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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      cars: {
        Row: {
          brand: string
          color: string | null
          created_at: string
          created_by: string
          ecu: string | null
          engine: string | null
          fuel: string | null
          gearbox: string | null
          id: string
          mileage: number | null
          model: string
          notes: string | null
          owner_id: string | null
          photo_path: string | null
          plate: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          brand?: string
          color?: string | null
          created_at?: string
          created_by?: string
          ecu?: string | null
          engine?: string | null
          fuel?: string | null
          gearbox?: string | null
          id?: string
          mileage?: number | null
          model?: string
          notes?: string | null
          owner_id?: string | null
          photo_path?: string | null
          plate?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          color?: string | null
          created_at?: string
          created_by?: string
          ecu?: string | null
          engine?: string | null
          fuel?: string | null
          gearbox?: string | null
          id?: string
          mileage?: number | null
          model?: string
          notes?: string | null
          owner_id?: string | null
          photo_path?: string | null
          plate?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      file_history: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json
          file_id: string
          id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details: Json
          file_id: string
          id?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          file_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_history_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "job_files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_logs: {
        Row: {
          created_at: string
          file_id: string
          file_name: string
          format: string | null
          id: string
          note: string | null
          path: string
          sha256: string | null
          size: number | null
          uploaded_by: string
          uploaded_by_email: string | null
        }
        Insert: {
          created_at?: string
          file_id: string
          file_name: string
          format?: string | null
          id?: string
          note?: string | null
          path: string
          sha256?: string | null
          size?: number | null
          uploaded_by?: string
          uploaded_by_email?: string | null
        }
        Update: {
          created_at?: string
          file_id?: string
          file_name?: string
          format?: string | null
          id?: string
          note?: string | null
          path?: string
          sha256?: string | null
          size?: number | null
          uploaded_by?: string
          uploaded_by_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_logs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "job_files"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignees: {
        Row: {
          created_at: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_assignees_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_files: {
        Row: {
          created_at: string
          file_name: string
          format: string | null
          id: string
          job_id: string
          kind: string
          notes: string | null
          path: string
          sha256: string | null
          size: number | null
          uploaded_by: string
          uploaded_by_email: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          format?: string | null
          id?: string
          job_id: string
          kind?: string
          notes?: string | null
          path: string
          sha256?: string | null
          size?: number | null
          uploaded_by?: string
          uploaded_by_email?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          format?: string | null
          id?: string
          job_id?: string
          kind?: string
          notes?: string | null
          path?: string
          sha256?: string | null
          size?: number | null
          uploaded_by?: string
          uploaded_by_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_files_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_history: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json
          event: string
          id: string
          job_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          event: string
          id?: string
          job_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          event?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_progress: {
        Row: {
          completed_steps: string[]
          final_report: string | null
          information_request: string | null
          job_id: string
          message: string | null
          public_status: string
          report_released: boolean
          updated_at: string
        }
        Insert: {
          completed_steps?: string[]
          final_report?: string | null
          information_request?: string | null
          job_id: string
          message?: string | null
          public_status?: string
          report_released?: boolean
          updated_at?: string
        }
        Update: {
          completed_steps?: string[]
          final_report?: string | null
          information_request?: string | null
          job_id?: string
          message?: string | null
          public_status?: string
          report_released?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_progress_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_reports: {
        Row: {
          content: string
          job_id: string
          released: boolean
          updated_at: string
        }
        Insert: {
          content?: string
          job_id: string
          released?: boolean
          updated_at?: string
        }
        Update: {
          content?: string
          job_id?: string
          released?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          brand: string
          car_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string
          ecu: string | null
          engine: string | null
          hp_after: number | null
          hp_before: number | null
          id: string
          internal_status: string
          mechanical_setup: string | null
          model: string
          nm_after: number | null
          nm_before: number | null
          notes: string | null
          objective: string | null
          plate: string | null
          stage: string
          status: string
          validated_file_id: string | null
          year: number | null
        }
        Insert: {
          brand?: string
          car_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string
          ecu?: string | null
          engine?: string | null
          hp_after?: number | null
          hp_before?: number | null
          id?: string
          internal_status?: string
          mechanical_setup?: string | null
          model?: string
          nm_after?: number | null
          nm_before?: number | null
          notes?: string | null
          objective?: string | null
          plate?: string | null
          stage?: string
          status?: string
          validated_file_id?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          car_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string
          ecu?: string | null
          engine?: string | null
          hp_after?: number | null
          hp_before?: number | null
          id?: string
          internal_status?: string
          mechanical_setup?: string | null
          model?: string
          nm_after?: number | null
          nm_before?: number | null
          notes?: string | null
          objective?: string | null
          plate?: string | null
          stage?: string
          status?: string
          validated_file_id?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_validated_file_id_fkey"
            columns: ["validated_file_id"]
            isOneToOne: false
            referencedRelation: "job_files"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      test_sessions: {
        Row: {
          conditions: string
          created_by: string
          file_id: string
          id: string
          observations: string
          recorded_at: string
          results: string
        }
        Insert: {
          conditions?: string
          created_by?: string
          file_id: string
          id?: string
          observations?: string
          recorded_at?: string
          results?: string
        }
        Update: {
          conditions?: string
          created_by?: string
          file_id?: string
          id?: string
          observations?: string
          recorded_at?: string
          results?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "job_files"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          displacement: number | null
          ecus: string[]
          engine: string
          engine_code: string | null
          id: string
          model: string
          power_hp: number | null
        }
        Insert: {
          brand: string
          created_at?: string
          displacement?: number | null
          ecus?: string[]
          engine: string
          engine_code?: string | null
          id?: string
          model: string
          power_hp?: number | null
        }
        Update: {
          brand?: string
          created_at?: string
          displacement?: number | null
          ecus?: string[]
          engine?: string
          engine_code?: string | null
          id?: string
          model?: string
          power_hp?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_file: { Args: { _file_id: string }; Returns: boolean }
      can_edit_job: { Args: { _job_id: string }; Returns: boolean }
      car_public_progress: {
        Args: { _car_id: string }
        Returns: {
          completed_steps: string[]
          information_request: string
          job_id: string
          message: string
          public_status: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_editor: { Args: { _user_id: string }; Returns: boolean }
      owns_job: { Args: { _job_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "contributor" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "contributor", "viewer"],
    },
  },
} as const
