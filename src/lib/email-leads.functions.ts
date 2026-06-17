import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  email: z.string().email().max(254),
  source: z.string().min(1).max(64).default("manifesto"),
});

export const subscribeEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("email_leads")
      .insert({ email: data.email.toLowerCase(), source: data.source });
    // Treat unique-violation as success (idempotent subscribe)
    if (error && error.code !== "23505") {
      throw new Error("Tidak bisa menyimpan email. Coba lagi nanti.");
    }
    return { ok: true } as const;
  });
