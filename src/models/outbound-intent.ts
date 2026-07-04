// src/models/outbound-intent.ts
// Ready-to-send delivery instructions

export interface OutboundIntent {
  id: string;
  timestamp: string;
  source: string;
  deliveryTarget: {
    type: "channel" | "group" | "user" | "callback";
    id: string | number;
  };
  payload: {
    method: "sendMessage" | "editMessage" | "sendPhoto" | "sendVideo" | "editReplyMarkup";
    params: Record<string, any>;
  };
  status: "pending" | "queued" | "sent" | "failed";
  retries: number;
  nextRetry?: string;
  metadata?: Record<string, any>;
}