export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          cancelled_at: string | null;
          created_at: string;
          created_by: string;
          customer_id: string;
          id: string;
          starts_at: string;
          status: string;
        };
        Insert: {
          cancelled_at?: string | null;
          created_at?: string;
          created_by?: string;
          customer_id: string;
          id?: string;
          starts_at: string;
          status?: string;
        };
        Update: {
          cancelled_at?: string | null;
          created_at?: string;
          created_by?: string;
          customer_id?: string;
          id?: string;
          starts_at?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          is_blocked: boolean;
          phone_e164: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id?: string;
          is_blocked?: boolean;
          phone_e164: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          is_blocked?: boolean;
          phone_e164?: string;
        };
        Relationships: [];
      };
      otp_challenges: {
        Row: {
          attempt_count: number;
          code_hash: string;
          consumed_at: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          phone_e164: string;
          purpose: string;
          verified_at: string | null;
        };
        Insert: {
          attempt_count?: number;
          code_hash: string;
          consumed_at?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          phone_e164: string;
          purpose?: string;
          verified_at?: string | null;
        };
        Update: {
          attempt_count?: number;
          code_hash?: string;
          consumed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          phone_e164?: string;
          purpose?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_owner: { Args: never; Returns: boolean };
      mark_otp_verified: {
        Args: { p_challenge_id: string };
        Returns: string;
      };
      record_otp_failure: {
        Args: { p_challenge_id: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
