import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the user's essay test variant ('A' = all 5 required,
 * 'B' = 3 required + 2 optional). Persists to profiles.essay_variant.
 */
export async function getOrAssignEssayVariant(userId: string): Promise<"A" | "B"> {
  const { data: p } = await supabase
    .from("profiles")
    .select("essay_variant")
    .eq("id", userId)
    .maybeSingle();
  if (p?.essay_variant === "A" || p?.essay_variant === "B") return p.essay_variant;

  let bPercent = 50;
  let enabled = true;
  const { data: flag } = await supabase
    .from("feature_flags")
    .select("value")
    .eq("key", "essay_test")
    .maybeSingle();
  if (flag?.value && typeof flag.value === "object") {
    const v = flag.value as { enabled?: boolean; variant_b_percent?: number };
    if (typeof v.enabled === "boolean") enabled = v.enabled;
    if (typeof v.variant_b_percent === "number") bPercent = v.variant_b_percent;
  }

  const variant: "A" | "B" = !enabled
    ? "B"
    : Math.random() * 100 < bPercent
      ? "B"
      : "A";
  await supabase.from("profiles").update({ essay_variant: variant }).eq("id", userId);
  return variant;
}
