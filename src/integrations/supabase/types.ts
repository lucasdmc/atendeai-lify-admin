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
      contextualization_data: {
        Row: {
          answer: string | null
          clinic_id: string | null
          created_at: string
          id: string
          knowledge_base: Json | null
          order_number: number
          question: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          knowledge_base?: Json | null
          order_number: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          clinic_id?: string | null
          created_at?: string
          id?: string
          knowledge_base?: Json | null
          order_number?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
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
      whatsapp_conversations: {
        Row: {
          country_code: string | null
          created_at: string
          formatted_phone_number: string | null
          id: string
          last_message_preview: string | null
          name: string | null
          phone_number: string
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          formatted_phone_number?: string | null
          id?: string
          last_message_preview?: string | null
          name?: string | null
          phone_number: string
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          formatted_phone_number?: string | null
          id?: string
          last_message_preview?: string | null
          name?: string | null
          phone_number?: string
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: []
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
      extract_country_code: {
        Args: { phone_number: string }
        Returns: string
      }
      format_phone_number: {
        Args: { phone_number: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "admin" | "suporte_lify" | "atendente"
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
      user_role: ["admin", "suporte_lify", "atendente"],
    },
  },
} as const
