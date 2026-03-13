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
      connections: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          participant_one: string
          participant_two: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_one: string
          participant_two: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          participant_one?: string
          participant_two?: string
        }
        Relationships: []
      }
      eb_access: {
        Row: {
          created_at: string | null
          event_id: string
          expires_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
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
          featured: boolean | null
          id: string
          location: string | null
          max_delegates: number | null
          organizer_id: string
          platform_fee: number | null
          registration_fee: number | null
          slug: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          max_delegates?: number | null
          organizer_id: string
          platform_fee?: number | null
          registration_fee?: number | null
          slug?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          featured?: boolean | null
          id?: string
          location?: string | null
          max_delegates?: number | null
          organizer_id?: string
          platform_fee?: number | null
          registration_fee?: number | null
          slug?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["event_status"] | null
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
      marksheet_scores: {
        Row: {
          committee_id: string | null
          created_at: string | null
          delegate_user_id: string
          diplomacy: number | null
          event_id: string
          id: string
          research: number | null
          scored_by: string
          speaking: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          committee_id?: string | null
          created_at?: string | null
          delegate_user_id: string
          diplomacy?: number | null
          event_id: string
          id?: string
          research?: number | null
          scored_by: string
          speaking?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          committee_id?: string | null
          created_at?: string | null
          delegate_user_id?: string
          diplomacy?: number | null
          event_id?: string
          id?: string
          research?: number | null
          scored_by?: string
          speaking?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marksheet_scores_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marksheet_scores_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string | null
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organizers: {
        Row: {
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          place: string | null
          state: string | null
          status: Database["public"]["Enums"]["organizer_status"] | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          place?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["organizer_status"] | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          place?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["organizer_status"] | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          awards_won: number | null
          bio: string | null
          committees_served: number | null
          created_at: string | null
          full_name: string | null
          id: string
          institution: string | null
          muns_attended: number | null
          phone: string | null
          rank_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          awards_won?: number | null
          bio?: string | null
          committees_served?: number | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          institution?: string | null
          muns_attended?: number | null
          phone?: string | null
          rank_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          awards_won?: number | null
          bio?: string | null
          committees_served?: number | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          institution?: string | null
          muns_attended?: number | null
          phone?: string | null
          rank_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          committee_id: string | null
          country_preference: string | null
          created_at: string | null
          event_id: string
          experience: string | null
          id: string
          portfolio_url: string | null
          status: Database["public"]["Enums"]["registration_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          committee_id?: string | null
          country_preference?: string | null
          created_at?: string | null
          event_id: string
          experience?: string | null
          id?: string
          portfolio_url?: string | null
          status?: Database["public"]["Enums"]["registration_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          committee_id?: string | null
          country_preference?: string | null
          created_at?: string | null
          event_id?: string
          experience?: string | null
          id?: string
          portfolio_url?: string | null
          status?: Database["public"]["Enums"]["registration_status"] | null
          updated_at?: string | null
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
          action: string | null
          created_at: string | null
          event_id: string | null
          exit_count: number | null
          id: string
          url: string | null
          user_id: string
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          event_id?: string | null
          exit_count?: number | null
          id?: string
          url?: string | null
          user_id: string
        }
        Update: {
          action?: string | null
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
      secretaries: {
        Row: {
          created_at: string | null
          designation: string
          id: string
          name: string
          organizer_id: string
          phone: string | null
          photo_url: string | null
        }
        Insert: {
          created_at?: string | null
          designation: string
          id?: string
          name: string
          organizer_id: string
          phone?: string | null
          photo_url?: string | null
        }
        Update: {
          created_at?: string | null
          designation?: string
          id?: string
          name?: string
          organizer_id?: string
          phone?: string | null
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secretaries_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      task_completions: {
        Row: {
          created_at: string | null
          id: string
          points_awarded: number | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_awarded?: number | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points_awarded?: number | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "user_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          payment_method: string | null
          registration_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id?: string
        }
        Relationships: [
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
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          points: number | null
          title: string
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number | null
          title: string
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number | null
          title?: string
        }
        Relationships: []
      }
      video_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_bookmarks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          flagged: boolean | null
          id: string
          thumbnail_url: string | null
          title: string
          user_id: string
          video_url: string
          views: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          flagged?: boolean | null
          id?: string
          thumbnail_url?: string | null
          title: string
          user_id: string
          video_url: string
          views?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          flagged?: boolean | null
          id?: string
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
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_profile_and_role: {
        Args: { _account_type: string; _full_name: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "personal" | "organisation"
      app_role: "admin" | "organizer" | "delegate" | "eb"
      event_status: "draft" | "published" | "cancelled" | "completed"
      organizer_status: "pending" | "approved" | "rejected"
      registration_status: "pending" | "approved" | "rejected" | "waitlisted"
      transaction_status: "pending" | "completed" | "failed" | "refunded"
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
      account_type: ["personal", "organisation"],
      app_role: ["admin", "organizer", "delegate", "eb"],
      event_status: ["draft", "published", "cancelled", "completed"],
      organizer_status: ["pending", "approved", "rejected"],
      registration_status: ["pending", "approved", "rejected", "waitlisted"],
      transaction_status: ["pending", "completed", "failed", "refunded"],
    },
  },
} as const
