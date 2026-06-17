import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getPostAuthRoute, translateAuthError } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({ meta: [{ title: "Join MITAN" }] }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        const to = await getPostAuthRoute(data.session.user.id);
        nav({ to, replace: true });
      }
    });
  }, [nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/onboarding/step-1` },
      });
      if (error) { setError(translateAuthError(error.message)); return; }
      if (data.session?.user) {
        nav({ to: "/onboarding/step-1", replace: true });
      } else {
        setSent(true);
      }
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError(null);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/onboarding/step-1" });
      if ("error" in r && r.error) setError("Google sign-up failed.");
    } catch { setError("Google sign-up failed."); }
  }

  if (sent) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px] text-center space-y-3">
          <h1 className="font-display text-2xl text-primary">Check your email</h1>
          <p className="text-muted-foreground text-sm">We sent a verification link to <span className="text-foreground font-medium">{email}</span>.</p>
          <Link to="/auth/login" className="inline-block text-sm text-primary">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center">
          <Link to="/" className="font-display text-3xl text-primary">MITAN</Link>
          <h1 className="mt-6 font-display text-2xl text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Begin with honesty.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
        </div>
        <Button type="button" variant="outline" className="w-full h-12" onClick={handleGoogle}>Continue with Google</Button>
        <p className="text-center text-sm">Already have an account? <Link to="/auth/login" className="text-primary font-medium">Sign in</Link></p>
      </div>
    </div>
  );
}
