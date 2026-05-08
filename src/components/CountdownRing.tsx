import { cn } from '@/lib/utils';

interface CountdownRingProps {
  /** 0..1, 1 = full, 0 = empty */
  progress: number;
  warning?: boolean;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}

const CountdownRing = ({
  progress,
  warning = false,
  size = 220,
  stroke = 12,
  children,
}: CountdownRingProps) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = c * (1 - clamped);

  const colorClass = warning ? 'text-warning' : 'text-primary';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center',
        warning && 'animate-ring-pulse'
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          fill="none"
          opacity={0.5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn('transition-[stroke-dashoffset,stroke] duration-500 ease-linear', colorClass)}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

export default CountdownRing;
