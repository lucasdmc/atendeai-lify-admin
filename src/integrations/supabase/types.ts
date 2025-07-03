export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          name: string;
          role: string;
          status: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          name: string;
          role: string;
          status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          name?: string;
          role?: string;
          status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      user_role: 'admin_lify' | 'admin' | 'user' | 'agent';
    };
  };
};
