import { api, apiUpload, buildQuery } from "./api";
import type {
  Client,
  CreateClientPayload,
  Project,
  CreateProjectPayload,
  Ticket,
  CreateTicketPayload,
  TicketFilters,
  TicketHistory,
  Comment,
  CreateCommentPayload,
  TimeEntry,
  CreateTimeEntryPayload,
  HourPack,
  HourPackStatus,
  HourPackMonth,
  HourPackAudit,
  Attachment,
  AttachmentUrl,
  Responsible,
  CreateResponsiblePayload,
} from "./types";

// ── Clients ──────────────────────────────────────────

export const clientsService = {
  list: (params?: { page?: number; limit?: number }) =>
    api<Client[]>(`/clients${buildQuery(params ?? {})}`),
  get: (id: string) => api<Client>(`/clients/${id}`),
  create: (data: CreateClientPayload) =>
    api<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateClientPayload>) =>
    api<Client>(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/clients/${id}`, { method: "DELETE" }),
};

// ── Projects ─────────────────────────────────────────

export const projectsService = {
  list: (params?: { page?: number; limit?: number }) =>
    api<Project[]>(`/projects${buildQuery(params ?? {})}`),
  getByClient: (clientId: string) =>
    api<Project[]>(`/projects/by-client/${clientId}`),
  get: (id: string) => api<Project>(`/projects/${id}`),
  create: (data: CreateProjectPayload) =>
    api<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateProjectPayload>) =>
    api<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/projects/${id}`, { method: "DELETE" }),
};

// ── Tickets ──────────────────────────────────────────

export const ticketsService = {
  list: (filters?: TicketFilters) =>
    api<Ticket[]>(`/tickets${buildQuery(filters as Record<string, string | number | undefined> ?? {})}`),
  get: (id: string) => api<Ticket>(`/tickets/${id}`),
  getByCode: (code: string) => api<Ticket>(`/tickets/code/${code}`),
  create: (data: CreateTicketPayload) =>
    api<Ticket>("/tickets", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateTicketPayload & { status: string }>) =>
    api<Ticket>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/tickets/${id}`, { method: "DELETE" }),
  history: (id: string) =>
    api<TicketHistory[]>(`/tickets/${id}/history`),
};

// ── Comments ─────────────────────────────────────────

export const commentsService = {
  getByTicket: (ticketId: string, params?: { page?: number; limit?: number }) =>
    api<Comment[]>(`/comments/by-ticket/${ticketId}${buildQuery(params ?? {})}`),
  create: (data: CreateCommentPayload) =>
    api<Comment>("/comments", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/comments/${id}`, { method: "DELETE" }),
};

// ── Time Entries ─────────────────────────────────────

export const timeEntriesService = {
  getByTicket: (ticketId: string) =>
    api<TimeEntry[]>(`/time-entries/by-ticket/${ticketId}`),
  create: (data: CreateTimeEntryPayload) =>
    api<TimeEntry>("/time-entries", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/time-entries/${id}`, { method: "DELETE" }),
};

// ── Hour Packs ───────────────────────────────────────

export const hourPacksService = {
  getByClient: (clientId: string) =>
    api<HourPack>(`/hour-packs/by-client/${clientId}`),
  getStatus: (clientId: string) =>
    api<HourPackStatus>(`/hour-packs/by-client/${clientId}/status`),
  get: (id: string) => api<HourPack>(`/hour-packs/${id}`),
  getMonths: (id: string) =>
    api<HourPackMonth[]>(`/hour-packs/${id}/months`),
  getAudits: (id: string) =>
    api<HourPackAudit[]>(`/hour-packs/${id}/audits`),
  getAllAudits: (params?: { page?: number; limit?: number }) =>
    api<HourPackAudit[]>(`/hour-packs/audits${buildQuery(params ?? {})}`),
  create: (data: { clientId: string; weeklyHours: number }) =>
    api<HourPack>("/hour-packs", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: string,
    data: { weeklyHours?: number; active?: boolean; reason: string; changedBy: string },
  ) =>
    api<HourPack>(`/hour-packs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ── Attachments ──────────────────────────────────────

export const attachmentsService = {
  getByTicket: (ticketId: string, params?: { page?: number; limit?: number }) =>
    api<Attachment[]>(`/attachments/by-ticket/${ticketId}${buildQuery(params ?? {})}`),
  upload: (file: File, ticketId: string, uploadedBy?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ticketId", ticketId);
    if (uploadedBy) formData.append("uploadedBy", uploadedBy);
    return apiUpload<Attachment>("/attachments/upload", formData);
  },
  getUrl: (id: string) =>
    api<AttachmentUrl>(`/attachments/${id}/url`),
  delete: (id: string) =>
    api<void>(`/attachments/${id}`, { method: "DELETE" }),
};

// ── Responsibles ────────────────────────────────────

export const responsiblesService = {
  list: (params?: { page?: number; limit?: number }) =>
    api<Responsible[]>(`/responsibles${buildQuery(params ?? {})}`),
  get: (id: string) => api<Responsible>(`/responsibles/${id}`),
  create: (data: CreateResponsiblePayload) =>
    api<Responsible>("/responsibles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateResponsiblePayload>) =>
    api<Responsible>(`/responsibles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/responsibles/${id}`, { method: "DELETE" }),
};
