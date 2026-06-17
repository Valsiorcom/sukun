import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Permanently delete the current user account.
 * Removes auth.users row; profile cascades via FKs / handle_new_user trigger separation.
 * Profile and related data are removed best-effort.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Best-effort: clean up user content first (RLS bypassed)
    await supabaseAdmin.from("photos").delete().eq("user_id", userId);
    await supabaseAdmin.from("kyc_requests").delete().eq("user_id", userId);
    await supabaseAdmin.from("essays").delete().eq("user_id", userId);
    await supabaseAdmin.from("preferences").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
