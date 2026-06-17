import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { OnboardingShell } from "@/components/OnboardingShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding/step-4")({
  component: Step4,
});

function Step4() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [docType, setDocType] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = docType && idFile && selfieFile && consent;

  async function uploadKyc(file: File, kind: string) {
    if (!user) throw new Error("no user");
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${kind}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kyc").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }

  async function handleSubmit() {
    if (!valid || !user) return;
    setSubmitting(true); setErr(null);
    try {
      if (idFile!.size > 10 * 1024 * 1024 || selfieFile!.size > 10 * 1024 * 1024) {
        throw new Error("Files must be under 10MB.");
      }
      const idPath = await uploadKyc(idFile!, "id_doc");
      const selfiePath = await uploadKyc(selfieFile!, "selfie");
      const { error } = await supabase.from("kyc_requests").insert({
        user_id: user.id,
        doc_type: docType,
        id_document_url: idPath,
        selfie_url: selfiePath,
        status: "pending",
      });
      if (error) throw error;
      await supabase.from("profiles").update({
        onboarding_step: 4,
        profile_complete: true,
        kyc_status: "pending",
        kyc_submitted_at: new Date().toISOString(),
      }).eq("id", user.id);
      await refresh();
      nav({ to: "/waiting", replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function FileBox({ label, helper, file, onPick }: { label: string; helper: string; file: File | null; onPick: (f: File) => void }) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{helper}</p>
        <label className="block rounded-xl border-2 border-dashed border-border p-6 text-center cursor-pointer hover:border-primary">
          {file ? (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Check className="h-4 w-4" /><span className="text-sm">{file.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-5 w-5" /><span className="text-sm">Click to upload</span>
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
        </label>
      </div>
    );
  }

  return (
    <OnboardingShell step={4} backTo="/onboarding/step-3">
      <h1 className="font-display text-2xl text-foreground">Verify your identity</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every MITAN member is identity-verified. Your documents are reviewed by our team and permanently deleted after verification.</p>
      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label>Document type</Label>
          <RadioGroup value={docType} onValueChange={setDocType} className="space-y-2">
            {[["national_id","National ID"],["passport","Passport"],["driving_license","Driving License"]].map(([v,l]) => (
              <label key={v} className={`flex items-center gap-2 rounded-xl border-2 p-3 cursor-pointer ${docType === v ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value={v} /> {l}
              </label>
            ))}
          </RadioGroup>
        </div>
        <FileBox label="Photo of your ID document" helper="Make sure all details are clearly visible." file={idFile} onPick={setIdFile} />
        <FileBox label="Selfie holding your ID" helper="Hold your ID next to your face. Both must be clearly visible." file={selfieFile} onPick={setSelfieFile} />
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
          <span className="text-muted-foreground">I confirm this is my real identity. I understand my documents will be used only for verification and will be permanently deleted within 30 days.</span>
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <Button className="w-full h-12" disabled={!valid || submitting} onClick={handleSubmit}>
          {submitting ? "Submitting..." : "Submit for review"}
        </Button>
      </div>
    </OnboardingShell>
  );
}
