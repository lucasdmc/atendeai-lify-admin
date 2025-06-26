export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_contexts: {
        Row: {
          agent_id: string
          category: Database["public"]["Enums"]["context_category"]
          content: string
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          category: Database["public"]["Enums"]["context_category"]
          content: string
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          category?: Database["public"]["Enums"]["context_category"]
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_contexts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_phone_associations: {
        Row: {
          agent_id: string
          clinic_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          clinic_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          clinic_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_phone_associations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_phone_associations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          clinic_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          personality: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          personality?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          personality?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          calendar_id: string
          created_at: string
          description: string | null
          end_time: string
          google_event_id: string
          id: string
          location: string | null
          start_time: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: Json | null
          calendar_id: string
          created_at?: string
          description?: string | null
          end_time: string
          google_event_id: string
          id?: string
          location?: string | null
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: Json | null
          calendar_id?: string
          created_at?: string
          description?: string | null
          end_time?: string
          google_event_id?: string
          id?: string
          location?: string | null
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clinic_availability: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          slot_duration_minutes: number
          start_time: string
        }
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          slot_duration_minutes?: number
          start_time: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          slot_duration_minutes?: number
          start_time?: string
        }
        Relationships: []
      }
      clinic_availability_exceptions: {
        Row: {
          created_at: string
          custom_end_time: string | null
          custom_start_time: string | null
          exception_date: string
          id: string
          is_closed: boolean
          reason: string | null
        }
        Insert: {
          created_at?: string
          custom_end_time?: string | null
          custom_start_time?: string | null
          exception_date: string
          id?: string
          is_closed?: boolean
          reason?: string | null
        }
        Update: {
          created_at?: string
          custom_end_time?: string | null
          custom_start_time?: string | null
          exception_date?: string
          id?: string
          is_closed?: boolean
          reason?: string | null
        }
        Relationships: []
      }
      clinic_knowledge_base: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          is_active: boolean
          knowledge_data: Json
          updated_at: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          knowledge_data?: Json
          updated_at?: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          knowledge_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      clinic_users: {
        Row: {
          clinic_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
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
          city: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contextualization_data: {
        Row: {
          agent_id: string | null
          answer: string | null
          category: Database["public"]["Enums"]["context_category"] | null
          clinic_id: string | null
          created_at: string
          id: string
          knowledge_base: Json | null
          order_number: number
          question: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          answer?: string | null
          category?: Database["public"]["Enums"]["context_category"] | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          knowledge_base?: Json | null
          order_number: number
          question: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          answer?: string | null
          category?: Database["public"]["Enums"]["context_category"] | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          knowledge_base?: Json | null
          order_number?: number
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contextualization_data_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_metrics: {
        Row: {
          created_at: string
          id: string
          metric_date: string
          metric_name: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric_date?: string
          metric_name: string
          metric_value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric_date?: string
          metric_name?: string
          metric_value?: number
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          agent_id: string
          created_at: string | null
          extracted_content: string | null
          file_size: number | null
          file_type: string
          filename: string
          id: string
          processed_at: string | null
          processing_status: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          extracted_content?: string | null
          file_size?: number | null
          file_type: string
          filename: string
          id?: string
          processed_at?: string | null
          processing_status?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          extracted_content?: string | null
          file_size?: number | null
          file_type?: string
          filename?: string
          id?: string
          processed_at?: string | null
          processing_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string | null
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_access: boolean
          created_at: string | null
          id: string
          module_name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          can_access?: boolean
          created_at?: string | null
          id?: string
          module_name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          can_access?: boolean
          created_at?: string | null
          id?: string
          module_name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_name: string
          setting_type: string | null
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name?: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_access: boolean
          created_at: string
          id: string
          module_name: string
          user_id: string
        }
        Insert: {
          can_access?: boolean
          created_at?: string
          id?: string
          module_name: string
          user_id: string
        }
        Update: {
          can_access?: boolean
          created_at?: string
          id?: string
          module_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          status: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_booking_sessions: {
        Row: {
          conversation_id: string
          created_at: string
          customer_email: string | null
          customer_name: string | null
          expires_at: string
          id: string
          phone_number: string
          selected_date: string | null
          selected_service: string | null
          selected_time: string | null
          session_data: Json | null
          session_state: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          expires_at?: string
          id?: string
          phone_number: string
          selected_date?: string | null
          selected_service?: string | null
          selected_time?: string | null
          session_data?: Json | null
          session_state?: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          expires_at?: string
          id?: string
          phone_number?: string
          selected_date?: string | null
          selected_service?: string | null
          selected_time?: string | null
          session_data?: Json | null
          session_state?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversation_memory: {
        Row: {
          created_at: string
          id: string
          memory_data: Json
          phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_data?: Json
          phone_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_data?: Json
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          agent_id: string | null
          clinic_id: string | null
          consecutive_same_responses: number | null
          country_code: string | null
          created_at: string
          escalated_at: string | null
          escalated_to_human: boolean | null
          escalation_reason: string | null
          formatted_phone_number: string | null
          id: string
          last_ai_response: string | null
          last_message_preview: string | null
          loop_counter: number | null
          name: string | null
          phone_number: string
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          clinic_id?: string | null
          consecutive_same_responses?: number | null
          country_code?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_to_human?: boolean | null
          escalation_reason?: string | null
          formatted_phone_number?: string | null
          id?: string
          last_ai_response?: string | null
          last_message_preview?: string | null
          loop_counter?: number | null
          name?: string | null
          phone_number: string
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          clinic_id?: string | null
          consecutive_same_responses?: number | null
          country_code?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_to_human?: boolean | null
          escalation_reason?: string | null
          formatted_phone_number?: string | null
          id?: string
          last_ai_response?: string | null
          last_message_preview?: string | null
          loop_counter?: number | null
          name?: string | null
          phone_number?: string
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_loop_events: {
        Row: {
          ai_response: string | null
          conversation_id: string
          created_at: string
          event_type: string
          id: string
          loop_count: number | null
          message_content: string | null
        }
        Insert: {
          ai_response?: string | null
          conversation_id: string
          created_at?: string
          event_type: string
          id?: string
          loop_count?: number | null
          message_content?: string | null
        }
        Update: {
          ai_response?: string | null
          conversation_id?: string
          created_at?: string
          event_type?: string
          id?: string
          loop_count?: number | null
          message_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_loop_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          timestamp: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type: string
          timestamp?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          timestamp?: string
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
      clean_expired_booking_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      extract_country_code: {
        Args: { phone_number: string }
        Returns: string
      }
      format_phone_number: {
        Args: { phone_number: string }
        Returns: string
      }
      get_user_clinics: {
        Args: { user_id: string }
        Returns: {
          clinic_id: string
          clinic_name: string
          user_role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin_lify: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_lify_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      context_category:
        | "informacoes_basicas"
        | "profissionais"
        | "procedimentos_especialidades"
        | "regras_politicas_clinica"
        | "regras_politicas_procedimentos"
      user_role:
        | "admin"
        | "suporte_lify"
        | "atendente"
        | "admin_lify"
        | "gestor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      context_category: [
        "informacoes_basicas",
        "profissionais",
        "procedimentos_especialidades",
        "regras_politicas_clinica",
        "regras_politicas_procedimentos",
      ],
      user_role: ["admin", "suporte_lify", "atendente", "admin_lify", "gestor"],
    },
  },
} as const
