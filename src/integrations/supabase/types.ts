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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      metal_prices: {
        Row: {
          buy: number
          id: string
          name_ar: string
          name_en: string
          sell: number
          sort: number
          updated_at: string
        }
        Insert: {
          buy?: number
          id?: string
          name_ar: string
          name_en: string
          sell?: number
          sort?: number
          updated_at?: string
        }
        Update: {
          buy?: number
          id?: string
          name_ar?: string
          name_en?: string
          sell?: number
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          body_ar: string | null
          body_en: string | null
          created_at: string
          excerpt_ar: string | null
          excerpt_en: string | null
          id: string
          image_url: string | null
          kind: string
          published: boolean
          slug: string
          title_ar: string
          title_en: string
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          published?: boolean
          slug: string
          title_ar: string
          title_en: string
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          excerpt_ar?: string | null
          excerpt_en?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          published?: boolean
          slug?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          day: string
          egp: number
          id: string
          usd: number
        }
        Insert: {
          day: string
          egp: number
          id?: string
          usd: number
        }
        Update: {
          day?: string
          egp?: number
          id?: string
          usd?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          image_url: string | null
          name_ar: string
          name_en: string
          price: number | null
          sort: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          name_ar: string
          name_en: string
          price?: number | null
          sort?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          name_ar?: string
          name_en?: string
          price?: number | null
          sort?: number
        }
        Relationships: []
      }
      sections: {
        Row: {
          body_ar: string | null
          body_en: string | null
          image_url: string | null
          key: string
          title_ar: string | null
          title_en: string | null
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          image_url?: string | null
          key: string
          title_ar?: string | null
          title_en?: string | null
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          image_url?: string | null
          key?: string
          title_ar?: string | null
          title_en?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          body_ar: string | null
          body_en: string | null
          id: string
          image_url: string | null
          sort: number
          title_ar: string
          title_en: string
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          id?: string
          image_url?: string | null
          sort?: number
          title_ar: string
          title_en: string
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          id?: string
          image_url?: string | null
          sort?: number
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address_ar: string | null
          address_en: string | null
          app_link: string | null
          email: string | null
          facebook: string | null
          gold_usd: number
          id: number
          instagram: string | null
          logo_url: string | null
          phone: string | null
          popup_button_ar: string | null
          popup_button_en: string | null
          popup_enabled: boolean
          popup_link: string | null
          popup_title_ar: string | null
          popup_title_en: string | null
          silver_usd: number
          site_name_ar: string
          site_name_en: string
          tiktok: string | null
          updated_at: string
          whatsapp_number: string
          years_experience: number
          youtube: string | null
        }
        Insert: {
          address_ar?: string | null
          address_en?: string | null
          app_link?: string | null
          email?: string | null
          facebook?: string | null
          gold_usd?: number
          id?: number
          instagram?: string | null
          logo_url?: string | null
          phone?: string | null
          popup_button_ar?: string | null
          popup_button_en?: string | null
          popup_enabled?: boolean
          popup_link?: string | null
          popup_title_ar?: string | null
          popup_title_en?: string | null
          silver_usd?: number
          site_name_ar?: string
          site_name_en?: string
          tiktok?: string | null
          updated_at?: string
          whatsapp_number?: string
          years_experience?: number
          youtube?: string | null
        }
        Update: {
          address_ar?: string | null
          address_en?: string | null
          app_link?: string | null
          email?: string | null
          facebook?: string | null
          gold_usd?: number
          id?: number
          instagram?: string | null
          logo_url?: string | null
          phone?: string | null
          popup_button_ar?: string | null
          popup_button_en?: string | null
          popup_enabled?: boolean
          popup_link?: string | null
          popup_title_ar?: string | null
          popup_title_en?: string | null
          silver_usd?: number
          site_name_ar?: string
          site_name_en?: string
          tiktok?: string | null
          updated_at?: string
          whatsapp_number?: string
          years_experience?: number
          youtube?: string | null
        }
        Relationships: []
      }
      slides: {
        Row: {
          active: boolean
          body_ar: string | null
          body_en: string | null
          button_ar: string | null
          button_en: string | null
          created_at: string
          id: string
          image_url: string | null
          link: string | null
          sort: number
          title_ar: string
          title_en: string
        }
        Insert: {
          active?: boolean
          body_ar?: string | null
          body_en?: string | null
          button_ar?: string | null
          button_en?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          sort?: number
          title_ar?: string
          title_en?: string
        }
        Update: {
          active?: boolean
          body_ar?: string | null
          body_en?: string | null
          button_ar?: string | null
          button_en?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string | null
          sort?: number
          title_ar?: string
          title_en?: string
        }
        Relationships: []
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
