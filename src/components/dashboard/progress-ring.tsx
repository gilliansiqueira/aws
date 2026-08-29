export function ProgressRing({
  percent,
  label,
  sublabel,
}: {
  percent: number;
  label: string;
  sublabel: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <svg width="104" height="104" viewBox="0 0 104 104" className="shrink-0 -rotate-90">
        <circle
          cx="52"
          cy="52"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
        />
        <circle
          cx="52"
          cy="52"
          r={radius}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x="52"
          y="52"
          textAnchor="middle"
          dominantBaseline="central"
          transform="rotate(90 52 52)"
          className="fill-foreground text-xl font-semibold"
        >
          {Math.round(clamped)}%
        </text>
      </svg>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted">{sublabel}</p>
      </div>
    </div>
  );
}
