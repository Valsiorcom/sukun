import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, PenLine, MessageCircle, Check, ArrowDown, Globe, Server, HeartHandshake } from "lucide-react";
import heroCouple from "@/assets/hero-couple.jpg";
import ogImage from "@/assets/og-image.jpg";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { BrandMark } from "@/components/landing/BrandMark";
import { useReveal } from "@/hooks/use-reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MITAN — Temukan Pasangan Hidup. Tanpa Basa-basi." },
      {
        name: "description",
        content:
          "MITAN – Temukan Pasangan Hidup. Tanpa Basa-basi. Platform perkenalan untuk Muslim yang serius menikah.",
      },
      { property: "og:title", content: "MITAN — Temukan Pasangan Hidup. Tanpa Basa-basi." },
      {
        property: "og:description",
        content:
          "MITAN – Temukan Pasangan Hidup. Tanpa Basa-basi. Platform perkenalan untuk Muslim yang serius menikah.",
      },
      { property: "og:image", content: ogImage },
      { name: "twitter:image", content: ogImage },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "MITAN",
          url: "https://mitan.cc",
          logo: "/icon-192.png",
          email: "hello@mitan.cc",
          description:
            "A quiet introduction platform for Muslims who are ready to marry. Identity verified, essay-based, no swipe.",
        }),
      },
    ],
  }),
  component: Landing,
});

function LanguageToggle() {
  const { i18n } = useTranslation("landing");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = (i18n.resolvedLanguage ?? i18n.language ?? "id").startsWith("id") ? "id" : "en";
  const next = current === "id" ? "en" : "id";
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-2 rounded-md focus-ring transition-colors uppercase tracking-wider"
      aria-label={`Switch language to ${next.toUpperCase()}`}
    >
      <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
      <span className={mounted && current === "en" ? "text-foreground" : ""}>EN</span>
      <span className="opacity-40">/</span>
      <span className={mounted && current === "id" ? "text-foreground" : ""}>ID</span>
    </button>
  );
}

