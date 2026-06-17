import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — MITAN" },
      { name: "description", content: "Terms of service for MITAN — eligibility, conduct, and disclaimers." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl text-primary">MITAN</Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <h1 className="font-display text-3xl md:text-4xl mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

        <section className="space-y-8 text-foreground">
          <div>
            <h2 className="font-display text-xl mb-2">Eligibility</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              MITAN is for Muslim adults aged 21 or older who are genuinely seeking marriage. By creating an account
              you confirm you meet these criteria.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">Prohibited behavior</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Harassment, threats, fake identity, impersonation, solicitation, and any unlawful conduct are not permitted.
              We may remove content and terminate accounts that violate these rules.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">Account termination</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may suspend or terminate accounts that breach these terms, harm other members, or misrepresent the user.
              You may delete your account at any time from Settings.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">Disclaimer</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              MITAN provides a platform for introductions. We are not responsible for the outcomes of any interaction,
              relationship, or marriage that results from the use of the service.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">Governing law</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              These terms are governed by the laws of the Republic of Indonesia. Any dispute will be resolved in the
              courts of Jakarta.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl mb-2">Contact</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Questions about these terms? Email <a className="text-primary underline" href="mailto:hello@mitan.com">hello@mitan.com</a>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
