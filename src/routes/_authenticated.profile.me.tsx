import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Star, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile/me")({
  component: ProfileMe,
});

type Photo = { id: string; photo_url: string; is_primary: boolean; sort_order: number };

function ProfileMe() {
  const { user, profile, refresh, signOut } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [e1, setE1] = useState("");
  const [e2, setE2] = useState("");
  const [savedTxt, setSavedTxt] = useState<string | null>(null);

  async function loadPhotos() {
    if (!user) return;
    const { data } = await supabase.from("photos").select("*").eq("user_id", user.id).order("sort_order");
    setPhotos((data ?? []) as Photo[]);
  }

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCity(profile.city ?? "");
      setCountry(profile.country ?? "");
    }
    if (user) {
      loadPhotos();
      supabase.from("essays").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
        if (data) { setE1(data.essay_1 ?? ""); setE2(data.essay_2 ?? ""); }
      });
    }
  }, [user?.id, profile?.id]);

  async function saveProfile() {
    if (!user) return;
    await supabase.from("profiles").update({ full_name: fullName, display_name: fullName.split(" ")[0], city, country }).eq("id", user.id);
    await refresh();
    setSavedTxt("Profile saved.");
    setTimeout(() => setSavedTxt(null), 2000);
  }

  async function saveEssays() {
    if (!user) return;
    await supabase.from("essays").upsert({ user_id: user.id, essay_1: e1, essay_2: e2, updated_at: new Date().toISOString() });
    setSavedTxt("Essays saved.");
    setTimeout(() => setSavedTxt(null), 2000);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    await supabase.storage.from("photos").upload(path, file);
    const { data: u } = supabase.storage.from("photos").getPublicUrl(path);
    await supabase.from("photos").insert({ user_id: user.id, photo_url: u.publicUrl, is_primary: photos.length === 0, sort_order: photos.length });
    await loadPhotos();
    e.target.value = "";
  }

  async function setPrimary(id: string) {
    if (!user) return;
    await supabase.from("photos").update({ is_primary: false }).eq("user_id", user.id);
    await supabase.from("photos").update({ is_primary: true }).eq("id", id);
    await loadPhotos();
  }

  async function removePhoto(id: string) {
    await supabase.from("photos").delete().eq("id", id);
    await loadPhotos();
  }

  async function deleteAccount() {
    const v = prompt("Type DELETE to confirm permanent deletion:");
    if (v !== "DELETE") return;
    if (!user) return;
    await supabase.from("profiles").update({ account_status: "deleted" }).eq("id", user.id);
    await signOut();
  }

  return (
    <AppShell>
      <h1 className="font-display text-2xl mb-6">Your Profile</h1>

      {savedTxt && <div className="fixed top-4 right-4 bg-emerald-700 text-white px-3 py-2 rounded text-sm z-50">{savedTxt}</div>}

      <section className="space-y-3">
        <h2 className="font-display text-lg">Photos</h2>
        <div className="grid grid-cols-3 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-border">
              <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
              {p.is_primary ? (
                <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Main</span>
              ) : (
                <button onClick={() => setPrimary(p.id)} className="absolute bottom-1 left-1 bg-white/90 rounded p-1"><Star className="h-3 w-3" /></button>
              )}
              <button onClick={() => removePhoto(p.id)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {photos.length < 3 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer text-muted-foreground">
              <Upload className="h-5 w-5" /><span className="text-xs">Add</span>
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleUpload} />
            </label>
          )}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-lg">Profile</h2>
        <div className="space-y-1.5"><Label>Full Name</Label><Input className="h-12" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>City</Label><Input className="h-12" value={city} onChange={(e) => setCity(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Country</Label><Input className="h-12" value={country} onChange={(e) => setCountry(e.target.value)} /></div>
        <p className="text-xs text-muted-foreground">🔒 Gender, date of birth, and marital status cannot be changed after verification.</p>
        <Button onClick={saveProfile}>Save</Button>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-lg">Essays</h2>
        <div className="space-y-1.5"><Label>What does a peaceful home mean to you?</Label><Textarea value={e1} onChange={(e) => setE1(e.target.value.slice(0, 1000))} className="min-h-[140px]" /></div>
        <div className="space-y-1.5"><Label>What is the most important lesson from your past?</Label><Textarea value={e2} onChange={(e) => setE2(e.target.value.slice(0, 1000))} className="min-h-[140px]" /></div>
        <Button onClick={saveEssays} disabled={e1.length < 150 || e2.length < 150}>Save</Button>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-lg">Account</h2>
        <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
        {profile?.is_verified && <p className="text-sm text-emerald-700">Identity Verified ✓</p>}
        <Button variant="outline" onClick={signOut}>Sign Out</Button>
      </section>

      <section className="mt-8 p-4 rounded-xl border border-destructive/40">
        <h2 className="font-display text-lg text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mt-1">Permanently delete your account.</p>
        <Button variant="destructive" className="mt-3" onClick={deleteAccount}>Delete Account</Button>
      </section>
    </AppShell>
  );
}
