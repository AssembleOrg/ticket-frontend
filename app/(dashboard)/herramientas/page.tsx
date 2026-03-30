"use client";

import { useState, useCallback } from "react";
import { Copy, RefreshCw, Check, Key, Shield } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiado al portapapeles");
}

// ── Password Generator ──────────────────────────────

const CHARS_LOWER = "abcdefghijklmnopqrstuvwxyz";
const CHARS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARS_NUMBERS = "0123456789";
const CHARS_SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function generatePassword(
  length: number,
  options: { upper: boolean; numbers: boolean; symbols: boolean },
): string {
  let chars = CHARS_LOWER;
  if (options.upper) chars += CHARS_UPPER;
  if (options.numbers) chars += CHARS_NUMBERS;
  if (options.symbols) chars += CHARS_SYMBOLS;

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}

function PasswordGenerator() {
  const [length, setLength] = useState(24);
  const [upper, setUpper] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState(() =>
    generatePassword(24, { upper: true, numbers: true, symbols: true }),
  );

  const regenerate = useCallback(() => {
    setPassword(generatePassword(length, { upper, numbers, symbols }));
  }, [length, upper, numbers, symbols]);

  return (
    <Card>
      <CardHeader title="Generador de Contraseñas" />
      <div className="flex flex-col gap-4 px-5 pb-5">
        {/* Output */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-white/8 bg-white/3 px-4 py-3 font-mono text-sm text-neon break-all select-all">
            {password}
          </div>
          <button
            onClick={() => copyToClipboard(password)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={regenerate}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Length */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-white/40 w-20">Largo</label>
          <input
            type="range"
            min={8}
            max={128}
            value={length}
            onChange={(e) => {
              setLength(parseInt(e.target.value));
              setPassword(generatePassword(parseInt(e.target.value), { upper, numbers, symbols }));
            }}
            className="flex-1 accent-[#b4f636]"
          />
          <span className="text-sm font-mono text-white w-8 text-right">{length}</span>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Mayúsculas", checked: upper, onChange: (v: boolean) => { setUpper(v); setPassword(generatePassword(length, { upper: v, numbers, symbols })); } },
            { label: "Números", checked: numbers, onChange: (v: boolean) => { setNumbers(v); setPassword(generatePassword(length, { upper, numbers: v, symbols })); } },
            { label: "Símbolos", checked: symbols, onChange: (v: boolean) => { setSymbols(v); setPassword(generatePassword(length, { upper, numbers, symbols: v })); } },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => opt.onChange(!opt.checked)}
                className={`flex h-5 w-5 items-center justify-center rounded border transition-colors cursor-pointer ${
                  opt.checked ? "border-neon bg-neon/20" : "border-white/15 bg-white/5"
                }`}
              >
                {opt.checked && <Check className="h-3 w-3 text-neon" />}
              </div>
              <span className="text-sm text-white/60">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── JWT Generator ───────────────────────────────────

function generateJwtSecret(bytes: number): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function JwtGenerator() {
  const [bytes, setBytes] = useState(512);
  const [secret, setSecret] = useState(() => generateJwtSecret(512));
  const [format, setFormat] = useState<"hex" | "base64">("hex");

  function regenerate() {
    setSecret(generateJwtSecret(bytes));
  }

  function getFormatted(): string {
    if (format === "base64") {
      // Convert hex string to base64
      const hexBytes = secret.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [];
      return btoa(String.fromCharCode(...hexBytes));
    }
    return secret;
  }

  return (
    <Card>
      <CardHeader title="Generador de JWT Secret" />
      <div className="flex flex-col gap-4 px-5 pb-5">
        {/* Output */}
        <div className="flex items-start gap-2">
          <div className="flex-1 rounded-lg border border-white/8 bg-white/3 px-4 py-3 font-mono text-xs text-neon break-all select-all max-h-32 overflow-y-auto">
            {getFormatted()}
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => copyToClipboard(getFormatted())}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={regenerate}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Bytes selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/40">Bytes</label>
            <select
              value={bytes}
              onChange={(e) => {
                const b = parseInt(e.target.value);
                setBytes(b);
                setSecret(generateJwtSecret(b));
              }}
              className="h-9 rounded-lg border border-white/8 bg-white/5 px-3 text-sm text-white outline-none [color-scheme:dark]"
            >
              {[32, 64, 128, 256, 512].map((b) => (
                <option key={b} value={b} className="bg-[#111117] text-white">{b} bytes</option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/40">Formato</label>
            <div className="flex rounded-lg border border-white/8 overflow-hidden">
              <button
                onClick={() => setFormat("hex")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${format === "hex" ? "bg-neon/15 text-neon" : "bg-white/5 text-white/40 hover:text-white/60"}`}
              >
                HEX
              </button>
              <button
                onClick={() => setFormat("base64")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${format === "base64" ? "bg-neon/15 text-neon" : "bg-white/5 text-white/40 hover:text-white/60"}`}
              >
                Base64
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-white/20">
          {bytes * 8} bits · {getFormatted().length} caracteres ({format})
        </p>
      </div>
    </Card>
  );
}

// ── Page ────────────────────────────────────────────

export default function HerramientasPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Herramientas"
        subtitle="Utilidades para el equipo"
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PasswordGenerator />
        <JwtGenerator />
      </div>
    </div>
  );
}
