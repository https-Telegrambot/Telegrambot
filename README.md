# Telegrambot - STOS V2.3.2

A **Telegram Community & Operations Platform** built on Deno, designed around strict separation of concerns, deterministic state management, and transactional reliability.

## 🎯 Overview

This is **not a traditional Telegram bot**. It's a production-ready platform for:

- 📱 **Content Management** — Draft → Preview → Published → Archive lifecycle
- 👥 **Community Management** — Member onboarding, rules, polls, forum management
- 🎫 **Customer Support** — FAQ, guides, tickets, escalation workflows
- ⏰ **Automation** — Scheduling, reminders, broadcasts, workflows
- 🔄 **Reliable Delivery** — Outbox + Queue pattern with retry & deduplication
- 🔐 **Enterprise Security** — Role-based access, audit logging, idempotency

---

## 🏗️ Architecture: Three-Layer Design

### Layer 1: Internal Engines (Intent Only)

Pure business logic — **no state mutations, no API calls**.

Each engine produces:
- `Intent` — what should happen
- `ExecutionPlan` — how to execute it
- `StateTransition` — next FSM state
- `DomainEvent` — what changed
- `OutboundIntent` — delivery instructions

**Engines:**

| Engine | Responsibility |
|--------|-----------------|
| **Content Engine** | Draft, preview, publish, archive posts & media |
| **Button Engine** | Generate all inline keyboards & navigation UI |
| **Automation Engine** | Scheduling, reminders, broadcasts, workflows |
| **Community Engine** | Member onboarding, rules, polls, forums |
| **Customer Service Engine** | FAQ, guides, tickets, escalation |
| **Delivery Engine** | Produce outbound delivery intents (no API calls) |

### Layer 2: Runtime Services (Mutation Boundary)

**The only layer allowed to change data**. Executes a fixed 13-step pipeline:

```
1.  Event Ingestion
2.  Identity Resolution
3.  Permission Validation
4.  Route Resolution
5.  Execution Planning
6.  FSM Processing
7.  State Projection
8.  KV Atomic Commit           ← MOST CRITICAL
9.  Outbox Management
10. Queue Processing
11. Delivery Worker
12. Bot API Dispatch
13. Audit Recording
```

### Layer 3: External Tools (Effects Only)

**No state mutations**. Only execute effects.

**Integrations:**
- Telegram Bot API (Channels, Groups, Forum Topics, Polls, optional Payments)
- Deno Runtime & Deno KV
- Deno KV Queue
- HTTPS Webhooks

---

## 🔄 Atomic Commit Rule (Most Important)

**Every runtime execution must commit EXACTLY FIVE categories in ONE Deno KV atomic transaction:**

```typescript
transaction.set(["state", "..."], newState);
transaction.set(["audit", "..."], logEntry);
transaction.set(["aggregates", "..."], metrics);
transaction.set(["outbox", "..."], payload);
transaction.set(["queue", "..."], workItem);
await kv.atomic().commit();
```

**Guarantees:**
- ✅ No partial updates
- ✅ Consistent state
- ✅ Reliable recovery
- ✅ Recoverability on failure

---

## 📊 Finite State Machines

The platform is driven by FSMs for all major entities:

### Content Lifecycle
```
DRAFT → PREVIEW → PUBLISHED → ARCHIVED
```

### Support Tickets
```
OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
```

### Community Members
```
PENDING → APPROVED → ACTIVE → BANNED
```

---

## 💾 Data Storage: Deno KV Hierarchy

Everything stored in **Deno KV** with strict hierarchical isolation:

```
storage/
├── system/          Global configuration
├── owner/           Owner credentials & control panel state [RESTRICTED]
├── users/           User metadata, FSM state, permissions
├── groups/          Group settings, topic maps
├── channels/        Channel records, delivery metadata
├── posts/           Drafts, scheduled, published, archived
├── community/       Join requests, rules, member logs
├── tickets/         Support tickets + full state machine
├── polls/           Polls, answers, analytics
├── topics/          Forum topic definitions
├── broadcasts/      Mass notification job definitions
├── reminders/       Per-user scheduled alerts
├── scheduler/       Master timetable index
├── audit/           IMMUTABLE operation logs
├── aggregates/      Counters, derived metrics
├── outbox/          Staged outbound payloads
├── queue/           Active delivery work items
├── locks/           Concurrency control
└── idempotency/     Already-processed markers
```

---

## 🚚 Delivery Model: Outbox + Queue Pattern

```
Intent
  ↓
Outbox (Stage)
  ↓
Queue (Order)
  ↓
Delivery Engine (Execute)
  ↓
Telegram API
```

