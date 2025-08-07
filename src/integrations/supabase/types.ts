export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {





      ai_interactions: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: number
          intent: string | null
          messages: Json | null
          model: string | null
          phone_number: string | null
          response: string | null
          tokens_used: number | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: number
          intent?: string | null
          messages?: Json | null
          model?: string | null
          phone_number?: string | null
          response?: string | null
          tokens_used?: number | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: number
          intent?: string | null
          messages?: Json | null
          model?: string | null
          phone_number?: string | null
          response?: string | null
          tokens_used?: number | null
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          parameters: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          parameters?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          parameters?: Json | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          clinic_id: string | null
          created_at: string | null
          created_by: string
          doctor_name: string
          id: string
          patient_name: string
          patient_phone: string
          status: string
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          doctor_name: string
          id?: string
          patient_name: string
          patient_phone: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          doctor_name?: string
          id?: string
          patient_name?: string
          patient_phone?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          calendar_id: string
          created_at: string | null
          end_time: string | null
          google_event_id: string
          id: string
          start_time: string | null
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calendar_id: string
          created_at?: string | null
          end_time?: string | null
          google_event_id: string
          id?: string
          start_time?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calendar_id?: string
          created_at?: string | null
          end_time?: string | null
          google_event_id?: string
          id?: string
          start_time?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_sync_logs: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          status: string
          user_calendar_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          status: string
          user_calendar_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string
          user_calendar_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_logs_user_calendar_id_fkey"
            columns: ["user_calendar_id"]
            isOneToOne: false
            referencedRelation: "user_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_knowledge_base: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: number
          importance: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: number
          importance?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: number
          importance?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clinic_users: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_users_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          admin_notes: string | null
          created_at: string | null
          created_by: string
          email: string | null
          emergency_contact: string | null
          id: string
          insurance_accepted: string[] | null
          language: string | null
          logo_url: string | null
          name: string
          payment_methods: string[] | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          simulation_mode: boolean | null
          specialties: string[] | null
          timezone: string | null
          updated_at: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string | null
          created_by: string
          email?: string | null
          emergency_contact?: string | null
          id?: string
          insurance_accepted?: string[] | null
          language?: string | null
          logo_url?: string | null
          name: string
          payment_methods?: string[] | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          simulation_mode?: boolean | null
          specialties?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          emergency_contact?: string | null
          id?: string
          insurance_accepted?: string[] | null
          language?: string | null
          logo_url?: string | null
          name?: string
          payment_methods?: string[] | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          simulation_mode?: boolean | null
          specialties?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          created_by: string
          id: string
          patient_name: string
          patient_phone: string
          status: string
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          patient_name: string
          patient_phone: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          patient_name?: string
          patient_phone?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_logs: {
        Row: {
          conversation_id: string
          created_at: string | null
          frustration_level: number | null
          id: number
          intent: string | null
          phone_number: string | null
          reason: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          frustration_level?: number | null
          id?: number
          intent?: string | null
          phone_number?: string | null
          reason?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          frustration_level?: number | null
          id?: number
          intent?: string | null
          phone_number?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string | null
          scope: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          google_email: string | null
          id: string
          refresh_token: string | null
          scope: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          google_email?: string | null
          id?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          created_by: string
          id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          created_by: string
          id?: string
          sender_type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          sender_type?: string
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
      role_permissions: {
        Row: {
          can_access: boolean | null
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string | null
          id: string
          module_name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          can_access?: boolean | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module_name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          can_access?: boolean | null
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          module_name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_calendars: {
        Row: {
          access_token: string | null
          calendar_color: string | null
          calendar_name: string
          clinic_id: string | null
          created_at: string | null
          expires_at: string | null
          google_calendar_id: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          calendar_color?: string | null
          calendar_name: string
          clinic_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          google_calendar_id: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          calendar_color?: string | null
          calendar_name?: string
          clinic_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          google_calendar_id?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendars_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personalization_profiles: {
        Row: {
          behavior_patterns: Json | null
          created_at: string | null
          id: number
          phone_number: string
          preferences: Json | null
          profile_data: Json
          updated_at: string | null
        }
        Insert: {
          behavior_patterns?: Json | null
          created_at?: string | null
          id?: number
          phone_number: string
          preferences?: Json | null
          profile_data?: Json
          updated_at?: string | null
        }
        Update: {
          behavior_patterns?: Json | null
          created_at?: string | null
          id?: number
          phone_number?: string
          preferences?: Json | null
          profile_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string
          status: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          role?: string
          status?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string
          status?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          created_by: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          created_by: string
          email: string
          id?: string
          name: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          created_by?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          phone_number: string
          qr_code_scanned_at: string | null
          updated_at: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          phone_number: string
          qr_code_scanned_at?: string | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          phone_number?: string
          qr_code_scanned_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_memory: {
        Row: {
          created_at: string | null
          id: number
          memory_data: Json
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          memory_data?: Json
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          memory_data?: Json
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          country_code: string | null
          created_at: string | null
          email: string | null
          formatted_phone_number: string | null
          id: string
          last_message_preview: string | null
          name: string | null
          phone_number: string
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          formatted_phone_number?: string | null
          id?: string
          last_message_preview?: string | null
          name?: string | null
          phone_number: string
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          formatted_phone_number?: string | null
          id?: string
          last_message_preview?: string | null
          name?: string | null
          phone_number?: string
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          timestamp: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          message_type: string
          metadata?: Json | null
          timestamp?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          timestamp?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {

      has_global_clinic_access: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_admin_lify: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      requires_clinic_association: {
        Args: { user_uuid: string }
        Returns: boolean
      }

      search_clinic_knowledge: {
        Args: { query_text: string; limit_count?: number }
        Returns: {
          id: number
          title: string
          content: string
          category: string
          relevance_score: number
        }[]
      }
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
