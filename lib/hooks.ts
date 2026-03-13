"use client";

import useSWR, { SWRConfiguration } from "swr";
import { api, type ApiResponse, type PaginationMeta } from "./api";
import type {
  Client,
  Project,
  Ticket,
  TicketFilters,
  Comment,
  Attachment,
  HourPack,
  HourPackStatus,
  HourPackAudit,
  Responsible,
} from "./types";
import { buildQuery } from "./api";

// ── Dashboard ───────────────────────────────────────

export interface DashboardStats {
  openTickets: number;
  closedTickets: number;
  totalClients: number;
  consumedHoursThisMonth: number;
  recentTickets: Ticket[];
  hourPacks: {
    clientId: string;
    clientName: string;
    weeklyHours: number;
    monthlyHours: number;
    consumedMinutes: number;
    totalAvailableMinutes: number;
    remainingMinutes: number;
    percentage: number;
  }[];
}

// ── Generic fetcher ──────────────────────────────────

async function fetcher<T>(path: string): Promise<ApiResponse<T>> {
  return api<T>(path);
}

interface UsePaginatedResult<T> {
  data: T[] | undefined;
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => void;
}

function usePaginated<T>(
  path: string | null,
  config?: SWRConfiguration,
): UsePaginatedResult<T> {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<T[]>>(
    path,
    fetcher<T[]>,
    config,
  );

  return {
    data: data?.data,
    pagination: data?.meta.pagination,
    isLoading,
    error,
    mutate,
  };
}

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<DashboardStats>>(
    "/dashboard/stats",
    fetcher<DashboardStats>,
  );
  return { stats: data?.data, isLoading, error, mutate };
}

// ── Clients ──────────────────────────────────────────

export function useClients(params?: { page?: number; limit?: number }) {
  return usePaginated<Client>(`/clients${buildQuery(params ?? {})}`);
}

export function useClient(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Client>>(
    id ? `/clients/${id}` : null,
    fetcher<Client>,
  );
  return { client: data?.data, isLoading, error, mutate };
}

// ── Projects ─────────────────────────────────────────

export function useProjects(params?: { page?: number; limit?: number }) {
  return usePaginated<Project>(`/projects${buildQuery(params ?? {})}`);
}

export function useProjectsByClient(clientId: string | undefined) {
  return usePaginated<Project>(
    clientId ? `/projects/by-client/${clientId}` : null,
  );
}

// ── Tickets ──────────────────────────────────────────

export function useTickets(filters?: TicketFilters) {
  return usePaginated<Ticket>(
    `/tickets${buildQuery(filters as Record<string, string | number | undefined> ?? {})}`,
  );
}

export function useTicket(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Ticket>>(
    id ? `/tickets/${id}` : null,
    fetcher<Ticket>,
  );
  return { ticket: data?.data, isLoading, error, mutate };
}

// ── Comments ─────────────────────────────────────────

export function useComments(ticketId: string | undefined) {
  return usePaginated<Comment>(
    ticketId ? `/comments/by-ticket/${ticketId}` : null,
  );
}

// ── Attachments ──────────────────────────────────────

export function useAttachments(ticketId: string | undefined) {
  return usePaginated<Attachment>(
    ticketId ? `/attachments/by-ticket/${ticketId}` : null,
  );
}

// ── Hour Packs ───────────────────────────────────────

export function useHourPackByClient(clientId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<HourPack>>(
    clientId ? `/hour-packs/by-client/${clientId}` : null,
    fetcher<HourPack>,
  );
  return { hourPack: data?.data, isLoading, error, mutate };
}

export function useHourPackStatus(clientId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<HourPackStatus>>(
    clientId ? `/hour-packs/by-client/${clientId}/status` : null,
    fetcher<HourPackStatus>,
  );
  return { status: data?.data, isLoading, error, mutate };
}

// ── Audits ──────────────────────────────────────────

export function useHourPackAudits(params?: { page?: number; limit?: number }) {
  return usePaginated<HourPackAudit>(`/hour-packs/audits${buildQuery(params ?? {})}`);
}

// ── Responsibles ────────────────────────────────────

export function useResponsibles(params?: { page?: number; limit?: number }) {
  return usePaginated<Responsible>(`/responsibles${buildQuery(params ?? {})}`);
}
