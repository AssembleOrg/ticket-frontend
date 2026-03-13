"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface SearchSelectOption {
  value: string;
  label: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  className = "",
  disabled = false,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUp(spaceBelow < 220);
    }
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSearch("");
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-white/[0.08] bg-surface px-3 text-sm text-white outline-none transition-colors focus:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className={selected ? "text-white" : "text-white/30"}>
          {selected?.label ?? placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="rounded p-0.5 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div
          className={`absolute z-50 w-full rounded-lg border border-white/[0.08] bg-[#1a1a22] shadow-xl ${
            openUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <div className={`relative border-b border-white/[0.06] px-3 py-2 ${openUp ? "order-last border-b-0 border-t border-white/[0.06]" : ""}`}>
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-transparent pl-5 text-sm text-white placeholder:text-white/30 outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`flex w-full items-center px-3 py-2 text-sm transition-colors cursor-pointer ${
                    opt.value === value
                      ? "bg-neon/10 text-neon"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-white/30">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
