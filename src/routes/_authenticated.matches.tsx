import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({ meta: [{ title: "Your Matches — MITAN" }] }),
  component: MatchesPage,
});

type MatchRow = {
  user_low: string;
  user_high: string;
  status: string;
  created_at: string;
  other: {
    id: string;
    full_name: string | null;
    birth_date: string | null;
    city: string | null;
    primary_photo: string | null;
  };
};

function MatchesPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data: m } = await supabase
      .from("matches").select("user_low,user_high,status,created_at")
      .or(`user_low.eq.${user.id},user_high.eq.${user.id}`)
      .order("created_at", { ascending: false });
    const matches = (m ?? []) as Array<{ user_low: string; user_high: string; status: string; created_at: string }>;
    const otherIds = matches.map((r) => (r.user_low === user.id ? r.user_high : r.user_low));
    if (otherIds.length === 0) { setRows([]); setLoading(false); return; }
    const [{ data: profiles }, { data: photos }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,birth_date,city").in("id", otherIds),
      supabase.from("photos").select("user_id,photo_url,is_primary,sort_order").in("user_id", otherIds),
    ]);
    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const photoMap = new Map<string, string>();
    for (const p of (photos ?? []) as any[]) {
      if (!photoMap.has(p.user_id) || p.is_primary) photoMap.set(p.user_id, p.photo_url);
    }
    setRows(matches.map((r) => {
      const oid = r.user_low === user.id ? r.user_high : r.user_low;
      const p = profMap.get(oid);
      return { ...r, other: { id: oid, full_name: p?.full_name ?? null, birth_date: p?.birth_date ?? null, city: p?.city ?? null, primary_photo: photoMap.get(oid) ?? null } };
    }));
    setActiveCount(matches.filter((r) => r.status === "chat_opened").length);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  async function open(r: MatchRow) {
    if (!user) return;
    if (activeCount >= 5) return;
    setErr(null);
    const { error } = await supabase.rpc("open_chat", { match_id_low: r.user_low, match_id_high: r.user_high });
    if (error) { setErr(error.message.includes("max_chats") ? "You have 5 active conversations." : error.message); return; }
    nav({ to: "/chat/$matchId", params: { matchId: `${r.user_low}_${r.user_high}` } });
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl mb-1">Your Matches</h1>
      <p className="text-sm text-muted-foreground mb-6">When you and another member are both interested, they appear here.</p>
      {activeCount >= 5 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3 mb-4">
          You have 5 active conversations. Close one to open a new one.
        </div>
      )}
      {err && <p className="text-sm text-destructive mb-3">{err}</p>}

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>}

      {!loading && rows.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Heart className="h-10 w-10 text-primary mx-auto" />
          <h2 className="font-display text-xl">No matches yet.</h2>
          <p className="text-sm text-muted-foreground">When you and another member are both interested, you'll appear here.</p>
          <Link to="/dashboard"><Button>Discover profiles</Button></Link>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((r) => {
          const age = r.other.birth_date ? Math.floor((Date.now() - new Date(r.other.birth_date).getTime()) / 31557600000) : null;
          const ended = r.status === "expired" || r.status === "completed";
          return (
            <div key={r.user_low + r.user_high} className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-white ${ended ? "opacity-60" : ""}`}>
              <div className="h-14 w-14 rounded-full bg-muted overflow-hidden flex-shrink-0">
                {r.other.primary_photo && <img src={r.other.primary_photo} alt="" className="h-full w-full object-cover" style={r.status !== "chat_opened" ? { filter: "blur(12px)" } : undefined} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{r.other.full_name?.split(" ")[0]} <span className="text-muted-foreground font-normal">{age}</span></p>
                <p className="text-xs text-muted-foreground">{r.other.city}</p>
              </div>
              {r.status === "pending" && (
                <Button size="sm" disabled={activeCount >= 5} onClick={() => open(r)}>Start Conversation →</Button>
              )}
              {r.status === "chat_opened" && (
                <Link to="/chat/$matchId" params={{ matchId: `${r.user_low}_${r.user_high}` }}><Button size="sm" variant="outline">Continue →</Button></Link>
              )}
              {ended && <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Ended</span>}
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
