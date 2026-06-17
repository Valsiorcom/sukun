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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          meta: Json
          target_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          meta?: Json
          target_id?: string | null
        }
        Relationships: []
      }
      blocks: {
        Row: {
          created_at: string
          from_user: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          to_user?: string
        }
        Relationships: []
      }
      daily_discovery_log: {
        Row: {
          action: string
          created_at: string
          id: string
          seen_user: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          seen_user: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          seen_user?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_views: {
        Row: {
          profile_ids: string[]
          user_id: string
          view_date: string
        }
        Insert: {
          profile_ids?: string[]
          user_id: string
          view_date: string
        }
        Update: {
          profile_ids?: string[]
          user_id?: string
          view_date?: string
        }
        Relationships: []
      }
      email_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      essays: {
        Row: {
          essay_1: string | null
          essay_2: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          essay_1?: string | null
          essay_2?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          essay_1?: string | null
          essay_2?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          id: string
          name: string
          props: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          props?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          props?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      kyc_requests: {
        Row: {
          created_at: string
          doc_type: string
          id: string
          id_document_url: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          id?: string
          id_document_url: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          id?: string
          id_document_url?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          from_user: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          to_user?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          chat_opened_at: string | null
          created_at: string
          intro_fee_paid: boolean
          intro_fee_paid_by: string | null
          opened_at: string | null
          opened_by: string | null
          status: string
          user_high: string
          user_low: string
        }
        Insert: {
          chat_opened_at?: string | null
          created_at?: string
          intro_fee_paid?: boolean
          intro_fee_paid_by?: string | null
          opened_at?: string | null
          opened_by?: string | null
          status?: string
          user_high: string
          user_low: string
        }
        Update: {
          chat_opened_at?: string | null
          created_at?: string
          intro_fee_paid?: boolean
          intro_fee_paid_by?: string | null
          opened_at?: string | null
          opened_by?: string | null
          status?: string
          user_high?: string
          user_low?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          match_high: string
          match_low: string
          read_at: string | null
          sender: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          match_high: string
          match_low: string
          read_at?: string | null
          sender: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          match_high?: string
          match_low?: string
          read_at?: string | null
          sender?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_idr: number
          created_at: string
          id: string
          kind: string
          meta: Json
          ref: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_idr: number
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          ref?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_idr?: number
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          ref?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          photo_url: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          photo_url: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          photo_url?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      preferences: {
        Row: {
          cities: string[]
          max_age: number
          min_age: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cities?: string[]
          max_age?: number
          min_age?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cities?: string[]
          max_age?: number
          min_age?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          admin_notes: string | null
          age: number | null
          birth_date: string | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string | null
          education: string | null
          email: string | null
          essay_conflict: string | null
          essay_expectations: string | null
          essay_taaruf: string | null
          essay_values: string | null
          essay_variant: string | null
          essay_vision: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_banned: boolean
          is_verified: boolean
          kyc_rejection_reason: string | null
          kyc_status: string
          kyc_submitted_at: string | null
          last_completed_step: number
          marital_status: string | null
          notify_interest: boolean
          notify_match: boolean
          notify_message: boolean
          occupation: string | null
          onboarding_step: number
          phone: string | null
          phone_verified: boolean
          photos: string[]
          profile_complete: boolean
          profile_visible: boolean
          suspended_until: string | null
          updated_at: string
          visibility_mode: string
        }
        Insert: {
          account_status?: string
          admin_notes?: string | null
          age?: number | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          education?: string | null
          email?: string | null
          essay_conflict?: string | null
          essay_expectations?: string | null
          essay_taaruf?: string | null
          essay_values?: string | null
          essay_variant?: string | null
          essay_vision?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_banned?: boolean
          is_verified?: boolean
          kyc_rejection_reason?: string | null
          kyc_status?: string
          kyc_submitted_at?: string | null
          last_completed_step?: number
          marital_status?: string | null
          notify_interest?: boolean
          notify_match?: boolean
          notify_message?: boolean
          occupation?: string | null
          onboarding_step?: number
          phone?: string | null
          phone_verified?: boolean
          photos?: string[]
          profile_complete?: boolean
          profile_visible?: boolean
          suspended_until?: string | null
          updated_at?: string
          visibility_mode?: string
        }
        Update: {
          account_status?: string
          admin_notes?: string | null
          age?: number | null
          birth_date?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          education?: string | null
          email?: string | null
          essay_conflict?: string | null
          essay_expectations?: string | null
          essay_taaruf?: string | null
          essay_values?: string | null
          essay_variant?: string | null
          essay_vision?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_banned?: boolean
          is_verified?: boolean
          kyc_rejection_reason?: string | null
          kyc_status?: string
          kyc_submitted_at?: string | null
          last_completed_step?: number
          marital_status?: string | null
          notify_interest?: boolean
          notify_match?: boolean
          notify_message?: boolean
          occupation?: string | null
          onboarding_step?: number
          phone?: string | null
          phone_verified?: boolean
          photos?: string[]
          profile_complete?: boolean
          profile_visible?: boolean
          suspended_until?: string | null
          updated_at?: string
          visibility_mode?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          occurred_at: string
          user_id: string
        }
        Insert: {
          action: string
          occurred_at?: string
          user_id: string
        }
        Update: {
          action?: string
          occurred_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target?: string
        }
        Relationships: []
      }
      skips: {
        Row: {
          created_at: string
          from_user: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          to_user?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          plan: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          plan: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          plan?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      activate_subscription: {
        Args: { plan_code: string }
        Returns: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          plan: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_approve_kyc: { Args: { req_id: string }; Returns: undefined }
      admin_decide_kyc: {
        Args: { decision: string; reason?: string; target: string }
        Returns: undefined
      }
      admin_decide_report: {
        Args: { action: string; note?: string; report_id: string }
        Returns: undefined
      }
      admin_kpi_overview: { Args: never; Returns: Json }
      admin_kyc_queue: {
        Args: never
        Returns: {
          display_name: string
          email: string
          id: string
          kyc_submitted_at: string
        }[]
      }
      admin_recent_payments: {
        Args: never
        Returns: {
          amount_idr: number
          created_at: string
          id: string
          kind: string
          ref: string
          status: string
          user_email: string
          user_id: string
        }[]
      }
      admin_refund_payment: { Args: { payment_id: string }; Returns: undefined }
      admin_reject_kyc: {
        Args: { reason: string; req_id: string }
        Returns: undefined
      }
      admin_reports_queue: {
        Args: never
        Returns: {
          created_at: string
          details: string
          hours_open: number
          id: string
          reason: string
          reporter: string
          target: string
          target_email: string
          target_name: string
        }[]
      }
      admin_search_users: {
        Args: { q: string }
        Returns: {
          account_status: string
          created_at: string
          display_name: string
          email: string
          gender: string
          id: string
          kyc_status: string
          phone: string
        }[]
      }
      admin_signed_url: {
        Args: { bucket: string; path: string }
        Returns: string
      }
      admin_user_action: {
        Args: { action: string; note?: string; target: string }
        Returns: undefined
      }
      cancel_subscription: {
        Args: never
        Returns: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          plan: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_and_record_rate_limit: {
        Args: { _action: string; _max: number; _window_seconds: number }
        Returns: undefined
      }
      get_discovery_feed: {
        Args: never
        Returns: {
          age: number
          bio_summary: string
          city: string
          display_name: string
          id: string
          occupation: string
        }[]
      }
      get_discovery_status: {
        Args: never
        Returns: {
          daily_cap: number
          viewed_today: number
        }[]
      }
      get_discovery_v2: {
        Args: never
        Returns: {
          birth_date: string
          city: string
          country: string
          full_name: string
          gender: string
          id: string
          marital_status: string
          primary_photo: string
        }[]
      }
      get_likers: {
        Args: never
        Returns: {
          age: number
          city: string
          display_name: string
          liked_at: string
          occupation: string
          user_id: string
        }[]
      }
      get_my_matches: {
        Args: never
        Returns: {
          age: number
          chat_opened_at: string
          city: string
          display_name: string
          essay_summary: string
          intro_fee_paid: boolean
          matched_at: string
          peer_id: string
          user_high: string
          user_low: string
        }[]
      }
      get_profile_detail: {
        Args: { target: string }
        Returns: {
          age: number
          city: string
          display_name: string
          education: string
          essay_conflict: string
          essay_values: string
          essay_vision: string
          id: string
          is_matched: boolean
          occupation: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      mark_chat_read: { Args: { peer: string }; Returns: undefined }
      next_wib_midnight: { Args: never; Returns: string }
      open_chat: {
        Args: { match_id_high: string; match_id_low: string }
        Returns: {
          chat_opened_at: string | null
          created_at: string
          intro_fee_paid: boolean
          intro_fee_paid_by: string | null
          opened_at: string | null
          opened_by: string | null
          status: string
          user_high: string
          user_low: string
        }
        SetofOptions: {
          from: "*"
          to: "matches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pay_intro_fee: {
        Args: { peer: string }
        Returns: {
          chat_opened_at: string
          intro_fee_paid: boolean
          intro_fee_paid_by: string
          user_high: string
          user_low: string
        }[]
      }
      send_interest: {
        Args: { target: string }
        Returns: {
          matched: boolean
        }[]
      }
      send_interest_v2: {
        Args: { action: string; target: string }
        Returns: {
          matched: boolean
        }[]
      }
      send_message: {
        Args: { msg: string; peer: string }
        Returns: {
          body: string
          created_at: string
          id: string
          read_at: string
          sender: string
        }[]
      }
      skip_profile: { Args: { target: string }; Returns: undefined }
      wib_today: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
