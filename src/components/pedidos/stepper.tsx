import { Check } from "lucide-react";

const STEPS = ["Cliente", "Produtos", "Quantidades/Preços", "Prazo/Condição", "Revisão"];

export function Stepper({ current }: { current: number }) {
  return (
    <div className="mb-6 flex items-center overflow-x-auto pb-1">
      {STEPS.map((label, idx) => {
        const step = idx + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex shrink-0 items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-success text-white"
                    : active
                      ? "bg-brand text-white"
                      : "bg-black/10 text-muted dark:bg-white/10"
                }`}
              >
                {done ? <Check size={14} /> : step}
              </div>
              <span
                className={`whitespace-nowrap text-sm font-medium ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                {label}
              </span>
            </div>
            {step < STEPS.length && (
              <div className="mx-3 h-px w-8 shrink-0 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
