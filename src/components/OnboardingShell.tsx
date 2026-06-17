import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function OnboardingShell({
  step,
  total = 4,
  backTo,
  children,
}: {
  step: number;
  total?: number;
  backTo?: string;
  children: ReactNode;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-[480px] px-5 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            {backTo ? (
              <Link to={backTo} className="hover:text-foreground">← Back</Link>
            ) : (
              <span className="font-display text-lg text-primary">MITAN</span>
            )}
            <span>Step {step} of {total}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
