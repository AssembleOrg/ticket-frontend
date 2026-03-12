interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export function ProgressBar({ value, max, className = "" }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color =
    pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : "bg-neon";

  return (
    <div className={`h-1.5 w-full rounded-full bg-white/10 ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
