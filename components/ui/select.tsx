"use client";

import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  className = "",
  label,
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <span className="text-sm font-medium text-white/70">{label}</span>
      ) : null}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-surface pl-3 pr-9 text-sm text-white outline-none transition-colors focus:border-white/20 cursor-pointer [&>option]:bg-[#1a1a22] [&>option]:text-white"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      </div>
    </div>
  );
}
