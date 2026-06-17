import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile/$id")({
  component: ProfileDetail,
});

type Detail = {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  city: string | null;
  country: string | null;
  marital_status: string | null;
  primary_photo: string | null;
  essay_1: string | null;
  essay_2: string | null;
  is_chat_opened: boolean;
  already_liked: boolean;
  match_exists: boolean;
};

function ProfileDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (!user) return;
      const [{ data: p }, { data: ph }, { data: es }, { data: liked }, { data: m }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,birth_date,city,country,marital_status").eq("id", id).maybeSingle(),
        supabase.from("photos").select("photo_url,is_primary,sort_order").eq("user_id", id).order("is_primary", { ascending: false }).order("sort_order").limit(1),
        supabase.from("essays").select("essay_1,essay_2").eq("user_id", id).maybeSingle(),
        supabase.from("likes").select("from_user").eq("from_user", user.id).eq("to_user", id).maybeSingle(),
        supabase.from("matches").select("status").or(`and(user_low.eq.${user.id < id ? user.id : id},user_high.eq.${user.id < id ? id : user.id})`).maybeSingle(),
      ]);
      if (!p) { setLoading(false); return; }
      setD({
        ...(p as any),
        primary_photo: ph?.[0]?.photo_url ?? null,
        essay_1: es?.essay_1 ?? null,
        essay_2: es?.essay_2 ?? null,
        is_chat_opened: m?.status === "chat_opened",
        already_liked: !!liked,
        match_exists: !!m,
      });
      setLoading(false);
    })();
  }, [id, user?.id]);

  async function act(action: "passed" | "liked") {
    if (!user) return;
    await supabase.rpc("send_interest_v2", { target: id, action });
    nav({ to: "/dashboard" });
  }

  async function block() {
    if (!user) return;
    if (!confirm("Block this member? They won't be able to see your profile or contact you. This cannot be undone.")) return;
    await supabase.from("blocks").insert({ from_user: user.id, to_user: id });
    nav({ to: "/dashboard" });
  }

  if (loading) return <AppShell><div className="h-64 rounded-2xl bg-muted animate-pulse" /></AppShell>;
  if (!d) return <AppShell><p className="text-muted-foreground">Profile not found.</p></AppShell>;

  const age = d.birth_date ? Math.floor((Date.now() - new Date(d.birth_date).getTime()) / 31557600000) : null;
  const blur = !d.is_chat_opened;

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-4">
        <Link to="/dashboard" className="text-sm text-muted-foreground">← Back</Link>
        <button onClick={block} className="text-xs text-muted-foreground hover:text-destructive">Block</button>
      </div>
      <div className="rounded-2xl overflow-hidden border border-border bg-white">
        <div className="aspect-square bg-muted">
          {d.primary_photo && <img src={d.primary_photo} alt="" className="w-full h-full object-cover" style={blur ? { filter: "blur(18px)" } : undefined} />}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h1 className="font-display text-2xl">{d.full_name?.split(" ")[0]} <span className="text-muted-foreground font-sans">{age}</span></h1>
            <p className="text-sm text-muted-foreground">{d.city}, {d.country}</p>
          </div>
          {d.essay_1 && (
            <div>
              <p className="font-display text-sm text-muted-foreground">About</p>
              <p className="mt-1 text-foreground leading-relaxed">{d.essay_1}</p>
            </div>
          )}
          {d.essay_2 && (
            <div>
              <p className="font-display text-sm text-muted-foreground">My experience</p>
              <p className="mt-1 text-foreground leading-relaxed">{d.essay_2}</p>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-20 md:bottom-4 mt-6">
        {d.match_exists ? (
          <Link to="/matches"><Button className="w-full h-12">Go to Match →</Button></Link>
        ) : d.already_liked ? (
          <Button className="w-full h-12" disabled variant="outline">Interest sent ✓</Button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12" onClick={() => act("passed")}>Pass</Button>
            <Button className="h-12" onClick={() => act("liked")}>I'm interested ♥</Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
