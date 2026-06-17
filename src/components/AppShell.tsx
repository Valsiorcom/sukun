import { Link, useLocation } from "@tanstack/react-router";
import { Compass, Heart, MessageCircle, User } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/dashboard", icon: Compass, label: "Discover" },
  { to: "/matches", icon: Heart, label: "Matches" },
  { to: "/matches", icon: MessageCircle, label: "Chats" },
  { to: "/profile/me", icon: User, label: "Profile" },
];

export function AppShell({ children, maxWidth = "max-w-[640px]" }: { children: ReactNode; maxWidth?: string }) {
  const loc = useLocation();
  return (
    <div className="min-h-dvh bg-background pb-20 md:pb-0">
      {/* Desktop top nav */}
      <header className="hidden md:flex sticky top-0 z-30 h-16 items-center justify-between border-b border-border bg-white/95 backdrop-blur px-6">
        <Link to="/dashboard" className="font-display text-2xl text-primary">MITAN</Link>
        <nav className="flex items-center gap-6 text-sm">
          {NAV.slice(0, 3).map((n) => (
            <Link key={n.label} to={n.to} className="text-foreground hover:text-primary" activeProps={{ className: "text-primary font-semibold" }}>
              {n.label}
            </Link>
          ))}
          <Link to="/profile/me" className="text-foreground hover:text-primary" activeProps={{ className: "text-primary font-semibold" }}>Profile</Link>
          <Link to="/settings" className="text-muted-foreground hover:text-primary text-sm">Settings</Link>
        </nav>
      </header>
      <main className={`${maxWidth} mx-auto px-4 py-6 md:py-10`}>{children}</main>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-border bg-white">
        {NAV.map((n, i) => {
          const Icon = n.icon;
          const active = loc.pathname.startsWith(n.to);
          return (
            <Link key={i} to={n.to} className="flex flex-col items-center justify-center py-2 text-[11px] gap-1">
              <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className={active ? "text-primary font-medium" : "text-muted-foreground"}>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
