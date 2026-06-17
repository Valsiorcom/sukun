import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/OnboardingShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Upload, Star, X } from "lucide-react";

type Photo = { id: string; photo_url: string; is_primary: boolean; sort_order: number };

export const Route = createFileRoute("/_authenticated/onboarding/step-2")({
  component: Step2,
});

function Step2() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("photos").select("*").eq("user_id", user.id).order("sort_order");
    setPhotos((data ?? []) as Photo[]);
  }

  useEffect(() => { load(); }, [user?.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { setErr("Max 5MB per photo."); return; }
    setUploading(true); setErr(null);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (error) { setErr(error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("photos").getPublicUrl(path);
    const isPrimary = photos.length === 0;
    await supabase.from("photos").insert({
      user_id: user.id, photo_url: urlData.publicUrl, is_primary: isPrimary, sort_order: photos.length,
    });
    await load();
    setUploading(false);
    e.target.value = "";
  }

  async function setPrimary(id: string) {
    if (!user) return;
    await supabase.from("photos").update({ is_primary: false }).eq("user_id", user.id);
    await supabase.from("photos").update({ is_primary: true }).eq("id", id);
    await load();
  }

  async function remove(id: string, url: string) {
    if (!user) return;
    await supabase.from("photos").delete().eq("id", id);
    const path = url.split("/photos/")[1];
    if (path) await supabase.storage.from("photos").remove([path]);
    await load();
  }

  async function handleNext() {
    if (photos.length < 1 || !user) return;
    await supabase.from("profiles").update({ onboarding_step: 2 }).eq("id", user.id);
    await refresh();
    nav({ to: "/onboarding/step-3" });
  }

  return (
    <OnboardingShell step={2} backTo="/onboarding/step-1">
      <h1 className="font-display text-2xl text-foreground">Add your photos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Upload 1 to 3 photos. Your photos will be blurred for other members until you mutually match.</p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden border border-border">
            <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
            {p.is_primary && <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Main</span>}
            {!p.is_primary && (
              <button onClick={() => setPrimary(p.id)} className="absolute bottom-1 left-1 bg-white/90 rounded p-1"><Star className="h-3 w-3" /></button>
            )}
            <button onClick={() => remove(p.id, p.photo_url)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1"><X className="h-3 w-3" /></button>
          </div>
        ))}
        {photos.length < 3 && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary text-muted-foreground">
            <Upload className="h-5 w-5" />
            <span className="text-xs mt-1">{uploading ? "Uploading..." : "Add"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      <Button className="mt-8 w-full h-12" disabled={photos.length < 1} onClick={handleNext}>Continue</Button>
    </OnboardingShell>
  );
}
