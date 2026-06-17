import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { computeRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { user, profile, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/auth/login", replace: true });
      return;
    }
    const target = computeRedirect(profile);
    // Allow current target route to render
    const path = loc.pathname;
    const isOnTarget = path === target || path.startsWith(target + "/");
    // Admin pages: allow if email matches; otherwise verified user redirect rule applies
    if (path.startsWith("/admin")) return;
    // Onboarding step pages: allow if path matches the computed target exactly
    if (path.startsWith("/onboarding/") && target.startsWith("/onboarding/") && path === target) return;
    // Banned screen
    if (target === "/banned") {
      if (path !== "/banned") nav({ to: "/banned", replace: true });
      return;
    }
    // If on dashboard, profile, matches, chat, settings, waiting => only allow if computed says dashboard or matches that exact route
    if (target === "/dashboard") return; // verified — allow all protected pages
    if (target === "/waiting" && path !== "/waiting") {
      nav({ to: "/waiting", replace: true });
      return;
    }
    if (target.startsWith("/onboarding/") && !isOnTarget) {
      nav({ to: target, replace: true });
    }
  }, [loading, user, profile, loc.pathname, nav]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!user) return null;
  return <Outlet />;
}
