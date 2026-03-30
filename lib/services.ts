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
  Task,
  CreateTaskPayload,
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
  Receipt,
  CreateReceiptPayload,
  WikiPage,
  WikiNode,
  CreateWikiPagePayload,
  VaultEntry,
  CreateVaultEntryPayload,
  BoardCard,
  CreateBoardCardPayload,
  Notification,
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

// ── Tasks ───────────────────────────────────────────

export const tasksService = {
  getByTicket: (ticketId: string) =>
    api<Task[]>(`/tasks/by-ticket/${ticketId}`),
  create: (data: CreateTaskPayload) =>
    api<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ title: string; description: string; status: string }>) =>
    api<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/tasks/${id}`, { method: "DELETE" }),
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

// ── Receipts ───────────────────────────────────────

export const receiptsService = {
  list: (params?: { page?: number; limit?: number }) =>
    api<Receipt[]>(`/receipts${buildQuery(params ?? {})}`),
  get: (id: string) => api<Receipt>(`/receipts/${id}`),
  getNextNumber: () => api<{ nextNumber: number }>("/receipts/next-number"),
  create: (data: CreateReceiptPayload) =>
    api<Receipt>("/receipts", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateReceiptPayload>) =>
    api<Receipt>(`/receipts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  void: (id: string) =>
    api<Receipt>(`/receipts/${id}/void`, { method: "PATCH" }),
  delete: (id: string) =>
    api<void>(`/receipts/${id}`, { method: "DELETE" }),
};

// ── Wiki ──────────────────────────────────────────

export const wikiService = {
  list: (params?: { page?: number; limit?: number }) =>
    api<WikiPage[]>(`/wiki${buildQuery(params ?? {})}`),
  nodes: () => api<WikiNode[]>("/wiki/nodes"),
  get: (id: string) => api<WikiPage>(`/wiki/${id}`),
  create: (data: CreateWikiPagePayload) =>
    api<WikiPage>("/wiki", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateWikiPagePayload>) =>
    api<WikiPage>(`/wiki/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/wiki/${id}`, { method: "DELETE" }),
};

// ── Vault ─────────────────────────────────────────

export const vaultService = {
  list: () => api<VaultEntry[]>("/vault"),
  getByClient: (clientId: string) => api<VaultEntry[]>(`/vault/by-client/${clientId}`),
  getByProject: (projectId: string) => api<VaultEntry[]>(`/vault/by-project/${projectId}`),
  create: (data: CreateVaultEntryPayload) =>
    api<VaultEntry>("/vault", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateVaultEntryPayload>) =>
    api<VaultEntry>(`/vault/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/vault/${id}`, { method: "DELETE" }),
};

// ── Board Cards ───────────────────────────────────

export const boardCardsService = {
  getByResponsible: (responsibleId: string) =>
    api<BoardCard[]>(`/board-cards/by-responsible/${responsibleId}`),
  create: (data: CreateBoardCardPayload) =>
    api<BoardCard>("/board-cards", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    api<BoardCard>(`/board-cards/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<void>(`/board-cards/${id}`, { method: "DELETE" }),
};

// ── Notifications ─────────────────────────────────

export const notificationsService = {
  list: (limit = 20) =>
    api<{ data: Notification[]; unreadCount: number }>(`/notifications?limit=${limit}`),
  markAsRead: (id: string) =>
    api<void>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllAsRead: () =>
    api<void>("/notifications/read-all", { method: "PATCH" }),
};
