import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function StickyMobileCTA() {
  const { t } = useTranslation("landing");
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      aria-hidden={!show}
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-background/95 backdrop-blur border-t border-border transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <Link
        to="/auth/signup"
        className="block w-full text-center rounded-lg bg-primary text-primary-foreground font-medium py-3.5 text-[15px] shadow-[0_8px_20px_-8px_color-mix(in_oklab,var(--primary)_45%,transparent)] ring-1 ring-accent/40 btn-press focus-ring"
      >
        {t("sticky.cta")}
      </Link>
    </div>
  );
}
