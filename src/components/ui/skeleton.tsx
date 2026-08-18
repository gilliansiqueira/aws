export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-black/5 dark:bg-white/10 ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col gap-px">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0 md:px-6">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-4 ${c === 0 ? "w-24" : "flex-1 max-w-40"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
