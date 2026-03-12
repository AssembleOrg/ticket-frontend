"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, ApiException } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Completá todos los campos");
      return;
    }

    setLoading(true);

    try {
      await login({ email, password });
      toast.success("Sesión iniciada correctamente");
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiException) {
        toast.error(err.message);
      } else {
        toast.error("Error de conexión. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="Email"
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
        <LogIn className="h-4 w-4" />
        Acceder al sistema
      </Button>
    </form>
  );
}
