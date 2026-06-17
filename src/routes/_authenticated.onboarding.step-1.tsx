import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { OnboardingShell } from "@/components/OnboardingShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding/step-1")({
  component: Step1,
});

const COUNTRIES = ["Indonesia","Malaysia","Singapore","Brunei","United States","United Kingdom","Canada","Australia","Germany","France","Netherlands","Saudi Arabia","UAE","Qatar","Egypt","Turkey","Pakistan","Bangladesh","India","Nigeria","South Africa","Morocco","Other"];

function Step1() {
  const { user, profile, refresh } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [marital, setMarital] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setGender(profile.gender ?? "");
      setBirthDate(profile.birth_date ?? "");
      setMarital(profile.marital_status ?? "");
      setCity(profile.city ?? "");
      setCountry(profile.country ?? "");
    }
  }, [profile]);

  function age(): number {
    if (!birthDate) return 0;
    const d = new Date(birthDate);
    return Math.floor((Date.now() - d.getTime()) / 31557600000);
  }

  const ageNum = age();
  const valid = fullName.trim().length >= 3 && gender && birthDate && ageNum >= 21 && marital && city.trim().length >= 2 && country;

  async function handleNext() {
    if (!valid || !user) return;
    setSaving(true); setErr(null);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      display_name: fullName.trim().split(" ")[0],
      gender,
      age: ageNum,
      birth_date: birthDate,
      marital_status: marital,
      city: city.trim(),
      country,
      onboarding_step: 1,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    await refresh();
    nav({ to: "/onboarding/step-2" });
  }

  return (
    <OnboardingShell step={1}>
      <h1 className="font-display text-2xl text-foreground">Tell us about yourself</h1>
      <p className="mt-1 text-sm text-muted-foreground">This information helps us find relevant matches for you.</p>
      <div className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" className="h-12" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={60} />
        </div>
        <div className="space-y-2">
          <Label>I am a</Label>
          <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-2 rounded-xl border-2 p-3 cursor-pointer ${gender === "male" ? "border-primary bg-primary/5" : "border-border"}`}>
              <RadioGroupItem value="male" /> Man
            </label>
            <label className={`flex items-center gap-2 rounded-xl border-2 p-3 cursor-pointer ${gender === "female" ? "border-primary bg-primary/5" : "border-border"}`}>
              <RadioGroupItem value="female" /> Woman
            </label>
          </RadioGroup>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" type="date" className="h-12" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          {birthDate && ageNum < 21 && <p className="text-xs text-destructive">You must be at least 21 years old.</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Marital Status</Label>
          <Select value={marital} onValueChange={setMarital}>
            <SelectTrigger className="h-12"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="never_married">Never Married</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" className="h-12" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="h-12"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button className="w-full h-12" disabled={!valid || saving} onClick={handleNext}>
          {saving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </OnboardingShell>
  );
}
