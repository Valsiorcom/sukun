import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, X, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Discover — MITAN" }] }),
  component: Dashboard,
});

type Card = {
  id: string;
  full_name: string | null;
  birth_date: string | null;
  city: string | null;
  country: string | null;
  marital_status: string | null;
  gender: string | null;
  primary_photo: string | null;
};

function ageOf(d?: string | null) {
  if (!d) return null;
  return Math.floor((Date.now() - new Date(d).getTime()) / 31557600000);
}

function maritalBadge(s: string | null) {
  if (s === "never_married") return { label: "Never Married", cls: "bg-muted text-foreground" };
  if (s === "divorced") return { label: "Divorced", cls: "bg-amber-100 text-amber-900" };
  if (s === "widowed") return { label: "Widowed", cls: "bg-violet-100 text-violet-900" };
  return null;
}

function Dashboard() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matched, setMatched] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.rpc("get_discovery_v2");
    setCards((data ?? []) as Card[]);
    setIdx(0);
    setLoading(false);
  }
  useEffect(() => { if (user) load(); }, [user?.id]);

  async function act(action: "passed" | "liked") {
    const c = cards[idx];
    if (!c) return;
    const { data, error } = await supabase.rpc("send_interest_v2", { target: c.id, action });
    if (error) { setToast("Something went wrong."); setTimeout(() => setToast(null), 2500); return; }
    if (action === "liked" && data && (data as { matched: boolean }[])[0]?.matched) {
      setMatched(c.full_name?.split(" ")[0] ?? "your match");
    } else if (action === "liked") {
      setToast("Interest sent.");
      setTimeout(() => setToast(null), 2000);
    }
    setIdx((i) => i + 1);
  }

  const current = cards[idx];
  const done = !loading && idx >= cards.length;

  return (
    <AppShell maxWidth="max-w-md">
      <h1 className="font-display text-2xl text-foreground mb-1">Discover</h1>
      <p className="text-sm text-muted-foreground mb-6">Up to 3 thoughtfully chosen profiles each day.</p>

      {loading && <div className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />}

      {!loading && current && (
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="aspect-[3/4] bg-muted relative">
            {current.primary_photo ? (
              <img src={current.primary_photo} alt="" className="w-full h-full object-cover" style={{ filter: "blur(18px)" }} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-xl">{current.full_name?.split(" ")[0]}</h2>
              <span className="text-muted-foreground">{ageOf(current.birth_date)}</span>
            </div>
            <p className="text-sm text-muted-foreground">{current.city}, {current.country}</p>
            {(() => {
              const b = maritalBadge(current.marital_status);
              return b ? <span className={`inline-block text-xs rounded-full px-2.5 py-1 ${b.cls}`}>{b.label}</span> : null;
            })()}
            <Link to="/profile/$id" params={{ id: current.id }} className="block text-sm text-primary mt-2">View profile →</Link>
          </div>
        </div>
      )}

      {!loading && current && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button variant="outline" className="h-12" onClick={() => act("passed")}><X className="h-4 w-4 mr-1" />Pass</Button>
          <Button className="h-12" onClick={() => act("liked")}><Heart className="h-4 w-4 mr-1" />I'm interested</Button>
        </div>
      )}

      {done && (
        <div className="text-center py-16 space-y-3">
          <Moon className="h-12 w-12 text-primary mx-auto" />
          <h2 className="font-display text-xl">You've seen all profiles for today.</h2>
          <p className="text-sm text-muted-foreground">New profiles are added regularly. Come back tomorrow to discover more.</p>
        </div>
      )}

      {matched && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 px-6">
          <div className="text-center text-white space-y-3 max-w-sm">
            <div className="text-5xl">💚</div>
            <h2 className="font-display text-3xl">It's a match!</h2>
            <p className="text-white/85">You and {matched} are both interested.</p>
            <Link to="/matches"><Button variant="secondary" className="mt-4">See your matches</Button></Link>
            <div><button onClick={() => setMatched(null)} className="text-sm text-white/70 underline">Keep exploring</button></div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg text-sm">{toast}</div>
      )}
    </AppShell>
  );
}
