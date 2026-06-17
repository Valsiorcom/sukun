import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users — MITAN Admin" }] }),
  component: AdminUsers,
});

type Row = { id: string; full_name: string | null; email: string | null; gender: string | null; city: string | null; country: string | null; is_verified: boolean; is_banned: boolean; account_status: string; created_at: string };

function AdminUsers() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "pending" | "banned">("all");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (user && user.email !== import.meta.env.VITE_ADMIN_EMAIL) nav({ to: "/dashboard", replace: true });
  }, [user]);

  async function load() {
    let query = supabase.from("profiles").select("id,full_name,email,gender,city,country,is_verified,is_banned,account_status,created_at").order("created_at", { ascending: false }).limit(100);
    if (filter === "verified") query = query.eq("is_verified", true);
    if (filter === "pending") query = query.eq("kyc_status", "pending");
    if (filter === "banned") query = query.eq("is_banned", true);
    if (q.trim()) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    const { data } = await query;
    setRows((data ?? []) as Row[]);
  }
  useEffect(() => { load(); }, [filter]);

  async function ban(id: string, b: boolean) {
    if (!confirm(b ? "Ban this member?" : "Unban this member?")) return;
    await supabase.from("profiles").update({ account_status: b ? "banned" : "active" }).eq("id", id);
    await supabase.from("audit_logs").insert({ admin_id: user!.id, action: b ? "user_banned" : "user_unbanned", target_id: id });
    load();
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-white px-6 h-14 flex items-center"><h1 className="font-display text-xl">Admin · Users</h1></header>
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          <Button variant="outline" onClick={load}>Search</Button>
        </div>
        <div className="flex gap-2">
          {(["all","verified","pending","banned"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-sm rounded-full border ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>{f}</button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Gender</th><th className="p-2">Location</th><th className="p-2">Status</th><th className="p-2">Action</th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2">{r.full_name}</td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">{r.gender}</td>
                  <td className="p-2">{r.city}, {r.country}</td>
                  <td className="p-2">
                    {r.is_banned && <span className="text-destructive">Banned</span>}
                    {!r.is_banned && r.is_verified && <span className="text-emerald-700">Verified</span>}
                    {!r.is_banned && !r.is_verified && <span className="text-muted-foreground">Pending</span>}
                  </td>
                  <td className="p-2">
                    {r.is_banned ? (
                      <Button size="sm" variant="outline" onClick={() => ban(r.id, false)}>Unban</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => ban(r.id, true)}>Ban</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
