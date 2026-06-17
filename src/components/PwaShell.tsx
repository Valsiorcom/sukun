import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff, Download, X } from "lucide-react";
import { useOnline } from "@/lib/use-online";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SESSION_KEY = "mitan-session-count";
const DISMISS_KEY = "mitan-install-dismissed";

export function PwaShell() {
  const { t } = useTranslation("landing");
  const online = useOnline();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  // Session counter (per page-load)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const n = Number(localStorage.getItem(SESSION_KEY) ?? "0") + 1;
    localStorage.setItem(SESSION_KEY, String(n));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onPrompt(e: Event) {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      setDeferred(evt);
      const sessions = Number(localStorage.getItem(SESSION_KEY) ?? "0");
      const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      if (sessions >= 3 && !dismissed) setShowInstall(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShowInstall(false);
  }
  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShowInstall(false);
  }

  return (
    <>
      {!online && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-sm flex items-center justify-center gap-2 shadow">
          <WifiOff className="w-4 h-4" />
          {t("pwa.offline")}
        </div>
      )}
      {showInstall && (
        <div className="fixed bottom-4 inset-x-4 z-50 max-w-sm mx-auto rounded-xl border border-border bg-card p-4 shadow-lg flex items-center gap-3">
          <Download className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{t("pwa.installTitle")}</p>
            <p className="text-xs text-muted-foreground">{t("pwa.installBody")}</p>
          </div>
          <Button size="sm" onClick={install}>{t("pwa.installAction")}</Button>
          <button
            onClick={dismiss}
            aria-label={t("pwa.installDismiss")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
