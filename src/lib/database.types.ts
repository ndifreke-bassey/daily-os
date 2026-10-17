type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        { id: string; display_name: string | null; created_at: string; updated_at: string },
        { id: string; display_name?: string | null },
        { display_name?: string | null; updated_at?: string }
      >;
      categories: Table<
        { id: string; user_id: string; name: string; color: string; created_at: string },
        { id?: string; user_id: string; name: string; color?: string },
        { name?: string; color?: string }
      >;
      tasks: Table<
        {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          description: string;
          due_date: string | null;
          priority: "low" | "medium" | "high";
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          user_id: string;
          category_id?: string | null;
          title: string;
          description?: string;
          due_date?: string | null;
          priority?: "low" | "medium" | "high";
          is_completed?: boolean;
        },
        {
          category_id?: string | null;
          title?: string;
          description?: string;
          due_date?: string | null;
          priority?: "low" | "medium" | "high";
          is_completed?: boolean;
          updated_at?: string;
        }
      >;
      notes: Table<
        { id: string; user_id: string; title: string; content: string; created_at: string; updated_at: string },
        { id?: string; user_id: string; title: string; content?: string },
        { title?: string; content?: string; updated_at?: string }
      >;
      user_preferences: Table<
        { user_id: string; compact_tasks: boolean; date_format: "long" | "short"; updated_at: string },
        { user_id: string; compact_tasks?: boolean; date_format?: "long" | "short" },
        { compact_tasks?: boolean; date_format?: "long" | "short"; updated_at?: string }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];