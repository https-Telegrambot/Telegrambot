# Security Policy

## 🔐 Security Overview

Telegrambot is built with **security-first** principles. This document outlines security practices, vulnerability reporting, and security features.

---

## 🛡️ Security Features

### 1. **Role-Based Access Control (RBAC)**

Three-tier permission model:

```
OWNER    → Full platform control, admin panel access
MEMBER   → Community participation, limited actions
GUEST    → Read-only access, no mutations
```

### 2. **Permission Validation**

Every operation validates permissions before execution:

```typescript
// Step 3: Permission Validation (13-step pipeline)
if (!actor.permissions.includes("content_publish")) {
  throw new PermissionError("Unauthorized");
}
```

### 3. **Atomic Transactions**

All state changes are atomic:

```typescript
// Guaranteed: All-or-nothing commit
atomic.set(["state", ...], newState);
atomic.set(["audit", ...], logEntry);
atomic.set(["aggregates", ...], metrics);
atomic.set(["outbox", ...], payload);
atomic.set(["queue", ...], workItem);
await kv.atomic().commit();
```

### 4. **Immutable Audit Logs**

Every action is logged immutably:

- ✅ Timestamp of action
- ✅ Actor identity
- ✅ Operation performed
- ✅ State changes
- ✅ Outcome

**Audit logs are never modified or deleted.**

### 5. **Idempotency Protection**

Duplicate requests are blocked:

```typescript
// Step 13: Idempotency Control
const idempotencyKey = `${actor.userId}:${intent.id}`;
if (await kv.get(["idempotency", idempotencyKey])) {
  throw new DuplicateRequestError();
}
```

### 6. **Concurrency Control**

Race conditions prevented via locks:

```typescript
// Lock mechanism prevents concurrent mutations
const lockKey = ["locks", entityId];
// Only one writer at a time
```

### 7. **Input Validation**

All inputs are validated:

- ✅ Type checking (TypeScript)
- ✅ Schema validation
- ✅ Size limits
- ✅ SQL injection prevention
- ✅ XSS protection

### 8. **Secrets Management**

Sensitive data handling:

```bash
# Use environment variables
TELEGRAM_BOT_TOKEN=...     # Never commit
OWNER_ID=...               # Never commit
```

**Never:**
- ❌ Commit `.env` file
- ❌ Log secrets
- ❌ Store in code
- ❌ Share credentials

### 9. **Fine-Grained Deno Permissions**

Production mode uses explicit permissions:

```bash
# NOT: deno run --allow-all main.ts

# YES: deno run \
  --allow-env=TELEGRAM_BOT_TOKEN,OWNER_ID,WEBHOOK_URL \
  --allow-net=api.telegram.org \
  --allow-read=database \
  --allow-write=database \
  src/main.ts
```

### 10. **Webhook Secret Validation**

Webhook validation with Telegram signatures:

```typescript
// Verify X-Telegram-Bot-Api-Secret-Token header
const token = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
if (token !== WEBHOOK_SECRET) {
  return new Response("Unauthorized", { status: 401 });
}
```

---

## 📋 Secure Development Guidelines

### Before Committing

- ✅ No secrets in code
- ✅ No hardcoded passwords
- ✅ No API keys
- ✅ No private data
- ✅ No sensitive logs

### Code Review

All pull requests must:

- ✅ Pass security checks
- ✅ Include security.md updates if relevant
- ✅ Have audit trail tests
- ✅ Follow RBAC patterns

### Testing

Security tests included:

```bash
deno test --allow-all tests/security/
```

Topics:
- Permission validation
- Input sanitization
- Idempotency
- Audit trail integrity

---

## 🚨 Vulnerability Reporting

### Do NOT Create Public Issues

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. **Do NOT** post on social media
3. **Do NOT** share with others

### Report Process

1. Email: `security@telegrambot.dev` (when available)
2. Include:
   - Vulnerability description
   - Steps to reproduce
   - Affected versions
   - Your contact info

3. We will:
   - Acknowledge within 48 hours
   - Investigate immediately
   - Create fix in private branch
   - Request CVE if needed
   - Publish security advisory
   - Credit you (if desired)

### Response Timeline

- **48 hours**: Initial acknowledgment
- **7 days**: Security assessment
- **14 days**: Fix development
- **21 days**: Public disclosure (coordinated)

---

## 🔒 Dependency Security

### Scanning

Dependencies are scanned via:

- ✅ `deno.land` official registry
- ✅ GitHub Dependabot
- ✅ Manual audits
- ✅ Supply chain checks

### Updates

Security patches applied:

- ✅ Critical: Within 24 hours
- ✅ High: Within 7 days
- ✅ Medium: Within 30 days
- ✅ Low: Next release cycle

---

## 🔑 Secret Management

### Environment Variables

```bash
# Create .env (never commit)
TELEGRAM_BOT_TOKEN=your_token_here
OWNER_ID=your_id_here
WEBHOOK_SECRET=random_secret_here
```

### Deno Deploy Secrets

For production on Deno Deploy:

```bash
# Set via Deno Deploy dashboard
deno deploy set TELEGRAM_BOT_TOKEN=...
```

### Rotation

- ✅ Rotate tokens annually
- ✅ Rotate on team changes
- ✅ Rotate if leaked
- ✅ Log all rotations

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|----------|
| 1.0 | 2026-07-04 | Initial security policy |

---

**Last Updated**: 2026-07-04  
**Status**: Active