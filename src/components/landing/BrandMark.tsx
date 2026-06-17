type BrandMarkVariant = "emerald" | "paper" | "gold";

const variantMap: Record<BrandMarkVariant, string> = {
  emerald: "var(--primary)",
  paper: "var(--primary-foreground)",
  gold: "var(--accent)",
};

type BrandMarkProps = {
  size?: number;
  className?: string;
  /** When true, renders only the M monogram (no wordmark) */
  symbolOnly?: boolean;
  /** Semantic color variant — maps to design-system tokens */
  variant?: BrandMarkVariant;
};

/**
 * MITAN brand mark — geometric "M" monogram.
 * Two ascending strokes meeting at a centered apex, paired with a
 * single accent dot above the apex (sukun-style stillness). Monoline,
 * sharp corners, equal stroke weight — reads sharp at 16px and scales
 * cleanly to favicon, app icon, and large hero usage.
 *
 * Stroke and accent are bound to semantic tokens so the mark stays
 * consistent across every surface.
 */
export function BrandMark({
  size = 28,
  className,
  symbolOnly = true,
  variant = "emerald",
}: BrandMarkProps) {
  const stroke = variantMap[variant];
  // Accent dot is gold on the primary variant; otherwise matches stroke.
  const dot = variant === "emerald" ? variantMap.gold : stroke;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="MITAN"
      className={className}
      fill="none"
    >
      {/* M monogram: 4 strokes — left rise, inner V, right rise */}
      <path
        d="M5 26 L5 9 L16 21 L27 9 L27 26"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* sukun-style accent dot above the apex (only in symbol mode) */}
      {symbolOnly && (
        <circle cx="16" cy="4.5" r="1.6" fill={dot} />
      )}
    </svg>
  );
}

/**
 * Three-dot divider motif — uses the same dot vocabulary as the brand
 * mark accent. Drop between sections for a subtle signature rhythm.
 */
export function MarkDivider({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-2.5 py-8 ${className ?? ""}`}
      aria-hidden
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent/70" />
      <span className="w-1 h-1 rounded-full bg-accent/40" />
      <span className="w-1.5 h-1.5 rounded-full bg-accent/70" />
    </div>
  );
}
