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
      users: {
        Row: {
          id: string;
          email: string | null;
          created_at?: string;
          // outros campos se necessário
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      },
      checklist_items: {
        Row: {
          checklist_id: string
          completed: boolean
          created_at: string
          id: string
          text: string
        }
        Insert: {
          checklist_id: string
          completed?: boolean
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          checklist_id?: string
          completed?: boolean
          created_at?: string
          id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_complete: boolean
          name: string
          point_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_complete?: boolean
          name: string
          point_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_complete?: boolean
          name?: string
          point_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "points"
            referencedColumns: ["id"]
          },
        ]
      }
      points: {
        Row: {
          address: string
          created_at: string
          description: string | null
          google_maps_url: string | null
          id: string
          image_url: string | null
          name: string
          opening_hours: string | null
          planned_visit_date: string | null
          type: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          image_url?: string | null
          name: string
          opening_hours?: string | null
          planned_visit_date?: string | null
          type: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          image_url?: string | null
          name?: string
          opening_hours?: string | null
          planned_visit_date?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          checklist_id: string | null
          created_at: string
          currency: string
          id: string
          image_url: string | null
          name: string
          point_id: string | null
          price: number
          purchased: boolean
          user_id: string
        }
        Insert: {
          checklist_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          image_url?: string | null
          name: string
          point_id?: string | null
          price?: number
          purchased?: boolean
          user_id: string
        }
        Update: {
          checklist_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          image_url?: string | null
          name?: string
          point_id?: string | null
          price?: number
          purchased?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "points"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_points: {
        Row: {
          id: string;
          point_id: string;
          user_id: string; // destinatário
          sender_id: string; // remetente
          created_at: string;
        }
        Insert: {
          id?: string;
          point_id: string;
          user_id: string;
          sender_id: string;
          created_at?: string;
        }
        Update: {
          id?: string;
          point_id?: string;
          user_id?: string;
          sender_id?: string;
          created_at?: string;
        }
        Relationships: [
          {
            foreignKeyName: "shared_points_point_id_fkey",
            columns: ["point_id"],
            isOneToOne: false,
            referencedRelation: "points",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_points_user_id_fkey",
            columns: ["user_id"],
            isOneToOne: false,
            referencedRelation: "users",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_points_sender_id_fkey",
            columns: ["sender_id"],
            isOneToOne: false,
            referencedRelation: "users",
            referencedColumns: ["id"]
          }
        ]
      },
      user_budgets: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
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
    Enums: {},
  },
} as const
