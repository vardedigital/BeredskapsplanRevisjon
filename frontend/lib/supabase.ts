import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Browser client for SSR
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Helper function to get client (for future use)
export function getSupabaseClient() {
  return supabase
}

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          municipality_name: string
          logo_url: string | null
          contact_email: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          municipality_name: string
          logo_url?: string | null
          contact_email?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          municipality_name?: string
          logo_url?: string | null
          contact_email?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          full_name: string | null
          role: 'beredskapskoordinator' | 'beredskapsradgiver' | 'admin' | 'viewer'
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          full_name?: string | null
          role?: 'beredskapskoordinator' | 'beredskapsradgiver' | 'admin' | 'viewer'
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          full_name?: string | null
          role?: 'beredskapskoordinator' | 'beredskapsradgiver' | 'admin' | 'viewer'
          created_at?: string
          last_login?: string | null
        }
      }
      revision_sessions: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          session_id: string
          language: 'bokmal' | 'nynorsk'
          nynorsk_preferences: any
          custom_instructions: string | null
          compliance_version: string | null
          compliance_sources_used: any
          compliance_score: number | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          session_id: string
          language?: 'bokmal' | 'nynorsk'
          nynorsk_preferences?: any
          custom_instructions?: string | null
          compliance_version?: string | null
          compliance_sources_used?: any
          compliance_score?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          session_id?: string
          language?: 'bokmal' | 'nynorsk'
          nynorsk_preferences?: any
          custom_instructions?: string | null
          compliance_version?: string | null
          compliance_sources_used?: any
          compliance_score?: number | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      temp_documents: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          session_id: string
          document_type: 'ros' | 'plan_administrativ' | 'plan_operativ' | 'plan_integrert'
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          extracted_text: string | null
          uploaded_at: string
          expires_at: string
          is_processed: boolean
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          session_id: string
          document_type: 'ros' | 'plan_administrativ' | 'plan_operativ' | 'plan_integrert'
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          extracted_text?: string | null
          uploaded_at?: string
          expires_at: string
          is_processed?: boolean
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          session_id?: string
          document_type?: 'ros' | 'plan_administrativ' | 'plan_operativ' | 'plan_integrert'
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          extracted_text?: string | null
          uploaded_at?: string
          expires_at?: string
          is_processed?: boolean
        }
      }
      revision_results: {
        Row: {
          id: string
          session_id: string
          result_type: 'updated_plan' | 'change_log' | 'exercise_plan' | 'supervision_checklist' | 'supervision_report'
          content: string
          content_json: any
          file_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          result_type: 'updated_plan' | 'change_log' | 'exercise_plan' | 'supervision_checklist' | 'supervision_report'
          content: string
          content_json?: any
          file_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          result_type?: 'updated_plan' | 'change_log' | 'exercise_plan' | 'supervision_checklist' | 'supervision_report'
          content?: string
          content_json?: any
          file_path?: string | null
          created_at?: string
        }
      }
      revision_changes: {
        Row: {
          id: string
          session_id: string
          section: string
          action: 'delete' | 'modify' | 'add'
          old_text: string | null
          new_text: string
          source: string
          priority: 'MUST' | 'SHOULD' | 'COULD'
          chapter_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          section: string
          action: 'delete' | 'modify' | 'add'
          old_text?: string | null
          new_text: string
          source: string
          priority: 'MUST' | 'SHOULD' | 'COULD'
          chapter_reference?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          section?: string
          action?: 'delete' | 'modify' | 'add'
          old_text?: string | null
          new_text?: string
          source?: string
          priority?: 'MUST' | 'SHOULD' | 'COULD'
          chapter_reference?: string | null
          created_at?: string
        }
      }
      exercise_plans: {
        Row: {
          id: string
          session_id: string
          exercise_name: string
          scenario: string
          main_goal: string
          suggested_frequency: string | null
          responsible_role: string | null
          evaluation_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_name: string
          scenario: string
          main_goal: string
          suggested_frequency?: string | null
          responsible_role?: string | null
          evaluation_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_name?: string
          scenario?: string
          main_goal?: string
          suggested_frequency?: string | null
          responsible_role?: string | null
          evaluation_required?: boolean
          created_at?: string
        }
      }
      supervision_checklists: {
        Row: {
          id: string
          session_id: string
          requirement_area: string
          source: string
          requirement_text: string
          ai_assessment: 'covered' | 'partially_covered' | 'not_covered'
          chapter_reference: string | null
          manual_check: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          requirement_area: string
          source: string
          requirement_text: string
          ai_assessment: 'covered' | 'partially_covered' | 'not_covered'
          chapter_reference?: string | null
          manual_check?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          requirement_area?: string
          source?: string
          requirement_text?: string
          ai_assessment?: 'covered' | 'partially_covered' | 'not_covered'
          chapter_reference?: string | null
          manual_check?: boolean
          created_at?: string
        }
      }
    }
  }
}