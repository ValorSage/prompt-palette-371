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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_images: {
        Row: {
          created_at: string
          generation_id: string
          height: number | null
          id: string
          is_favorite: boolean
          mime_type: string
          name: string
          project_id: string | null
          root_image_id: string | null
          size_bytes: number | null
          storage_path: string
          user_id: string
          version: number
          width: number | null
        }
        Insert: {
          created_at?: string
          generation_id: string
          height?: number | null
          id?: string
          is_favorite?: boolean
          mime_type?: string
          name?: string
          project_id?: string | null
          root_image_id?: string | null
          size_bytes?: number | null
          storage_path: string
          user_id: string
          version?: number
          width?: number | null
        }
        Update: {
          created_at?: string
          generation_id?: string
          height?: number | null
          id?: string
          is_favorite?: boolean
          mime_type?: string
          name?: string
          project_id?: string | null
          root_image_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
          version?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_references: {
        Row: {
          collection_id: string | null
          created_at: string
          generation_id: string
          id: string
          reference_image_id: string | null
          source: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          generation_id: string
          id?: string
          reference_image_id?: string | null
          source?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          generation_id?: string
          id?: string
          reference_image_id?: string | null
          source?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_references_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "reference_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_references_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_references_reference_image_id_fkey"
            columns: ["reference_image_id"]
            isOneToOne: false
            referencedRelation: "reference_images"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          background: string
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          error: string | null
          id: string
          message_id: string | null
          mode: string
          model: string
          n: number
          output_format: string
          parent_image_id: string | null
          project_id: string | null
          prompt: string
          quality: string
          reference_profile_summary: string | null
          request_hash: string | null
          size: string
          status: string
          user_id: string
        }
        Insert: {
          background?: string
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          message_id?: string | null
          mode?: string
          model?: string
          n?: number
          output_format?: string
          parent_image_id?: string | null
          project_id?: string | null
          prompt: string
          quality?: string
          reference_profile_summary?: string | null
          request_hash?: string | null
          size?: string
          status?: string
          user_id: string
        }
        Update: {
          background?: string
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          message_id?: string | null
          mode?: string
          model?: string
          n?: number
          output_format?: string
          parent_image_id?: string | null
          project_id?: string | null
          prompt?: string
          quality?: string
          reference_profile_summary?: string | null
          request_hash?: string | null
          size?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      image_versions: {
        Row: {
          created_at: string
          id: string
          image_id: string
          label: string | null
          root_image_id: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_id: string
          label?: string | null
          root_image_id: string
          user_id: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          image_id?: string
          label?: string | null
          root_image_id?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "image_versions_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_versions_root_image_id_fkey"
            columns: ["root_image_id"]
            isOneToOne: false
            referencedRelation: "generated_images"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reference_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kind: string
          max_images: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          max_images?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          max_images?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reference_images: {
        Row: {
          collection_id: string
          created_at: string
          height: number | null
          id: string
          mime_type: string
          name: string
          size_bytes: number | null
          storage_path: string
          tags: string[]
          user_id: string
          width: number | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string
          name?: string
          size_bytes?: number | null
          storage_path: string
          tags?: string[]
          user_id: string
          width?: number | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          height?: number | null
          id?: string
          mime_type?: string
          name?: string
          size_bytes?: number | null
          storage_path?: string
          tags?: string[]
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reference_images_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "reference_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_profiles: {
        Row: {
          collection_id: string
          created_at: string
          fingerprint: string
          id: string
          image_count: number
          profile: Json
          summary: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          fingerprint: string
          id?: string
          image_count?: number
          profile?: Json
          summary: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          fingerprint?: string
          id?: string
          image_count?: number
          profile?: Json
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_profiles_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "reference_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          metadata: Json
          units: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          units?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          units?: number
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_analyze_references: boolean
          auto_select_references: boolean
          created_at: string
          default_background: string
          default_model: string
          default_n: number
          default_output_format: string
          default_quality: string
          default_size: string
          gallery_layout: string
          language: string
          reference_limit: number
          sidebar_collapsed: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_analyze_references?: boolean
          auto_select_references?: boolean
          created_at?: string
          default_background?: string
          default_model?: string
          default_n?: number
          default_output_format?: string
          default_quality?: string
          default_size?: string
          gallery_layout?: string
          language?: string
          reference_limit?: number
          sidebar_collapsed?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_analyze_references?: boolean
          auto_select_references?: boolean
          created_at?: string
          default_background?: string
          default_model?: string
          default_n?: number
          default_output_format?: string
          default_quality?: string
          default_size?: string
          gallery_layout?: string
          language?: string
          reference_limit?: number
          sidebar_collapsed?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
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
