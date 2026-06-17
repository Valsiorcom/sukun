import { cn } from "@/lib/utils";

function initials(name: string | null | undefined): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

export function ProfileAvatar({
  name,
  size = 80,
  className,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const fontSize = Math.round(size * 0.38);
  return (
    <div
      className={cn("rounded-full flex items-center justify-center shrink-0 select-none", className)}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, #1B4332 0%, #40916C 100%)",
      }}
      aria-hidden="true"
    >
      <span
        className="font-[family-name:Playfair_Display,serif] text-white tracking-wide"
        style={{ fontSize, lineHeight: 1 }}
      >
        {initials(name)}
      </span>
    </div>
  );
}
