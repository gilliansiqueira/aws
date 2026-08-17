"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";

export type ComboboxOption = {
  id: string;
  label: string;
  sublabel?: string;
};

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  disabled = false,
  emptyText = "Nenhum resultado encontrado",
}: {
  options: ComboboxOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = options.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sublabel ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm ${
          disabled ? "bg-black/5 dark:bg-white/5" : "cursor-text"
        }`}
        onClick={() => !disabled && setOpen(true)}
      >
        <Search size={15} className="shrink-0 text-muted" />
        <input
          disabled={disabled}
          value={open ? query : (selected?.label ?? "")}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected ? selected.label : placeholder}
          className="w-full bg-transparent outline-none disabled:cursor-not-allowed"
        />
        {selected && !open && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="shrink-0 text-muted hover:text-foreground"
            aria-label="Limpar"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={14} className="shrink-0 text-muted" />
      </div>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted">{emptyText}</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                  setQuery("");
                }}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 ${
                  o.id === value ? "bg-brand-soft font-medium" : ""
                }`}
              >
                <div>{o.label}</div>
                {o.sublabel && (
                  <div className="text-xs text-muted">{o.sublabel}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
