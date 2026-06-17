import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { deleteMyAccount } from "@/lib/account.functions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — MITAN" }] }),
  component: SettingsPage,
});

type Blocked = { to_user: string; created_at: string; full_name: string | null };

function SettingsPage() {
  const { user, profile, refresh, signOut } = useAuth();
  const nav = useNavigate();
  const deleteFn = useServerFn(deleteMyAccount);

  // Password form
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  // Notification prefs
  const [notifyMatch, setNotifyMatch] = useState(true);
  const [notifyKyc, setNotifyKyc] = useState(true);
  const [prefsBusy, setPrefsBusy] = useState(false);

  // Delete modal
  const [delOpen, setDelOpen] = useState(false);
  const [delConfirm, setDelConfirm] = useState("");
  const [delBusy, setDelBusy] = useState(false);

  // Blocked users
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [bLoading, setBLoading] = useState(true);

  const isAdmin = !!user?.email && user.email === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setNotifyMatch(p.notify_match ?? true);
      // Map "KYC reviewed" to notify_interest column (re-used semantically)
      setNotifyKyc(p.notify_interest ?? true);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setBLoading(true);
      const { data } = await supabase.from("blocks").select("to_user,created_at").eq("from_user", user.id);
      const rows = (data ?? []) as Array<{ to_user: string; created_at: string }>;
      if (rows.length === 0) { setBlocked([]); setBLoading(false); return; }
      const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", rows.map(r => r.to_user));
      const m = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
      setBlocked(rows.map(r => ({ ...r, full_name: m.get(r.to_user) ?? null })));
      setBLoading(false);
    })();
  }, [user?.id]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (pw.next !== pw.confirm) { toast.error("Passwords don't match."); return; }
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwBusy(false);
    if (error) { toast.error(error.message); return; }
    setPw({ current: "", next: "", confirm: "" });
    toast.success("Password updated ✓");
  }

  async function savePrefs() {
    if (!user) return;
    setPrefsBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notify_match: notifyMatch, notify_interest: notifyKyc })
      .eq("id", user.id);
    setPrefsBusy(false);
    if (error) { toast.error(error.message); return; }
    await refresh();
    toast.success("Preferences saved ✓");
  }

  async function confirmDelete() {
    if (delConfirm !== "DELETE") return;
    setDelBusy(true);
    try {
      await deleteFn();
      await signOut();
      toast.success("Account deleted.");
      nav({ to: "/", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete account.");
      setDelBusy(false);
    }
  }

  async function unblock(uid: string) {
    if (!user) return;
    const { error } = await supabase.from("blocks").delete().eq("from_user", user.id).eq("to_user", uid);
    if (error) { toast.error(error.message); return; }
    setBlocked(b => b.filter(x => x.to_user !== uid));
    toast.success("Unblocked ✓");
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl mb-6">Settings</h1>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="account" className="min-h-11">Account</TabsTrigger>
          <TabsTrigger value="privacy" className="min-h-11">Privacy</TabsTrigger>
        </TabsList>

        {/* ACCOUNT TAB */}
        <TabsContent value="account" className="space-y-6">
          {/* Email */}
          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-lg mb-3">Email</h2>
            <p className="text-sm text-muted-foreground break-all">{user?.email}</p>
          </section>

          {/* Change password */}
          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-lg mb-4">Change password</h2>
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <Label htmlFor="cur">Current password</Label>
                <Input id="cur" type="password" autoComplete="current-password" className="min-h-11" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="new">New password (min 8)</Label>
                <Input id="new" type="password" autoComplete="new-password" minLength={8} className="min-h-11" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="conf">Confirm new password</Label>
                <Input id="conf" type="password" autoComplete="new-password" className="min-h-11" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </div>
              <Button type="submit" disabled={pwBusy || !pw.next} className="min-h-11">{pwBusy ? "Saving…" : "Save"}</Button>
            </form>
          </section>

          {/* Notification preferences */}
          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-lg mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 min-h-11 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-primary" checked={notifyMatch} onChange={(e) => setNotifyMatch(e.target.checked)} />
                <span className="text-sm">Email me when I get a new match</span>
              </label>
              <label className="flex items-center gap-3 min-h-11 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 accent-primary" checked={notifyKyc} onChange={(e) => setNotifyKyc(e.target.checked)} />
                <span className="text-sm">Email me when my KYC is reviewed</span>
              </label>
            </div>
            <Button onClick={savePrefs} disabled={prefsBusy} className="mt-4 min-h-11">{prefsBusy ? "Saving…" : "Save preferences"}</Button>
          </section>

          {/* Admin links */}
          {isAdmin && (
            <section className="rounded-xl border border-border bg-white p-5 space-y-2">
              <h2 className="font-display text-lg mb-2">Admin</h2>
              <Link to="/admin/kyc" className="block min-h-11 flex items-center text-primary">KYC queue →</Link>
              <Link to="/admin/users" className="block min-h-11 flex items-center text-primary">Users →</Link>
            </section>
          )}

          <Button variant="outline" className="w-full min-h-11" onClick={signOut}>Sign out</Button>

          {/* Danger zone */}
          <section className="rounded-xl border-2 border-destructive bg-white p-5">
            <h2 className="font-display text-lg text-destructive mb-2">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Deleting your account permanently removes your profile, photos, matches, and conversations. This cannot be undone.
            </p>
            <Button variant="destructive" className="min-h-11" onClick={() => { setDelConfirm(""); setDelOpen(true); }}>
              Delete account
            </Button>
          </section>
        </TabsContent>

        {/* PRIVACY TAB */}
        <TabsContent value="privacy" className="space-y-6">
          <section className="rounded-xl border border-border bg-paper-alt p-5">
            <h2 className="font-display text-lg mb-2">Who can see my profile</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your full profile and clear photos are only visible after a mutual match.
              In discovery, only your first name, age, city, and a blurred photo are shown.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-lg mb-4">Blocked members ({blocked.length})</h2>
            {bLoading ? (
              <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
            ) : blocked.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
            ) : (
              <ul className="divide-y divide-border">
                {blocked.map(b => (
                  <li key={b.to_user} className="flex items-center justify-between py-3 gap-3 min-h-11">
                    <span className="text-sm truncate">{b.full_name ?? "Member"}</span>
                    <Button size="sm" variant="outline" className="min-h-11" onClick={() => unblock(b.to_user)}>Unblock</Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation modal */}
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent. Type <strong>DELETE</strong> below to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={delConfirm}
            onChange={(e) => setDelConfirm(e.target.value)}
            placeholder="DELETE"
            className="min-h-11"
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delBusy} className="min-h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={delConfirm !== "DELETE" || delBusy}
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-11"
            >
              {delBusy ? "Deleting…" : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
