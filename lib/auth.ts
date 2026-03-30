import { api, ApiException } from "./api";
import { supabase } from "./supabase";
import type { AuthUser, LoginPayload, LoginResponse } from "./types";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function loginWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function exchangeOAuthToken(
  accessToken: string,
  refreshToken: string,
): Promise<{ user: AuthUser & { name: string; role: string } }> {
  const res = await api<{ user: AuthUser & { name: string; role: string } }>(
    "/auth/oauth/exchange",
    {
      method: "POST",
      body: JSON.stringify({ accessToken, refreshToken }),
    },
  );
  return res.data;
}

export async function logout(): Promise<void> {
  await api<null>("/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<AuthUser & { name?: string; role?: string }> {
  const res = await api<AuthUser & { name?: string; role?: string }>("/auth/me");
  return res.data;
}

export { ApiException };
