// src/models/execution-plan.ts
// How to execute - immutable execution instructions

export interface ExecutionPlan {
  id: string;
  intentId: string;
  timestamp: string;
  route: string;
  prerequisiteStates: Record<string, any>[];
  intendedMutations: Mutation[];
  plannedDeliveries: DeliveryPlan[];
}

export interface Mutation {
  domain: string;
  operation: "create" | "update" | "delete";
  key: string[];
  value: Record<string, any>;
}

export interface DeliveryPlan {
  id: string;
  target: "channel" | "group" | "user";
  targetId: string | number;
  messageContent: {
    text: string;
    replyMarkup?: any;
    media?: any;
  };
  priority: "high" | "normal" | "low";
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number[];
  };
}