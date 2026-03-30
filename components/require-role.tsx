"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";

interface RequireRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role && !roles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, loading, roles, router]);

  if (loading) return null;
  if (!user?.role || !roles.includes(user.role)) return null;

  return <>{children}</>;
}
