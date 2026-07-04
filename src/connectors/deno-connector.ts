// src/connectors/deno-connector.ts
// STOS V2.3.2 Deno Connector - Runtime Bridge

import { EventEmitter } from "https://deno.land/std@0.208.0/node/events.ts";
import type {
  Intent,
  ExecutionPlan,
  StateTransition,
  DomainEvent,
  OutboundIntent,
} from "../models/mod.ts";

export class DenoConnector extends EventEmitter {
  private kv: Deno.Kv | null = null;
  private server: Deno.HttpServer | null = null;
  private abortController: AbortController | null = null;
  private config: DenoConnectorConfig;

  constructor(config: DenoConnectorConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.kv = await Deno.openKv(this.config.kvPath);
      console.log("✅ Deno KV initialized");

      this.abortController = new AbortController();
      this.server = await this.startWebhookServer();
      console.log(
        `✅ Webhook server started on ${this.config.webhookHost}:${this.config.webhookPort}`
      );

      this.emit("initialized");
    } catch (error) {
      console.error("❌ Connector initialization failed:", error);
      throw error;
    }
  }

  private async startWebhookServer(): Promise<Deno.HttpServer> {
    return await Deno.serve({
      hostname: this.config.webhookHost,
      port: this.config.webhookPort,
      signal: this.abortController!.signal,
      onListen: () => {
        this.emit("server:listening", {
          host: this.config.webhookHost,
          port: this.config.webhookPort,
        });
      },
      handler: async (req: Request) => {
        return await this.handleWebhookRequest(req);
      },
    });
  }

  private async handleWebhookRequest(req: Request): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (this.config.webhookSecret) {
      const token = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (token !== this.config.webhookSecret) {
        console.warn("⚠️  Unauthorized webhook request");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    try {
      const body = await req.json();
      this.emit("update:raw", body);
      await this.processPipeline(body);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500 }
      );
    }
  }

  private async processPipeline(update: any): Promise<void> {
    this.emit("pipeline:start");
    try {
      const ingestedEvent = this.stepEventIngestion(update);
      this.emit("step:1-ingestion", ingestedEvent);

      const actor = await this.stepIdentityResolution(ingestedEvent);
      this.emit("step:2-identity", actor);

      const permissions = await this.stepPermissionValidation(actor);
      this.emit("step:3-permissions", permissions);

      const route = await this.stepRouteResolution(ingestedEvent, permissions);
      this.emit("step:4-route", route);

      const executionPlan = await this.stepExecutionPlanning(
        ingestedEvent,
        route
      );
      this.emit("step:5-planning", executionPlan);

      const stateTransition = await this.stepFSMProcessing(
        executionPlan,
        actor
      );
      this.emit("step:6-fsm", stateTransition);

      const projection = await this.stepStateProjection(stateTransition);
      this.emit("step:7-projection", projection);

      const commitResult = await this.stepAtomicCommit(
        ingestedEvent,
        stateTransition,
        projection
      );
      this.emit("step:8-commit", commitResult);

      const outboxEntries = await this.stepOutboxManagement(projection);
      this.emit("step:9-outbox", outboxEntries);

      const queueItems = await this.stepQueueProcessing(outboxEntries);
      this.emit("step:10-queue", queueItems);

      await this.stepDeliveryWorker(queueItems);
      this.emit("step:11-delivery");

      const deliveryResults = await this.stepBotAPIDispatch(queueItems);
      this.emit("step:12-dispatch", deliveryResults);

      await this.stepAuditRecording(ingestedEvent, deliveryResults);
      this.emit("step:13-audit");

      this.emit("pipeline:complete", { success: true });
    } catch (error) {
      this.emit("pipeline:error", error);
      throw error;
    }
  }

  private stepEventIngestion(update: any): any {
    return {
      timestamp: new Date().toISOString(),
      updateId: update.update_id,
      message: update.message || null,
      callbackQuery: update.callback_query || null,
      rawUpdate: update,
    };
  }

  private async stepIdentityResolution(event: any): Promise<any> {
    const userId =
      event.message?.from?.id || event.callbackQuery?.from?.id;
    const chatId = event.message?.chat?.id || event.callbackQuery?.message?.chat?.id;

    if (!userId) throw new Error("Cannot resolve user identity");

    const userKey = ["users", userId.toString()];
    const userRecord = await this.getFromKv(userKey);

    return {
      userId,
      chatId,
      userRecord: userRecord || null,
      isOwner: userId === this.config.ownerId,
    };
  }

  private async stepPermissionValidation(actor: any): Promise<any> {
    if (actor.isOwner) {
      return { role: "OWNER", allowed: true };
    }

    const memberKey = ["community", "members", actor.userId.toString()];
    const memberRecord = await this.getFromKv(memberKey);

    if (memberRecord?.status === "ACTIVE") {
      return { role: "MEMBER", allowed: true };
    }

    return { role: "GUEST", allowed: false };
  }

  private async stepRouteResolution(event: any, permissions: any): Promise<any> {
    const callbackData = event.callbackQuery?.data;
    const messageText = event.message?.text;

    let route = "default";
    if (callbackData?.startsWith("content:")) {
      route = "content_handler";
    } else if (messageText?.startsWith("/")) {
      route = "command_handler";
    } else if (callbackData?.startsWith("support:")) {
      route = "support_handler";
    }

    return { route, callbackData, messageText, permissions };
  }

  private async stepExecutionPlanning(event: any, route: any): Promise<any> {
    return {
      route: route.route,
      eventData: event,
      prerequisiteStates: [],
      intendedMutations: [],
      plannedDeliveries: [],
    };
  }

  private async stepFSMProcessing(
    plan: any,
    actor: any
  ): Promise<StateTransition> {
    return {
      entityId: actor.userId,
      entityType: "user",
      currentState: actor.userRecord?.state || "initial",
      nextState: "processed",
      trigger: "message_received",
      transitions: [],
      events: [],
    };
  }

  private async stepStateProjection(transition: StateTransition): Promise<any> {
    return {
      state: {
        key: ["users", transition.entityId.toString()],
        value: { state: transition.nextState, entityType: transition.entityType },
      },
      audit: {
        key: ["audit", Date.now().toString()],
        value: { transition },
      },
      aggregates: {
        key: ["aggregates", "user_states"],
        value: { updated: new Date().toISOString() },
      },
      outbox: {
        key: ["outbox", transition.entityId.toString()],
        value: { intent: "send_message" },
      },
      queue: {
        key: ["queue", Date.now().toString()],
        value: { delivery: "pending" },
      },
    };
  }

  private async stepAtomicCommit(
    event: any,
    transition: StateTransition,
    projection: any
  ): Promise<any> {
    if (!this.kv) throw new Error("KV not initialized");

    try {
      const atomic = this.kv.atomic();
      atomic.set(projection.state.key, projection.state.value);
      atomic.set(projection.audit.key, projection.audit.value);
      atomic.set(projection.aggregates.key, projection.aggregates.value);
      atomic.set(projection.outbox.key, projection.outbox.value);
      atomic.set(projection.queue.key, projection.queue.value);

      const result = await atomic.commit();

      return {
        success: true,
        versionstamp: result.versionstamp,
      };
    } catch (error) {
      throw new Error(`Atomic commit failed: ${error.message}`);
    }
  }

  private async stepOutboxManagement(projection: any): Promise<any[]> {
    const outboxKeys = await this.listKvKeys(["outbox"]);
    const entries = [];

    for (const key of outboxKeys) {
      const value = await this.getFromKv(key);
      if (value) entries.push({ key, value });
    }

    return entries;
  }

  private async stepQueueProcessing(outboxEntries: any[]): Promise<any[]> {
    return outboxEntries.map((entry) => ({
      id: crypto.randomUUID(),
      payload: entry.value,
      status: "pending",
      retries: 0,
      createdAt: new Date().toISOString(),
    }));
  }

  private async stepDeliveryWorker(queueItems: any[]): Promise<void> {
    // Workers process items here
  }

  private async stepBotAPIDispatch(queueItems: any[]): Promise<any[]> {
    const results = [];

    for (const item of queueItems) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${this.config.botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
            signal: AbortSignal.timeout(this.config.requestTimeout),
          }
        );

        results.push({
          itemId: item.id,
          success: response.ok,
          statusCode: response.status,
        });
      } catch (error) {
        results.push({
          itemId: item.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async stepAuditRecording(
    event: any,
    deliveryResults: any
  ): Promise<void> {
    const auditKey = ["audit", `delivery-${Date.now()}`];
    const auditLog = {
      timestamp: new Date().toISOString(),
      updateId: event.updateId,
      deliveryResults,
    };

    await this.setInKv(auditKey, auditLog);
  }

  async getFromKv(key: string[]): Promise<any> {
    if (!this.kv) throw new Error("KV not initialized");
    const result = await this.kv.get(key);
    return result.value;
  }

  async setInKv(key: string[], value: any): Promise<void> {
    if (!this.kv) throw new Error("KV not initialized");
    await this.kv.set(key, value);
  }

  async listKvKeys(prefix: string[]): Promise<string[][]> {
    if (!this.kv) throw new Error("KV not initialized");
    const keys: string[][] = [];
    for await (const entry of this.kv.list({ prefix })) {
      keys.push(entry.key as string[]);
    }
    return keys;
  }

  async shutdown(): Promise<void> {
    console.log("🛑 Shutting down Deno Connector...");
    if (this.server) {
      this.abortController?.abort();
    }
    if (this.kv) {
      this.kv.close();
    }
    this.emit("shutdown:complete");
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.shutdown();
  }

  getKv(): Deno.Kv | null {
    return this.kv;
  }
}

export interface DenoConnectorConfig {
  webhookHost: string;
  webhookPort: number;
  webhookUrl: string;
  webhookSecret?: string;
  kvPath?: string;
  ownerId: number;
  botToken: string;
  requestTimeout?: number;
  environment?: string;
  logLevel?: string;
}

export default DenoConnector;