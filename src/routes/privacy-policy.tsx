import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MITAN" },
      { name: "description", content: "How MITAN collects, uses, and protects your personal data." },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl text-primary">MITAN</Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <h1 className="font-display text-3xl md:text-4xl mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

        <section className="prose prose-neutral max-w-none space-y-8 text-foreground">
          <div>
            <h2 className="font-display text-xl mb-2">What data we collect</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When you create an account, we collect your name, email address, government-issued ID documents (for KYC verification),
              the essays you write about yourself, and the photos you upload.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">How we use it</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We use your data to match you with compatible members, verify that you are a real person ready for marriage,
              and keep the community safe from impersonation and harassment.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">KYC data deletion</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              ID documents submitted for verification are deleted within 30 days of approval. Selfies used to confirm your identity
              are deleted on the same schedule.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">Your rights</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You can delete your account at any time from Settings. Deleting your account permanently removes your profile,
              photos, essays, matches, and conversations from our systems.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">Contact</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Questions? Email us at <a className="text-primary underline" href="mailto:hello@mitan.com">hello@mitan.com</a>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
