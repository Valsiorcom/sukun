import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat/$matchId")({
  head: () => ({ meta: [{ title: "Conversation — MITAN" }] }),
  component: ChatPage,
});

type Msg = { id: string; sender: string; body: string; created_at: string; read_at: string | null };

function ChatPage() {
  const { matchId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [lo, hi] = matchId.split("_");
  const peer = user?.id === lo ? hi : lo;
  const [peerInfo, setPeerInfo] = useState<{ name: string; city: string; photo: string | null } | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !peer) return;
    (async () => {
      const { data: m } = await supabase.from("matches").select("status").eq("user_low", lo).eq("user_high", hi).maybeSingle();
      if (!m || m.status !== "chat_opened") { nav({ to: "/matches", replace: true }); return; }
      const [{ data: p }, { data: ph }, { data: ms }] = await Promise.all([
        supabase.from("profiles").select("full_name,city").eq("id", peer).maybeSingle(),
        supabase.from("photos").select("photo_url").eq("user_id", peer).order("is_primary", { ascending: false }).limit(1),
        supabase.from("messages").select("id,sender,body,created_at,read_at").eq("match_low", lo).eq("match_high", hi).order("created_at"),
      ]);
      setPeerInfo({ name: (p as any)?.full_name?.split(" ")[0] ?? "Member", city: (p as any)?.city ?? "", photo: ph?.[0]?.photo_url ?? null });
      setMsgs((ms ?? []) as Msg[]);
      await supabase.rpc("mark_chat_read", { peer });
    })();

    const ch = supabase.channel(`chat_${matchId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_low=eq.${lo}` }, (payload) => {
      const m = payload.new as Msg;
      if (m.sender === peer) setMsgs((prev) => [...prev, m]);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, matchId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function send() {
    if (!input.trim() || !peer) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    const { data, error } = await supabase.rpc("send_message", { peer, msg: text });
    setSending(false);
    if (error) return;
    if (data && (data as Msg[])[0]) setMsgs((prev) => [...prev, (data as Msg[])[0]]);
  }

  return (
    <div className="h-dvh flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-white px-4 h-14 flex-shrink-0">
        <Link to="/matches"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="h-9 w-9 rounded-full bg-muted overflow-hidden">
          {peerInfo?.photo && <img src={peerInfo.photo} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{peerInfo?.name}</p>
          <p className="text-xs text-muted-foreground">{peerInfo?.city}</p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {msgs.length === 0 && <p className="text-center text-sm text-muted-foreground py-12">You matched! Say something meaningful. 💚</p>}
        {msgs.map((m) => {
          const mine = m.sender === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3.5 py-2 text-sm ${mine ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md" : "bg-muted text-foreground rounded-2xl rounded-bl-md"}`}>
                {m.body}
                <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border bg-white p-3 flex items-end gap-2 flex-shrink-0">
        <textarea
          rows={1}
          className="flex-1 resize-none rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary max-h-32"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message..."
        />
        <button onClick={send} disabled={!input.trim() || sending} className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
