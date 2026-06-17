import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/OnboardingShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/onboarding/step-3")({
  component: Step3,
});

function Counter({ n, min }: { n: number; min: number }) {
  const ok = n >= min;
  return <p className={`text-xs ${ok ? "text-emerald-700" : "text-muted-foreground"}`}>{n} / {min} minimum</p>;
}

function Step3() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [e1, setE1] = useState("");
  const [e2, setE2] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("essays").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setE1(data.essay_1 ?? ""); setE2(data.essay_2 ?? ""); }
    });
  }, [user?.id]);

  const valid = e1.length >= 150 && e1.length <= 1000 && e2.length >= 150 && e2.length <= 1000;

  async function handleNext() {
    if (!valid || !user) return;
    setSaving(true);
    await supabase.from("essays").upsert({ user_id: user.id, essay_1: e1, essay_2: e2, updated_at: new Date().toISOString() });
    await supabase.from("profiles").update({ onboarding_step: 3, essay_vision: e1, essay_values: e2 }).eq("id", user.id);
    await refresh();
    setSaving(false);
    nav({ to: "/onboarding/step-4" });
  }

  return (
    <OnboardingShell step={3} backTo="/onboarding/step-2">
      <h1 className="font-display text-2xl text-foreground">Share your perspective</h1>
      <p className="mt-1 text-sm text-muted-foreground">These essays will be read by your matches. Write honestly — this is where real connection begins.</p>
      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label>What does a peaceful home mean to you?</Label>
          <p className="text-xs text-muted-foreground">Give a concrete example of a value you'd bring into marriage.</p>
          <Textarea value={e1} onChange={(e) => setE1(e.target.value.slice(0, 1000))} className="min-h-[140px]" />
          <Counter n={e1.length} min={150} />
        </div>
        <div className="space-y-2">
          <Label>What is the most important lesson from your past?</Label>
          <p className="text-xs text-muted-foreground">This could be from a previous relationship, marriage, or any significant life experience.</p>
          <Textarea value={e2} onChange={(e) => setE2(e.target.value.slice(0, 1000))} className="min-h-[140px]" />
          <Counter n={e2.length} min={150} />
        </div>
        <Button className="w-full h-12" disabled={!valid || saving} onClick={handleNext}>{saving ? "Saving..." : "Continue"}</Button>
      </div>
    </OnboardingShell>
  );
}
