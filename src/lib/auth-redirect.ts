import { supabase } from "@/integrations/supabase/client";

export type ProfileLike = {
  onboarding_step: number | null;
  is_verified: boolean | null;
  is_banned: boolean | null;
  kyc_status: string | null;
};

export function computeRedirect(profile: ProfileLike | null): string {
  if (!profile) return "/onboarding/step-1";
  if (profile.is_banned) return "/banned";
  const step = profile.onboarding_step ?? 0;
  if (step < 4) return `/onboarding/step-${Math.max(1, step + 1)}`;
  // step >= 4 means KYC submitted
  if (!profile.is_verified) return "/waiting";
  return "/dashboard";
}

export async function getPostAuthRoute(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_step, is_verified, is_banned, kyc_status")
    .eq("id", userId)
    .maybeSingle();
  return computeRedirect((data as ProfileLike) ?? null);
}

export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already"))
    return "This email is already registered. Please sign in instead.";
  if (m.includes("password") && (m.includes("short") || m.includes("at least") || m.includes("8 characters") || m.includes("6 characters")))
    return "Password must be at least 8 characters.";
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "Email or password is incorrect.";
  if (m.includes("email not confirmed"))
    return "Please confirm your email first. Check your inbox.";
  if (m.includes("invalid email")) return "Invalid email address.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please try again later.";
  if (m.includes("network") || m.includes("failed to fetch")) return "Network error. Check your connection.";
  return "Something went wrong. Please try again.";
}