function Nav() {
  const { t } = useTranslation("landing");
  const navLinks = [
    { href: "#how", label: t("nav.howItWorks") },
    { href: "#founder", label: t("nav.founder") },
    { href: "#faq", label: t("nav.faq") },
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/50">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 text-primary focus-ring rounded-md">
          <BrandMark size={22} variant="emerald" />
          <span className="font-display text-lg tracking-[0.18em] uppercase font-semibold">
            Mitan
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors relative after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-px after:w-0 after:bg-accent after:transition-all hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageToggle />
          <Link
            to="/auth/login"
            className="hidden sm:inline-flex text-sm font-medium text-primary border border-primary/80 hover:border-primary hover:bg-primary/5 px-4 py-2 rounded-full focus-ring transition-colors min-h-11 items-center"
          >
            {t("nav.signIn")}
          </Link>
          <Link
            to="/auth/signup"
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 btn-press focus-ring min-h-11"
          >
            {t("nav.join")}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useTranslation("landing");
  return (
    <section id="top" className="relative isolate overflow-hidden">
      {/* Cinematic full-bleed background photo */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroCouple}
          alt=""
          aria-hidden
          fetchPriority="high"
          className="w-full h-full object-cover object-center"
        />
        {/* Warm paper wash + emerald vignette so text stays readable on either side */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--paper)_92%,transparent)_0%,color-mix(in_oklab,var(--paper)_55%,transparent)_38%,color-mix(in_oklab,var(--paper)_30%,transparent)_70%,color-mix(in_oklab,var(--primary)_55%,transparent)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,color-mix(in_oklab,var(--paper)_70%,transparent)_0%,transparent_55%)]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-36 md:pt-48 pb-28 md:pb-40">
        <div className="max-w-2xl text-center md:text-left reveal" data-reveal>
          <div className="flex justify-center md:justify-start mb-6">
            <BrandMark size={44} variant="emerald" />
          </div>
          <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.24em] text-accent mb-5">
            {t("hero.eyebrow")}
          </p>
          <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-[clamp(3rem,6.5vw,5.5rem)] leading-[1.02] tracking-tight text-primary">
            {t("hero.headlineLine1")}
            <br />
            <span className="italic font-normal">{t("hero.headlineLine2")}</span>
          </h1>
          <p className="mt-7 text-base md:text-lg text-foreground/75 max-w-[560px] mx-auto md:mx-0 leading-relaxed">
            {t("hero.sub")}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center md:items-start gap-3">
            <Link
              to="/auth/signup"
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium text-base px-8 py-4 min-h-[52px] hover:bg-primary/95 hover:ring-1 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background btn-press focus-ring shadow-[0_12px_32px_-10px_color-mix(in_oklab,var(--primary)_50%,transparent)]"
            >
              {t("hero.cta")}
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground py-2 group focus-ring rounded-md"
            >
              {t("hero.secondary")}
              <ArrowDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            </a>
          </div>

          <p className="mt-5 text-xs text-foreground/60">{t("hero.note")}</p>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const { t } = useTranslation("landing");
  const items = t("trust.items", { returnObjects: true }) as string[];
  return (
    <section className="px-5 py-10 md:py-12 bg-paper-alt border-y border-border/60">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 text-sm">
        {items.map((label) => (
          <div
            key={label}
            className="flex items-center justify-center md:justify-start gap-3 text-foreground/80"
          >
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            </span>
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsHammer() {
  const { t } = useTranslation("landing");
  const items = t("stats.items", { returnObjects: true }) as { number: string; label: string }[];
  return (
    <section className="px-5 py-20 md:py-28 bg-background border-b border-border/60">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-accent mb-12 reveal" data-reveal>
          {t("stats.eyebrow")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
          {items.map((s, i) => (
            <div key={i} className="reveal" data-reveal data-reveal-delay={`${i * 100}`}>
              <p className="font-display text-[clamp(3rem,7vw,5rem)] leading-none text-primary tracking-tight">
                {s.number}
              </p>
              <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderStory() {
  const { t } = useTranslation("landing");
  const paragraphs = t("founder.paragraphs", { returnObjects: true }) as string[];
  return (
    <section id="founder" className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10 reveal" data-reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent mb-3">
            {t("founder.eyebrow")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">
            {t("founder.title")}
          </h2>
        </div>

        <article className="bg-background rounded-2xl border-l-4 border-l-accent border-y border-r border-border shadow-sm px-7 py-9 md:px-12 md:py-14 reveal" data-reveal data-reveal-delay="100">
          <div className="mb-8">
            <p className="font-display text-lg text-foreground">Tony</p>
            <p className="text-xs text-muted-foreground">{t("founder.byline")}</p>
          </div>

          <div className="font-display text-[1.0625rem] md:text-lg leading-[1.85] text-foreground/90 space-y-5">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "italic text-foreground" : ""}>
                {p}
              </p>
            ))}
          </div>

          <p className="mt-8 italic font-display text-sm text-muted-foreground">
            {t("founder.signature")}
          </p>
        </article>
      </div>
    </section>
  );
}

const stepIllustrations = [
  // Step 1 — Essay / pen on paper
  (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect x="28" y="14" width="86" height="100" rx="3" stroke="currentColor" strokeWidth="1.25" />
      <line x1="40" y1="34" x2="96" y2="34" stroke="currentColor" strokeWidth="1" />
      <line x1="40" y1="46" x2="102" y2="46" stroke="currentColor" strokeWidth="1" />
      <line x1="40" y1="58" x2="92" y2="58" stroke="currentColor" strokeWidth="1" />
      <line x1="40" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="1" />
      <line x1="40" y1="82" x2="80" y2="82" stroke="currentColor" strokeWidth="1" />
      <path d="M104 70 L138 36 L146 44 L112 78 Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M104 70 L112 78 L100 82 Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <circle cx="142" cy="40" r="2.2" fill="hsl(var(--accent))" />
    </svg>
  ),
  // Step 2 — ID card + shield
  (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <rect x="18" y="28" width="92" height="64" rx="4" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="40" cy="58" r="9" stroke="currentColor" strokeWidth="1.25" />
      <path d="M28 80 Q40 70 52 80" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <line x1="62" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1" />
      <line x1="62" y1="60" x2="96" y2="60" stroke="currentColor" strokeWidth="1" />
      <line x1="62" y1="70" x2="90" y2="70" stroke="currentColor" strokeWidth="1" />
      <path d="M118 36 L140 30 L140 64 Q140 82 118 92 Q96 82 96 64 L96 30 Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="hsl(var(--paper))" />
      <path d="M108 62 L116 70 L130 54" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // Step 3 — Chat bubbles
  (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full h-full">
      <path d="M20 24 H100 Q108 24 108 32 V64 Q108 72 100 72 H44 L30 84 V72 H20 Q12 72 12 64 V32 Q12 24 20 24 Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <line x1="26" y1="40" x2="86" y2="40" stroke="currentColor" strokeWidth="1" />
      <line x1="26" y1="52" x2="74" y2="52" stroke="currentColor" strokeWidth="1" />
      <path d="M68 56 H140 Q148 56 148 64 V92 Q148 100 140 100 H80 L66 112 V100 H68 Q60 100 60 92 V64 Q60 56 68 56 Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" fill="hsl(var(--paper))" />
      <line x1="74" y1="72" x2="134" y2="72" stroke="currentColor" strokeWidth="1" />
      <line x1="74" y1="84" x2="122" y2="84" stroke="currentColor" strokeWidth="1" />
      <circle cx="142" cy="62" r="2.2" fill="hsl(var(--accent))" />
    </svg>
  ),
];

function HowItWorks() {
  const { t } = useTranslation("landing");
  const steps = t("how.steps", { returnObjects: true }) as { title: string; body: string }[];
  const icons = [PenLine, ShieldCheck, MessageCircle];
  return (
    <section id="how" className="px-5 py-20 md:py-28 bg-paper-alt">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent mb-3">
            {t("how.eyebrow")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">
            {t("how.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {steps.map((s, i) => {
            const Icon = icons[i] ?? PenLine;
            return (
              <div
                key={i}
                className="group reveal"
                data-reveal
                data-reveal-delay={`${i * 100}`}
              >
                <div className="relative mb-6 aspect-[4/3] rounded-lg border border-border bg-background overflow-hidden text-primary/80 transition-colors group-hover:text-primary group-hover:border-accent/40">
                  <div className="absolute inset-0 p-6">
                    {stepIllustrations[i] ?? stepIllustrations[0]}
                  </div>
                  <span className="absolute top-3 right-3 font-display text-sm text-accent tracking-wider">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-background border border-border text-primary transition-colors group-hover:border-accent">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </span>
                  <h3 className="font-display text-xl text-foreground leading-snug">
                    {s.title}
                  </h3>
                </div>
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {s.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhoFor() {
  const { t } = useTranslation("landing");
  const bullets = t("who.bullets", { returnObjects: true }) as string[];
  return (
    <section className="px-5 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12 reveal" data-reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent mb-3">
            {t("who.eyebrow")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground leading-snug">
            {t("who.title")}
          </h2>
        </div>

        <ul className="space-y-5 max-w-2xl mx-auto">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-4 text-[15px] md:text-base text-foreground/85 leading-relaxed reveal"
              data-reveal
              data-reveal-delay={`${i * 80}`}
            >
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-center font-display text-xl md:text-2xl italic text-foreground reveal" data-reveal>
          {t("who.welcome")}
        </p>
      </div>
    </section>
  );
}

function ReadyCta() {
  const { t } = useTranslation("landing");
  return (
    <section className="px-5 py-20 md:py-28 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-2xl text-center reveal" data-reveal>
        <h2 className="font-display text-3xl md:text-[2.5rem] leading-tight">
          {t("cta.title")}
        </h2>
        <p className="mt-4 text-base md:text-lg text-accent">
          {t("cta.sub")}
        </p>
        <Link
          to="/auth/signup"
          className="mt-9 inline-flex items-center justify-center rounded-full bg-background text-primary font-medium text-base px-7 py-4 min-h-[52px] hover:bg-background/90 btn-press focus-ring shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]"
        >
          {t("cta.button")}
        </Link>
      </div>
    </section>
  );
}

const CrescentIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M20.5 15.5a8 8 0 1 1-6.3-13.8 9 9 0 1 0 6.3 13.8Z"
      fill="currentColor"
    />
  </svg>
);

function TrustBadges() {
  const { t } = useTranslation("landing");
  const badges = [
    {
      icon: ShieldCheck,
      label: t("trustBadges.kyc"),
    },
    {
      icon: Server,
      label: t("trustBadges.data"),
    },
    {
      icon: CrescentIcon,
      label: t("trustBadges.muslim"),
    },
  ];
  return (
    <section className="px-5 py-14 md:py-20 bg-paper-alt border-y border-border/60">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {badges.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-border bg-background px-5 py-5 md:px-6 md:py-6 reveal"
                data-reveal
                data-reveal-delay={`${i * 100}`}
              >
                <span className="inline-flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <span className="text-sm md:text-[15px] font-medium text-foreground/90 leading-snug">
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const { t } = useTranslation("landing");
  const items = t("faq.items", { returnObjects: true }) as { q: string; a: string }[];
  return (
    <section id="faq" className="px-5 py-20 md:py-28 bg-paper-alt">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent mb-3">
            {t("faq.eyebrow")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">
            {t("faq.title")}
          </h2>
        </div>

        <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
          {items.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b border-border"
            >
              <AccordionTrigger className="text-left text-[15px] md:text-base font-medium text-foreground py-5 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm md:text-[15px] text-muted-foreground leading-relaxed pb-5 pr-6">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useTranslation("landing");
  return (
    <footer className="bg-primary text-primary-foreground/70 pt-16 pb-10 px-5">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-primary-foreground/95">
              <BrandMark size={24} variant="paper" />
              <span className="font-display text-base tracking-[0.18em] uppercase">
                Mitan
              </span>
            </div>
            <p className="font-display italic text-sm text-primary-foreground/75 leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/95 mb-4">
              Product
            </p>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/#how" className="hover:text-primary-foreground transition-colors">How it works</a></li>
              <li><a href="/#who" className="hover:text-primary-foreground transition-colors">Who it's for</a></li>
              <li><a href="/#faq" className="hover:text-primary-foreground transition-colors">FAQ</a></li>
              <li><a href="/auth" className="hover:text-primary-foreground transition-colors">Get started</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/95 mb-4">
              Legal
            </p>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/privacy" className="hover:text-primary-foreground transition-colors">{t("footer.privacy")}</a></li>
              <li><a href="/terms" className="hover:text-primary-foreground transition-colors">{t("footer.terms")}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/95 mb-4">
              {t("footer.contact")}
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${t("footer.email")}`}
                  className="hover:text-primary-foreground transition-colors"
                >
                  {t("footer.email")}
                </a>
              </li>
              <li><a href="/contact" className="hover:text-primary-foreground transition-colors">Contact form</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/15 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-primary-foreground/55">
          <p>{t("footer.copyright")}</p>
          <p className="flex items-center gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-accent" />
            <span>Made with intention · Indonesia</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  useReveal();
  // Smooth scroll for in-page anchors with offset for sticky nav
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!anchor) return;
      const id = anchor.getAttribute("href")?.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <StatsHammer />
        <FounderStory />
        <HowItWorks />
        <WhoFor />
        <ReadyCta />
        <Faq />
        <TrustBadges />
      </main>
      <Footer />
      <StickyMobileCTA />
    </div>
  );
}
