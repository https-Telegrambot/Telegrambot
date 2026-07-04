// src/models/intent.ts
// Core intent model - What should happen

export interface Intent {
  id: string;
  timestamp: string;
  source: "owner" | "automation" | "community" | "support" | "user";
  type:
    | "content_publish"
    | "message_send"
    | "state_transition"
    | "broadcast"
    | "reminder"
    | "support_ticket";
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ContentIntent extends Intent {
  type: "content_publish";
  payload: {
    contentId: string;
    contentType: "post" | "page" | "menu";
    targets: ("channels" | "groups" | "users")[];
    scheduling?: {
      immediate: boolean;
      scheduledFor?: string;
    };
  };
}

export interface MessageIntent extends Intent {
  type: "message_send";
  payload: {
    chatId: number;
    userId?: number;
    text: string;
    replyMarkup?: any;
    mediaAttachment?: {
      type: "photo" | "video" | "document";
      url: string;
    };
  };
}

export interface BroadcastIntent extends Intent {
  type: "broadcast";
  payload: {
    broadcastId: string;
    contentId: string;
    targetAudience: "all" | "members" | "channels";
    retryPolicy?: {
      maxRetries: number;
      backoffSchedule: number[];
    };
  };
}

export interface ReminderIntent extends Intent {
  type: "reminder";
  payload: {
    reminderId: string;
    userId: number;
    message: string;
    scheduledTime: string;
  };
}

export interface SupportTicketIntent extends Intent {
  type: "support_ticket";
  payload: {
    ticketId: string;
    userId: number;
    subject: string;
    description: string;
  };
}