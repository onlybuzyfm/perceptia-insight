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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_assignees: {
        Row: {
          activity_id: string
          assigned_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          assigned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          assigned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_assignees_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "project_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          archived: boolean
          audience: Database["public"]["Enums"]["app_role"]
          content: string
          created_at: string
          created_by: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          audience?: Database["public"]["Enums"]["app_role"]
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          audience?: Database["public"]["Enums"]["app_role"]
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          carrera: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          interest_area: string | null
          message: string
          phone: string | null
          reviewed_by: string | null
          semestre: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          carrera?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          interest_area?: string | null
          message?: string
          phone?: string | null
          reviewed_by?: string | null
          semestre?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          carrera?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          interest_area?: string | null
          message?: string
          phone?: string | null
          reviewed_by?: string | null
          semestre?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: []
      }
      competitions: {
        Row: {
          created_at: string
          description: string
          event_date: string | null
          id: string
          location: string | null
          name: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string
          event_date?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_date?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          comment: string | null
          created_at: string
          evaluator_id: string
          id: string
          score: number
          updated_at: string
          weekly_update_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          evaluator_id: string
          id?: string
          score: number
          updated_at?: string
          weekly_update_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          evaluator_id?: string
          id?: string
          score?: number
          updated_at?: string
          weekly_update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_weekly_update_id_fkey"
            columns: ["weekly_update_id"]
            isOneToOne: false
            referencedRelation: "weekly_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      excused_late_updates: {
        Row: {
          created_at: string
          excused_by: string | null
          id: string
          reason: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          excused_by?: string | null
          id?: string
          reason?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          excused_by?: string | null
          id?: string
          reason?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      meeting_attendance: {
        Row: {
          id: string
          marked_at: string
          marked_by: string | null
          meeting_id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          marked_by?: string | null
          meeting_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          user_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          marked_by?: string | null
          meeting_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          location: string | null
          meeting_date: string
          research_line_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          location?: string | null
          meeting_date: string
          research_line_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          location?: string | null
          meeting_date?: string
          research_line_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_research_line_id_fkey"
            columns: ["research_line_id"]
            isOneToOne: false
            referencedRelation: "research_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          email_destino: string
          estado_envio: string
          fecha_creacion: string
          id: string
          notification_type: string
          payload: Json | null
          respuesta_webhook: Json | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email_destino: string
          estado_envio?: string
          fecha_creacion?: string
          id?: string
          notification_type: string
          payload?: Json | null
          respuesta_webhook?: Json | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email_destino?: string
          estado_envio?: string
          fecha_creacion?: string
          id?: string
          notification_type?: string
          payload?: Json | null
          respuesta_webhook?: Json | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          carrera: string | null
          codigo_estudiantil: string | null
          created_at: string
          email: string | null
          email_secundario: string | null
          fecha_verificacion_email_secundario: string | null
          full_name: string
          github_url: string | null
          id: string
          interest_line_id: string | null
          is_active: boolean
          is_public_member: boolean
          linkedin_url: string | null
          notificaciones_email_activas: boolean
          notify_telegram: boolean
          paralelo: string | null
          phone: string | null
          public_role: string | null
          semestre: string | null
          telegram_chat_id: number | null
          telegram_link_code: string | null
          telegram_linked_at: string | null
          telegram_username: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          carrera?: string | null
          codigo_estudiantil?: string | null
          created_at?: string
          email?: string | null
          email_secundario?: string | null
          fecha_verificacion_email_secundario?: string | null
          full_name?: string
          github_url?: string | null
          id: string
          interest_line_id?: string | null
          is_active?: boolean
          is_public_member?: boolean
          linkedin_url?: string | null
          notificaciones_email_activas?: boolean
          notify_telegram?: boolean
          paralelo?: string | null
          phone?: string | null
          public_role?: string | null
          semestre?: string | null
          telegram_chat_id?: number | null
          telegram_link_code?: string | null
          telegram_linked_at?: string | null
          telegram_username?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          carrera?: string | null
          codigo_estudiantil?: string | null
          created_at?: string
          email?: string | null
          email_secundario?: string | null
          fecha_verificacion_email_secundario?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          interest_line_id?: string | null
          is_active?: boolean
          is_public_member?: boolean
          linkedin_url?: string | null
          notificaciones_email_activas?: boolean
          notify_telegram?: boolean
          paralelo?: string | null
          phone?: string | null
          public_role?: string | null
          semestre?: string | null
          telegram_chat_id?: number | null
          telegram_link_code?: string | null
          telegram_linked_at?: string | null
          telegram_username?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_interest_line_id_fkey"
            columns: ["interest_line_id"]
            isOneToOne: false
            referencedRelation: "research_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      project_activities: {
        Row: {
          created_at: string
          created_by: string | null
          deadline: string
          description: string
          id: string
          project_id: string
          status: Database["public"]["Enums"]["activity_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deadline: string
          description?: string
          id?: string
          project_id: string
          status?: Database["public"]["Enums"]["activity_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deadline?: string
          description?: string
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["activity_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          joined_at: string
          project_id: string
          role_in_project: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          project_id: string
          role_in_project?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          project_id?: string
          role_in_project?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          is_published: boolean
          line: string | null
          research_line_id: string | null
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          line?: string | null
          research_line_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          line?: string | null
          research_line_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_research_line_id_fkey"
            columns: ["research_line_id"]
            isOneToOne: false
            referencedRelation: "research_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      research_lines: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          description: string
          display_order: number
          icon: string | null
          id: string
          project_id: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          description?: string
          display_order?: number
          icon?: string | null
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          description?: string
          display_order?: number
          icon?: string | null
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_competitions: {
        Row: {
          assigned_at: string
          competition_id: string
          id: string
          result: string | null
          team_id: string
        }
        Insert: {
          assigned_at?: string
          competition_id: string
          id?: string
          result?: string | null
          team_id: string
        }
        Update: {
          assigned_at?: string
          competition_id?: string
          id?: string
          result?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_competitions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_competitions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role_in_team: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role_in_team?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role_in_team?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_projects: {
        Row: {
          assigned_at: string
          id: string
          project_id: string
          team_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          project_id: string
          team_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          project_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string
          focus: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          focus?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          focus?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_groups: {
        Row: {
          chat_id: number
          created_at: string
          id: string
          is_active: boolean
          registered_by: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          chat_id: number
          created_at?: string
          id?: string
          is_active?: boolean
          registered_by?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          chat_id?: number
          created_at?: string
          id?: string
          is_active?: boolean
          registered_by?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_notification_logs: {
        Row: {
          chat_id: number | null
          created_at: string
          error: string | null
          id: string
          kind: string
          message: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          chat_id?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          message?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          chat_id?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          message?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_updates: {
        Row: {
          achievements: string | null
          blockers: string | null
          created_at: string
          evidence_url: string | null
          hours_spent: number | null
          id: string
          project_id: string | null
          repo_url: string | null
          summary: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          achievements?: string | null
          blockers?: string | null
          created_at?: string
          evidence_url?: string | null
          hours_spent?: number | null
          id?: string
          project_id?: string | null
          repo_url?: string | null
          summary?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          achievements?: string | null
          blockers?: string | null
          created_at?: string
          evidence_url?: string | null
          hours_spent?: number | null
          id?: string
          project_id?: string | null
          repo_url?: string | null
          summary?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      get_public_members: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          carrera: string
          full_name: string
          github_url: string
          id: string
          interest_line_id: string
          linkedin_url: string
          public_role: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_project_teacher: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_teacher: { Args: { _user_id: string }; Returns: boolean }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      share_team: { Args: { _a: string; _b: string }; Returns: boolean }
    }
    Enums: {
      activity_status: "pendiente" | "en_progreso" | "completada"
      app_role:
        | "visitante"
        | "estudiante"
        | "coordinador"
        | "admin"
        | "docente_asociado"
      application_status: "pendiente" | "en_revision" | "aceptada" | "rechazada"
      attendance_status: "presente" | "ausente" | "tardanza" | "justificado"
      project_status:
        | "propuesto"
        | "planificacion"
        | "activo"
        | "pausado"
        | "finalizado"
        | "publicado"
        | "archivado"
      resource_category:
        | "moodle"
        | "dataset"
        | "cvat"
        | "notion"
        | "github"
        | "drive"
        | "n8n"
        | "otro"
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
      activity_status: ["pendiente", "en_progreso", "completada"],
      app_role: [
        "visitante",
        "estudiante",
        "coordinador",
        "admin",
        "docente_asociado",
      ],
      application_status: ["pendiente", "en_revision", "aceptada", "rechazada"],
      attendance_status: ["presente", "ausente", "tardanza", "justificado"],
      project_status: [
        "propuesto",
        "planificacion",
        "activo",
        "pausado",
        "finalizado",
        "publicado",
        "archivado",
      ],
      resource_category: [
        "moodle",
        "dataset",
        "cvat",
        "notion",
        "github",
        "drive",
        "n8n",
        "otro",
      ],
    },
  },
} as const
