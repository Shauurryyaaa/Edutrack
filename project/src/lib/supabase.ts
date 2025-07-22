import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the button in the top right.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'teacher' | 'student';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: 'teacher' | 'student';
        };
        Update: {
          full_name?: string;
          role?: 'teacher' | 'student';
        };
      };
      assignments: {
        Row: {
          id: string;
          title: string;
          description: string;
          due_date: string;
          created_by: string;
          created_at: string;
          max_points: number;
        };
        Insert: {
          title: string;
          description: string;
          due_date: string;
          created_by: string;
          max_points?: number;
        };
        Update: {
          title?: string;
          description?: string;
          due_date?: string;
          max_points?: number;
        };
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          content: string;
          file_url?: string;
          submitted_at: string;
          grade?: number;
          feedback?: string;
          status: 'submitted' | 'graded';
        };
        Insert: {
          assignment_id: string;
          student_id: string;
          content: string;
          file_url?: string;
          status?: 'submitted' | 'graded';
        };
        Update: {
          content?: string;
          file_url?: string;
          grade?: number;
          feedback?: string;
          status?: 'submitted' | 'graded';
        };
      };
    };
  };
};