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
          cancellation_token_hash: string | null;
          cancelled_at: string | null;
          created_at: string;
          created_by: string;
          customer_id: string;
          id: string;
          starts_at: string;
          status: string;
        };
        Insert: {
          cancellation_token_hash?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          created_by?: string;
          customer_id: string;
          id?: string;
          starts_at: string;
          status?: string;
        };
        Update: {
          cancellation_token_hash?: string | null;
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
      cancel_customer_appointment: {
        Args: { p_cancellation_token_hash: string };
        Returns: {
          appointment_id: string;
          cancelled_at: string;
          starts_at: string;
          status: string;
        }[];
      };
      create_customer_booking:
        | {
          Args: {
            p_booking_date: string;
            p_booking_time: string;
            p_challenge_id: string;
            p_full_name: string;
          };
          Returns: {
            appointment_id: string;
            customer_name: string;
            starts_at: string;
          }[];
        }
        | {
          Args: {
            p_booking_date: string;
            p_booking_time: string;
            p_cancellation_token_hash: string;
            p_challenge_id: string;
            p_full_name: string;
          };
          Returns: {
            appointment_id: string;
            customer_name: string;
            starts_at: string;
          }[];
        };
      create_owner_booking: {
        Args: {
          p_booking_date: string;
          p_booking_time: string;
          p_full_name: string;
          p_phone: string;
        };
        Returns: {
          appointment_id: string;
          customer_id: string;
          starts_at: string;
        }[];
      };
      is_owner: { Args: never; Returns: boolean };
      list_booked_slots: {
        Args: { p_days?: number; p_from: string };
        Returns: {
          booking_date: string;
          booking_time: string;
        }[];
      };
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
