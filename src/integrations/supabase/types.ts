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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      committees: {
        Row: {
          agenda: string | null
          capacity: number | null
          created_at: string | null
          event_id: string
          id: string
          name: string
        }
        Insert: {
          agenda?: string | null
          capacity?: number | null
          created_at?: string | null
          event_id: string
          id?: string
          name: string
        }
        Update: {
          agenda?: string | null
          capacity?: number | null
          created_at?: string | null
          event_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "committees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      eb_access: {
        Row: {
          active: boolean
          event_id: string
          granted_at: string
          granted_by: string
          id: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          event_id: string
          granted_at?: string
          granted_by: string
          id?: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          event_id?: string
          granted_at?: string
          granted_by?: string
          id?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eb_access_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          organizer_id: string
          platform_fee: number | null
          registration_deadline: string | null
          registration_fee: number | null
          slug: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          organizer_id: string
          platform_fee?: number | null
          registration_deadline?: string | null
          registration_fee?: number | null
          slug?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          organizer_id?: string
          platform_fee?: number | null
          registration_deadline?: string | null
          registration_fee?: number | null
          slug?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizers: {
        Row: {
          contact_person: string | null
          created_at: string | null
          email: string
          id: string
          institution_name: string
          location: string | null
          logo_url: string | null
          phone: string | null
          status: string
          user_id: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string | null
          email: string
          id?: string
          institution_name: string
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          status?: string
          user_id: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string | null
          email?: string
          id?: string
          institution_name?: string
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          awards_won: number | null
          bio: string | null
          created_at: string | null
          full_name: string
          id: string
          institution: string | null
          phone: string | null
          rank_points: number | null
          total_muns: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          awards_won?: number | null
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          institution?: string | null
          phone?: string | null
          rank_points?: number | null
          total_muns?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          awards_won?: number | null
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          institution?: string | null
          phone?: string | null
          rank_points?: number | null
          total_muns?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rank_points: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          points?: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rank_points_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          committee_id: string | null
          country_preference: string | null
          created_at: string | null
          email: string
          event_id: string
          experience: string | null
          full_name: string
          id: string
          institution: string | null
          phone: string | null
          portfolio_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          committee_id?: string | null
          country_preference?: string | null
          created_at?: string | null
          email: string
          event_id: string
          experience?: string | null
          full_name: string
          id?: string
          institution?: string | null
          phone?: string | null
          portfolio_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          committee_id?: string | null
          country_preference?: string | null
          created_at?: string | null
          email?: string
          event_id?: string
          experience?: string | null
          full_name?: string
          id?: string
          institution?: string | null
          phone?: string | null
          portfolio_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      research_logs: {
        Row: {
          action: string
          blocked: boolean | null
          created_at: string | null
          event_id: string | null
          exit_count: number | null
          id: string
          url: string | null
          user_id: string
        }
        Insert: {
          action: string
          blocked?: boolean | null
          created_at?: string | null
          event_id?: string | null
          exit_count?: number | null
          id?: string
          url?: string | null
          user_id: string
        }
        Update: {
          action?: string
          blocked?: boolean | null
          created_at?: string | null
          event_id?: string | null
          exit_count?: number | null
          id?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          completed_at: string
          id: string
          points_awarded: number
          task_id: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          completed_at?: string
          id?: string
          points_awarded?: number
          task_id: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          completed_at?: string
          id?: string
          points_awarded?: number
          task_id?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "user_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_completions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          event_id: string
          id: string
          payment_status: string
          platform_fee: number
          registration_id: string
          transaction_ref: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          event_id: string
          id?: string
          payment_status?: string
          platform_fee?: number
          registration_id: string
          transaction_ref?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          event_id?: string
          id?: string
          payment_status?: string
          platform_fee?: number
          registration_id?: string
          transaction_ref?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
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
      user_tasks: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          id: string
          points: number
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          points?: number
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          points?: number
          title?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          category: string
          created_at: string | null
          featured: boolean | null
          flagged: boolean | null
          id: string
          likes: number | null
          thumbnail_url: string | null
          title: string
          user_id: string
          video_url: string
          views: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          featured?: boolean | null
          flagged?: boolean | null
          id?: string
          likes?: number | null
          thumbnail_url?: string | null
          title: string
          user_id: string
          video_url: string
          views?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          featured?: boolean | null
          flagged?: boolean | null
          id?: string
          likes?: number | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
          video_url?: string
          views?: number | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "organizer" | "delegate" | "eb"
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
      app_role: ["admin", "organizer", "delegate", "eb"],
    },
  },
} as const
