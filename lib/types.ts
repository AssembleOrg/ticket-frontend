// ── Auth ──────────────────────────────────────────────

export type UserRole = "ADMIN" | "RESPONSIBLE";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── Clients ──────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  projects?: Project[];
  _count?: { projects: number };
}

export interface CreateClientPayload {
  name: string;
  phone: string;
  email: string;
  company: string;
}

// ── Projects ─────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  client?: Client;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: { tickets: number };
}

export interface CreateProjectPayload {
  name: string;
  description: string;
  clientId: string;
}

// ── Tickets ──────────────────────────────────────────

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  clientId: string;
  projectId: string;
  responsibleId?: string | null;
  client?: Client;
  project?: Project;
  responsible?: Responsible;
  comments?: Comment[];
  timeEntries?: TimeEntry[];
  attachments?: Attachment[];
  totalMinutes?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  clientId: string;
  projectId: string;
  responsibleId?: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  clientId?: string;
  projectId?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
}

export interface TicketHistory {
  id: string;
  ticketId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  createdAt: string;
}

// ── Comments ─────────────────────────────────────────

export type AuthorType = "client" | "admin";

export interface Comment {
  id: string;
  content: string;
  authorName: string;
  authorType: AuthorType;
  ticketId: string;
  createdAt: string;
}

export interface CreateCommentPayload {
  content: string;
  authorName: string;
  authorType: AuthorType;
  ticketId: string;
}

// ── Tasks ───────────────────────────────────────────

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  estimatedMinutes: number | null;
  ticketId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  ticketId: string;
}

// ── Time Entries ─────────────────────────────────────

export interface TimeEntry {
  id: string;
  minutes: number;
  description: string;
  loggedBy: string;
  ticketId: string;
  createdAt: string;
}

export interface CreateTimeEntryPayload {
  minutes: number;
  description: string;
  loggedBy: string;
  ticketId: string;
}

// ── Hour Packs ───────────────────────────────────────

export interface HourPack {
  id: string;
  clientId: string;
  weeklyHours: number;
  active: boolean;
  client?: Client;
  createdAt: string;
  updatedAt: string;
}

export interface HourPackMonth {
  id?: string;
  hourPackId?: string;
  month?: string;
  year?: number;
  baseMinutes?: number;
  carryOverMinutes: number;
  totalAvailableMinutes?: number;
  allocatedMinutes?: number;
  consumedMinutes: number;
  remainingMinutes?: number;
  isOverLimit?: boolean;
  baseHours?: number;
  carryOverHours?: number;
  totalAvailableHours?: number;
  consumedHours?: number;
  remainingHours?: number;
}

export interface HourPackStatus {
  pack?: {
    weeklyHours: number | string;
    monthlyHours: number | string;
    active?: boolean;
  };
  hourPack?: HourPack;
  currentMonth: HourPackMonth;
}

export interface HourPackAudit {
  id: string;
  hourPackId: string;
  action: string;
  changedBy: string;
  reason: string;
  previousValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  createdAt: string;
  hourPack?: HourPack & { client?: Client };
}

// ── Attachments ──────────────────────────────────────

export interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  ticketId: string;
  uploadedBy: string;
  createdAt: string;
  url: string | null;
}

export interface AttachmentUrl {
  url: string;
  attachment: Attachment;
}

// ── Responsibles ────────────────────────────────────

export interface Responsible {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResponsiblePayload {
  name: string;
}

// ── Receipts ───────────────────────────────────────

export type ReceiptStatus = "ACTIVE" | "VOIDED";

export interface ReceiptItem {
  quantity: number;
  code: string;
  description: string;
  unitPrice: number;
  taxPercent: number;
  discountPercent: number;
}

export interface Receipt {
  id: string;
  receiptNumber: number;
  status: ReceiptStatus;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  paymentDate: string;
  paymentMethod: string;
  clientName: string;
  items: ReceiptItem[];
  subtotal: number;
  discounts: number;
  taxTotal: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateReceiptPayload {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  paymentDate: string;
  paymentMethod: string;
  clientName: string;
  items: ReceiptItem[];
}

// ── Wiki ──────────────────────────────────────────

export interface WikiPage {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WikiNode {
  id: string;
  title: string;
  tags: string[];
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWikiPagePayload {
  title: string;
  content?: string;
  tags?: string[];
}

// ── Vault ─────────────────────────────────────────

export interface VaultEntry {
  id: string;
  label: string;
  username: string | null;
  password: string;
  url: string | null;
  notes: string | null;
  clientId: string | null;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaultEntryPayload {
  label: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  clientId?: string;
  projectId?: string;
}

// ── Board Cards ───────────────────────────────────

export type BoardColumn = "TODO" | "IN_PROGRESS" | "DONE";

export interface BoardCard {
  id: string;
  title: string;
  description: string | null;
  column: BoardColumn;
  color: string | null;
  dueDate: string | null;
  position: number;
  responsibleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardCardPayload {
  title: string;
  description?: string;
  column?: BoardColumn;
  color?: string;
  dueDate?: string;
  position?: number;
  responsibleId: string;
}

// ── Notifications ─────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  resourceId: string | null;
  resourceType: string | null;
  read: boolean;
  createdAt: string;
}
