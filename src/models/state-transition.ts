// src/models/state-transition.ts
// FSM state progression

export interface StateTransition {
  entityId: string | number;
  entityType: string;
  currentState: string;
  nextState: string;
  trigger: string;
  transitions: {
    timestamp: string;
    from: string;
    to: string;
    reason?: string;
  }[];
  events: DomainEvent[];
}

export interface DomainEvent {
  id: string;
  timestamp: string;
  eventType: string;
  entityId: string | number;
  entityType: string;
  data: Record<string, any>;
}