"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { exchangeOAuthToken } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase stores the session after OAuth redirect
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data.session) {
          setError("No se pudo obtener la sesión. Intentá de nuevo.");
          return;
        }

        const { access_token, refresh_token } = data.session;

        // Exchange with our backend to set httpOnly cookies + validate whitelist
        await exchangeOAuthToken(access_token, refresh_token);

        router.replace("/dashboard");
      } catch (err: any) {
        const message = err?.message ?? "Error al iniciar sesión";
        if (message.includes("not authorized")) {
          setError("Tu email no está autorizado para acceder al sistema.");
        } else {
          setError(message);
        }
      }
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <span className="text-2xl">!</span>
          </div>
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-neon hover:underline"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-neon animate-spin" />
        <p className="text-sm text-white/40">Iniciando sesión...</p>
      </div>
    </div>
  );
}
