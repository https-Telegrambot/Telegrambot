// src/storage/kv-schemas.ts
// KV Storage schema definitions

export const KV_SCHEMAS = {
  SYSTEM: "system",
  OWNER: "owner",
  USERS: "users",
  GROUPS: "groups",
  CHANNELS: "channels",
  COMMUNITY: "community",
  POSTS: "posts",
  DRAFTS: "posts/drafts",
  SCHEDULED: "posts/scheduled",
  PUBLISHED: "posts/published",
  ARCHIVED: "posts/archived",
  TICKETS: "tickets",
  POLLS: "polls",
  TOPICS: "topics",
  BROADCASTS: "broadcasts",
  REMINDERS: "reminders",
  SCHEDULER: "scheduler",
  AUDIT: "audit",
  AGGREGATES: "aggregates",
  OUTBOX: "outbox",
  QUEUE: "queue",
  LOCKS: "locks",
  IDEMPOTENCY: "idempotency",
};

export interface UserState {
  userId: number;
  username?: string;
  role: "OWNER" | "MEMBER" | "GUEST";
  state: string;
  joinedAt: string;
  lastActive: string;
  permissions: string[];
}

export interface PostEntity {
  postId: string;
  title: string;
  content: string;
  media?: string[];
  buttons?: any[];
  status: "DRAFT" | "PREVIEW" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  publishedAt?: string;
  archivedAt?: string;
}

export interface TicketEntity {
  ticketId: string;
  userId: number;
  subject: string;
  description: string;
  status: "OPEN" | "PENDING" | "WAITING_USER" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  timestamp: string;
  sender: "user" | "owner";
  content: string;
}

export interface BroadcastJob {
  broadcastId: string;
  contentId: string;
  targetAudience: "all" | "members" | "channels";
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  statistics: {
    total: number;
    sent: number;
    failed: number;
  };
}

export interface ReminderEntity {
  reminderId: string;
  userId: number;
  message: string;
  scheduledTime: string;
  status: "pending" | "sent" | "failed";
  createdAt: string;
}