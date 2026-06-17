import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/waiting")({
  component: WaitingPage,
});

type Kyc = { status: string; rejection_reason: string | null };

function WaitingPage() {
  const { user, profile, refresh, signOut } = useAuth();
  const nav = useNavigate();
  const [kyc, setKyc] = useState<Kyc | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("kyc_requests").select("status,rejection_reason").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setKyc((data as Kyc) ?? null);
    if (data?.status === "approved") {
      await refresh();
      nav({ to: "/dashboard", replace: true });
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user?.id]);

  useEffect(() => {
    if (profile?.is_verified) nav({ to: "/dashboard", replace: true });
  }, [profile?.is_verified]);

  if (kyc?.status === "rejected") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xl">!</div>
          <h1 className="font-display text-2xl text-foreground">Verification unsuccessful</h1>
          <p className="text-muted-foreground text-sm">{kyc.rejection_reason || "Please re-upload clearer documents."}</p>
          <Button onClick={() => nav({ to: "/onboarding/step-4" })}>Upload New Documents</Button>
          <div><button onClick={signOut} className="text-xs text-muted-foreground hover:text-primary">Sign out</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl text-foreground">Your profile is being reviewed.</h1>
        <p className="text-muted-foreground">Our team usually completes verification within 24 hours. You'll receive an email once your profile is approved.</p>
        <p className="text-xs text-muted-foreground">Questions? <a className="text-primary" href="mailto:hello@mitan.cc">hello@mitan.cc</a></p>
        <div className="pt-4"><button onClick={signOut} className="text-xs text-muted-foreground hover:text-primary">Sign out</button></div>
      </div>
    </div>
  );
}
