import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/page-header";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "brand" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    brand: "bg-brand-soft text-brand dark:text-brand-dark",
    success: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon size={20} />
        </span>
      </div>
    </Card>
  );
}
