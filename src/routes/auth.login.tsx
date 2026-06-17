import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getPostAuthRoute, translateAuthError } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign In — MITAN" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

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
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(translateAuthError(error.message)); return; }
      if (data.user) {
        const to = await getPostAuthRoute(data.user.id);
        nav({ to, replace: true });
      }
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError(null);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth/login" });
      if ("error" in r && r.error) setError("Google sign-in failed. Please try again.");
    } catch { setError("Google sign-in failed."); }
  }

  async function handleReset() {
    if (!email) { setError("Enter your email first, then click Forgot password."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth/login" });
    if (error) setError(translateAuthError(error.message));
    else setResetSent(true);
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center">
          <Link to="/" className="font-display text-3xl text-primary">MITAN</Link>
          <h1 className="mt-6 font-display text-2xl text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {resetSent && <p className="text-sm text-emerald-700">Check your email for a reset link.</p>}
          <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
        </div>
        <Button type="button" variant="outline" className="w-full h-12" onClick={handleGoogle}>Continue with Google</Button>
        <div className="text-center text-sm space-y-2">
          <button type="button" onClick={handleReset} className="text-muted-foreground hover:text-primary">Forgot password?</button>
          <p>Don't have an account? <Link to="/auth/signup" className="text-primary font-medium">Join MITAN</Link></p>
        </div>
      </div>
    </div>
  );
}