**Features:**
- ✅ Automatic retry with exponential backoff
- ✅ Deduplication
- ✅ Delivery tracking
- ✅ Failure recovery
- ✅ Guaranteed at-least-once delivery

---

## 🔐 Security Model

- **Explicit Deno Permissions** — Fine-grained runtime control
- **Role-Based Access** — OWNER / MEMBER / GUEST
- **Permission Validation** — Before every execution
- **Idempotency Protection** — Block duplicate runs
- **Concurrency Locks** — Prevent race conditions
- **Immutable Audit Logs** — Full traceability
- **Type-Safe API** — TypeScript-first design

---

## 🦕 Deno-Native Features

Built around modern Deno capabilities:

- **`Deno.serve()`** — Webhook handling
- **`Deno.openKv()`** — Persistent KV storage
- **`Deno KV Queue`** — Background job processing
- **`AbortController`** — Request cancellation & timeouts
- **Native `fetch()`** — HTTP client
- **TypeScript-first** — Full type safety
- **Async disposal** — Resource cleanup with `Symbol.asyncDispose`

---

## 📋 End-to-End Flow

```
Owner → Control Panel
  ↓
Content Engine → Button Engine → Automation Engine
  ↓
├→ Community Engine
└→ Customer Service Engine
  ↓
Delivery Engine
  ↓
13-Step Runtime Pipeline
  ↓
Atomic KV Commit
  ↓
Outbox → Queue → Delivery Coordination
  ↓
Telegram API (Channels / Groups / Users)
  ↓
Engagement / Feedback Loop → REPUBLISH
```

---

## 🎯 Delivery Targets

Bot must be admin with correct permissions:

| Target | Features | Permissions |
|--------|----------|-------------|
| **Channels** | Broadcast, menus, keyboards, scheduled posts | `post_messages` |
| **Groups** | Welcome, rules, join requests, forums, polls, support | Full admin |
| **Users (1:1)** | FAQ, guides, tickets, reminders, payments | None required |

---

## 🚀 Getting Started

### Prerequisites

- Deno 1.x or higher
- Telegram Bot Token
- Deno Deploy account (optional, for hosting)

### Installation

```bash
deno run --allow-all src/main.ts
```

### Environment

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
OWNER_ID=your_telegram_id
WEBHOOK_URL=https://your-domain.com/webhook
```

### Running Tests

```bash
deno test --allow-all
```

---

## 📁 Project Structure

```
Telegrambot/
├── src/
│   ├── main.ts                 Entry point
│   ├── connectors/
│   │   └── deno-connector.ts   Runtime bridge
│   ├── models/
│   │   ├── intent.ts
│   │   ├── execution-plan.ts
│   │   ├── state-transition.ts
│   │   ├── outbound-intent.ts
│   │   └── mod.ts
│   ├── storage/
│   │   └── kv-schemas.ts
│   └── layers/
│       ├── 1-engines/
│       ├── 2-runtime/
│       └── 3-external/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── FSM.md
│   └── SECURITY.md
├── .github/workflows/
│   └── deno.yml
├── deno.json
├── .env.example
├── .gitignore
├── README.md
├── LICENSE
└── SECURITY.md
```

---

## 🔑 Core Concepts

### Invariants

- **Layer 1** produces *intent only* — no mutations
- **Layer 2** is the *mutation boundary* — only layer that changes state
- **Layer 3** executes *effects only* — no state changes
- **Every execution** commits exactly five categories atomically
- **Audit logs** are immutable — never modified or deleted
- **State machines** govern all major entity lifecycles

### Patterns

| Pattern | Purpose |
|---------|---------|
| **Outbox + Queue** | Reliable, deduplicated delivery |
| **Event Sourcing** | Audit trail from domain events |
| **FSM** | Explicit state transitions |
| **Atomic Transactions** | Consistency guarantees |
| **Intent-Based Engines** | Separation of concerns |
| **Permission Validation** | Security by architecture |

---

## 🤝 Contributing

Contributions welcome! Please:

1. Follow the three-layer architecture
2. Add tests for new features
3. Maintain immutability in Layer 1
4. Atomic commits in Layer 2
5. Effects only in Layer 3
6. Update documentation
7. Review SECURITY.md before contributing

---

## 📖 Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Detailed technical design
- **[API.md](./docs/API.md)** — Engine APIs and contracts
- **[FSM.md](./docs/FSM.md)** — Finite state machine definitions
- **[SECURITY.md](./SECURITY.md)** — Security model & best practices

---

## 📝 License

MIT License — see LICENSE file for details

---

## 🔗 References

- [Deno Official](https://deno.land)
- [Deno KV Documentation](https://docs.deno.com/kv/manual)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

---

**Version**: 2.3.2  
**Status**: Production-Ready  
**Last Updated**: 2026-07-04
