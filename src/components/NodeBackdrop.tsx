/**
 * Subtle node + connections backdrop. Inspired by the molecular nodes
 * inside the PerceptIA hummingbird's wing. Pure SVG, no animation cost.
 */
export function NodeBackdrop({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 600"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="nb-glow" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="oklch(0.55 0.20 305)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="oklch(1 0 0)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#nb-glow)" />
      <g
        stroke="oklch(0.38 0.16 305)"
        strokeWidth="1"
        strokeOpacity="0.18"
        fill="none"
      >
        <line x1="120" y1="80" x2="280" y2="180" />
        <line x1="280" y1="180" x2="420" y2="120" />
        <line x1="420" y1="120" x2="560" y2="220" />
        <line x1="560" y1="220" x2="700" y2="160" />
        <line x1="280" y1="180" x2="340" y2="340" />
        <line x1="340" y1="340" x2="500" y2="400" />
        <line x1="500" y1="400" x2="640" y2="360" />
        <line x1="120" y1="80" x2="180" y2="260" />
        <line x1="180" y1="260" x2="340" y2="340" />
      </g>
      <g fill="oklch(0.38 0.16 305)" fillOpacity="0.32">
        {[
          [120, 80], [280, 180], [420, 120], [560, 220], [700, 160],
          [180, 260], [340, 340], [500, 400], [640, 360],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 4 : 2.5} />
        ))}
      </g>
    </svg>
  );
}
