import { api, ApiException } from "./api";
import type { AuthUser, LoginPayload, LoginResponse } from "./types";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.data;
}

export async function logout(): Promise<void> {
  await api<null>("/auth/logout", {
    method: "POST",
  });
}

export async function getMe(): Promise<AuthUser> {
  const res = await api<AuthUser>("/auth/me");
  return res.data;
}

export { ApiException };
