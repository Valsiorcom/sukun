import { supabase } from "@/integrations/supabase/client";

export type EventName =
  | "onboarding_step_completed"
  | "profile_complete"
  | "interest_sent"
  | "match_created"
  | "intro_fee_paid"
  | "chat_message_sent"
  | "essay_variant_shown";

export async function track(name: EventName, props: Record<string, unknown> = {}) {
  try {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    if (!uid) return; // RLS requires authenticated user_id
    // fire-and-forget; never block UI on analytics
    void supabase.from("events").insert({
      user_id: uid,
      name,
      props: props as never,
    });
  } catch {
    // swallow
  }
}
