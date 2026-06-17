import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/kyc")({
  head: () => ({ meta: [{ title: "KYC Queue — MITAN Admin" }] }),
  component: AdminKyc,
});

type Req = { id: string; user_id: string; doc_type: string; id_document_url: string; selfie_url: string; created_at: string };

function AdminKyc() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [list, setList] = useState<Req[]>([]);
  const [picked, setPicked] = useState<Req | null>(null);
  const [idUrl, setIdUrl] = useState<string>("");
  const [selfieUrl, setSelfieUrl] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && user.email !== import.meta.env.VITE_ADMIN_EMAIL) {
      nav({ to: "/dashboard", replace: true });
    }
  }, [user]);

  async function load() {
    const { data } = await supabase.from("kyc_requests").select("*").eq("status", "pending").order("created_at");
    setList((data ?? []) as Req[]);
  }
  useEffect(() => { load(); }, []);

  async function pick(r: Req) {
    setPicked(r); setReason(""); setRejecting(false);
    const [{ data: id }, { data: sel }, { data: p }] = await Promise.all([
      supabase.storage.from("kyc").createSignedUrl(r.id_document_url, 3600),
      supabase.storage.from("kyc").createSignedUrl(r.selfie_url, 3600),
      supabase.from("profiles").select("full_name,gender,city,country,marital_status,birth_date").eq("id", r.user_id).maybeSingle(),
    ]);
    setIdUrl(id?.signedUrl ?? "");
    setSelfieUrl(sel?.signedUrl ?? "");
    setProfile(p);
  }

  async function approve() {
    if (!picked) return;
    setBusy(true);
    await supabase.rpc("admin_approve_kyc", { req_id: picked.id });
    setBusy(false);
    setPicked(null); load();
  }

  async function reject() {
    if (!picked || !reason.trim()) return;
    setBusy(true);
    await supabase.rpc("admin_reject_kyc", { req_id: picked.id, reason: reason.trim() });
    setBusy(false);
    setPicked(null); load();
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-white px-6 h-14 flex items-center justify-between">
        <h1 className="font-display text-xl">Admin · KYC Queue</h1>
        <span className="text-sm text-muted-foreground">Pending: {list.length}</span>
      </header>
      <div className="grid md:grid-cols-[400px_1fr] gap-0">
        <div className="border-r border-border bg-white max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
          {list.length === 0 && <p className="p-6 text-sm text-muted-foreground">No pending verifications. All caught up ✓</p>}
          {list.map((r) => (
            <button key={r.id} onClick={() => pick(r)} className={`w-full text-left p-4 border-b border-border hover:bg-muted ${picked?.id === r.id ? "bg-muted" : ""}`}>
              <p className="font-medium text-sm">{r.doc_type}</p>
              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
            </button>
          ))}
        </div>
        <div className="p-6">
          {!picked && <p className="text-muted-foreground">Select a request to review.</p>}
          {picked && (
            <div className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground mb-1">ID document</p>{idUrl && <img src={idUrl} alt="" className="w-full rounded-lg border border-border" />}</div>
                <div><p className="text-xs text-muted-foreground mb-1">Selfie</p>{selfieUrl && <img src={selfieUrl} alt="" className="w-full rounded-lg border border-border" />}</div>
              </div>
              {profile && (
                <div className="rounded-xl border border-border p-4 text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {profile.full_name}</p>
                  <p><span className="text-muted-foreground">Gender:</span> {profile.gender}</p>
                  <p><span className="text-muted-foreground">Birth:</span> {profile.birth_date}</p>
                  <p><span className="text-muted-foreground">Marital:</span> {profile.marital_status}</p>
                  <p><span className="text-muted-foreground">Location:</span> {profile.city}, {profile.country}</p>
                </div>
              )}
              {!rejecting ? (
                <div className="flex gap-2">
                  <Button onClick={approve} disabled={busy}>Approve ✓</Button>
                  <Button variant="outline" onClick={() => setRejecting(true)}>Reject</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea placeholder="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button variant="destructive" onClick={reject} disabled={busy || !reason.trim()}>Confirm reject</Button>
                    <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
