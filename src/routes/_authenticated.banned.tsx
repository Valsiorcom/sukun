import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/banned")({
  component: BannedPage,
});

function BannedPage() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-5">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display text-2xl text-destructive">Account suspended</h1>
        <p className="text-muted-foreground">
          Your account has been suspended. For more information please contact{" "}
          <a className="text-primary" href="mailto:hello@mitan.cc">hello@mitan.cc</a>.
        </p>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
}
