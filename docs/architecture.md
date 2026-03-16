# BrazaChat — System Architecture Document

> Baseado no PRD v0.4.0 (`docs/prd.md`) e Design System (`docs/braza-design-system.md`)

---

## 1. Architecture Overview

### Architecture Style: Monolith Modular

Um único serviço NestJS com módulos bem isolados, deployado como monolith. Cada módulo pode ser extraído para microservice no futuro sem rewrite.

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vercel)                        │
│  Next.js 15 · App Router · React 19 · TailwindCSS 4            │
│  shadcn/ui · Lucide · Socket.io Client · Braza Design System   │
│  Domínio: app.brazachat.com                                    │
└───────────────┬───────────────────────┬─────────────────────────┘
                │ REST API (HTTPS)      │ WebSocket (Socket.io)
                │                       │
┌───────────────▼───────────────────────▼─────────────────────────┐
│                        BACKEND (Railway)                         │
│  NestJS 11 · TypeScript · Prisma 6 · BullMQ · Socket.io        │
│  Domínio: api.brazachat.com                                     │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │   Meta   │ │ Campaigns│ │ Tracking │           │
│  │  OAuth   │ │  API     │ │  CRUD    │ │ Redirect │           │
│  │  JWT     │ │  Sync    │ │  UTMs    │ │ Cache    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ WhatsApp │ │  Inbox   │ │  Events  │ │  Orders  │           │
│  │ Webhook  │ │ WebSocket│ │  CAPI    │ │  Status  │           │
│  │ Messages │ │ Gateway  │ │  Queue   │ │  Labels  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │  Leads   │ │ Products │ │    AI    │    ┌───────────────┐   │
│  │  Funnel  │ │  CRUD    │ │ Insights │    │ Cross-Cutting │   │
│  └──────────┘ └──────────┘ └──────────┘    │ CryptoService │   │
│                                             │ TenantGuard   │   │
│                                             │ Logger (Pino) │   │
│                                             └───────────────┘   │
└───────────────┬───────────────────────┬─────────────────────────┘
                │                       │
    ┌───────────▼───────────┐ ┌─────────▼──────────┐
    │   PostgreSQL          │ │      Redis          │
    │   Supabase (managed)  │ │   Railway (addon)   │
    │   Prisma ORM          │ │   Cache + BullMQ    │
    │   Connection Pooling  │ │   Sessions          │
    └───────────────────────┘ └────────────────────┘
```

### Domains (3 — todos SSL)

| Domínio | Destino | Propósito |
|---------|---------|-----------|
| `app.brazachat.com` | Vercel | Frontend Next.js |
| `api.brazachat.com` | Railway | Backend API + WebSocket + Webhooks |
| `link.brazachat.com` | Railway (mesma instância) | Tracking redirect com cache Redis |

---

## 2. Cross-Cutting Concerns

### 2.1 CryptoService — Criptografia de Tokens Meta

```typescript
// packages/api/src/common/services/crypto.service.ts
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer; // from ENCRYPTION_KEY env var

  encrypt(plaintext: string): string {
    // IV random 16 bytes + AES-256-GCM encrypt
    // Retorna: iv:authTag:ciphertext (base64)
  }

  decrypt(encrypted: string): string {
    // Parse iv:authTag:ciphertext
    // AES-256-GCM decrypt
    // Retorna plaintext
  }
}
```

**Uso:** Auth module chama `cryptoService.encrypt(accessToken)` antes de salvar no banco e `cryptoService.decrypt()` ao ler para chamadas à Meta API.

### 2.2 TenantGuard — Isolamento Multi-tenant

```typescript
// packages/api/src/common/guards/tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // from JWT
    request.tenantId = user.id; // inject userId
    return true;
  }
}

// Prisma Middleware — filtra automaticamente por userId
prisma.$use(async (params, next) => {
  if (params.action === 'findMany' || params.action === 'findFirst') {
    params.args.where = { ...params.args.where, userId: request.tenantId };
  }
  return next(params);
});
```

**Garantia:** Nenhum operador vê dados de outro. Aplicado globalmente.

### 2.3 Logging — Pino

```typescript
// NestJS com Pino — structured logging
import { LoggerModule } from 'nestjs-pino';

LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
  },
});
```

### 2.4 Error Handling — Pattern Global

```typescript
// Global Exception Filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Log com Pino (structured)
    // Enviar para Sentry em produção
    // Retornar response padronizada: { error, message, statusCode }
    // NUNCA expor stack traces ao frontend
  }
}
```

---

## 3. Module Architecture

### 3.1 Auth Module

```
auth/
├── auth.module.ts
├── auth.controller.ts        # /auth/facebook, /auth/callback, /auth/me
├── auth.service.ts            # OAuth flow, JWT generation
├── strategies/
│   └── facebook.strategy.ts   # Passport Facebook Strategy
├── guards/
│   ├── jwt-auth.guard.ts      # Validates JWT from httpOnly cookie
│   └── tenant.guard.ts        # Injects userId (global)
└── dto/
    └── auth-response.dto.ts
```

### 3.2 Tracking Module (Performance Critical)

```
tracking/
├── tracking.module.ts
├── tracking.controller.ts     # GET /c/:trackingCode (PUBLIC, no auth)
├── tracking.service.ts        # Cache lookup, click registration, redirect
└── tracking.cache.ts          # Redis cache for trackingCode → campaign data
```

**Flow otimizado:**
```
Request GET /c/ABX92
  → Redis.get("track:ABX92")
    → HIT: campaignData (< 1ms)
    → MISS: PostgreSQL query → cache em Redis (TTL 1h) → campaignData
  → Gerar click_id, fbc, fbp
  → Salvar Click no DB (async — não bloqueia redirect)
  → HTTP 302 → wa.me/{phone}?text={message}

Total: < 500ms (cache hit: < 50ms)
```

### 3.3 WhatsApp Module

```
whatsapp/
├── whatsapp.module.ts
├── whatsapp.controller.ts     # GET/POST /webhooks/whatsapp (PUBLIC)
├── whatsapp.service.ts        # Send messages via Cloud API
├── whatsapp.webhook.ts        # Webhook validation, signature check
├── whatsapp.processor.ts      # BullMQ processor for async message handling
└── dto/
    ├── webhook-payload.dto.ts
    └── send-message.dto.ts
```

**Webhook flow:**
```
POST /webhooks/whatsapp
  → Validate X-Hub-Signature-256
  → Return 200 immediately
  → Enqueue message in BullMQ "whatsapp-messages"
  → Processor:
    → Extract click_id from message text
    → Match to Lead (or create orphan)
    → Save Message to DB
    → Emit Socket.io event to operator's room
    → If first message → dispatch ViewContent event
```

### 3.4 Inbox Module (WebSocket Gateway)

```
inbox/
├── inbox.module.ts
├── inbox.gateway.ts           # Socket.io Gateway (authenticated)
├── inbox.service.ts           # Conversation queries, message history
└── inbox.guard.ts             # JWT validation on WebSocket handshake
```

```typescript
@WebSocketGateway({ cors: { origin: 'https://app.brazachat.com' } })
export class InboxGateway implements OnGatewayConnection {
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const user = this.jwtService.verify(token);
      client.join(`user:${user.id}`); // Room per operator
    } catch {
      client.disconnect(); // Reject unauthenticated
    }
  }
}

// When new message arrives (from WhatsApp processor):
this.server.to(`user:${operatorId}`).emit('new-message', messageData);
```

### 3.5 Events Module (Conversion API)

```
events/
├── events.module.ts
├── events.controller.ts       # POST /conversations/:id/events, GET /events
├── events.service.ts          # Create event, manage status
├── events.processor.ts        # BullMQ processor for Meta CAPI delivery
├── capi/
│   ├── capi.client.ts         # Meta Conversion API HTTP client
│   ├── capi.hasher.ts         # SHA-256 normalization + hashing
│   └── capi.payload.ts        # Build compliant payload
└── dto/
    └── create-event.dto.ts
```

**CAPI Hasher — compliance:**
```typescript
export class CapiHasher {
  hashPhone(phone: string): string {
    // Remove spaces, hyphens, parens
    // Ensure country code (+55)
    // SHA-256
  }
  hashEmail(email: string): string {
    // Lowercase, trim
    // SHA-256
  }
  formatFbc(timestamp: number, fbclid: string): string {
    return `fb.1.${timestamp}.${fbclid}`;
  }
  formatFbp(timestamp: number): string {
    return `fb.1.${timestamp}.${randomDigits(10)}`;
  }
}
```

---

## 4. Database Schema (Prisma)

```prisma
// packages/api/prisma/schema.prisma

model User {
  id            String      @id @default(cuid())
  facebookId    String      @unique
  email         String
  name          String
  accessToken   String      // AES-256-GCM encrypted
  refreshToken  String?     // AES-256-GCM encrypted
  timezone      String      @default("America/Sao_Paulo")
  shippingData  Json?       // Sender data for labels
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  adAccounts    AdAccount[]
  products      Product[]
  campaigns     Campaign[]
}

model AdAccount {
  id            String      @id @default(cuid())
  metaId        String      // Meta's ad account ID
  name          String
  status        String
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  createdAt     DateTime    @default(now())

  pixels        Pixel[]
  campaigns     Campaign[]

  @@index([userId])
}

model Pixel {
  id            String      @id @default(cuid())
  metaId        String      // Meta's pixel ID
  name          String
  adAccountId   String
  adAccount     AdAccount   @relation(fields: [adAccountId], references: [id])
  createdAt     DateTime    @default(now())

  campaigns     Campaign[]

  @@index([adAccountId])
}

model Product {
  id              String    @id @default(cuid())
  name            String
  price           Decimal   @db.Decimal(10, 2)
  currency        String    @default("BRL")
  whatsappPhone   String    // +5511999999999
  messageTemplate String    // "Oi, quero saber mais sobre o {product}..."
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  campaigns       Campaign[]
  orders          Order[]

  @@index([userId])
}

model Campaign {
  id              String    @id @default(cuid())
  name            String
  trackingCode    String    @unique // ABX92
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  adAccountId     String
  adAccount       AdAccount @relation(fields: [adAccountId], references: [id])
  pixelId         String
  pixel           Pixel     @relation(fields: [pixelId], references: [id])
  adsetName       String
  adName          String
  creativeName    String
  utmSource       String    @default("facebook")
  utmMedium       String    @default("paid_social")
  utmCampaign     String    // slug
  utmContent      String    // slug
  utmTerm         String    // slug
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  clicks          Click[]
  leads           Lead[]

  @@index([userId])
  @@index([trackingCode])
}

model Click {
  id              String    @id @default(cuid())
  clickId         String    @unique // ck_XXXXXXX
  campaignId      String
  campaign        Campaign  @relation(fields: [campaignId], references: [id])
  fbclid          String?
  fbc             String?   // fb.1.{ts}.{fbclid}
  fbp             String?   // fb.1.{ts}.{random}
  ip              String
  userAgent       String
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?
  utmContent      String?
  utmTerm         String?
  createdAt       DateTime  @default(now())

  lead            Lead?

  @@index([campaignId])
  @@index([clickId])
}

model Lead {
  id              String    @id @default(cuid())
  phone           String?   // nullable until WhatsApp msg arrives
  name            String?
  campaignId      String
  campaign        Campaign  @relation(fields: [campaignId], references: [id])
  productId       String
  clickId         String?   @unique
  click           Click?    @relation(fields: [clickId], references: [id])
  fbclid          String?
  status          String    @default("new") // new, contacted, converted, lost, unmatched
  userId          String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  conversations   Conversation[]
  events          Event[]
  orders          Order[]

  @@index([userId])
  @@index([campaignId])
  @@index([phone])
}

model Conversation {
  id              String    @id @default(cuid())
  leadId          String
  lead            Lead      @relation(fields: [leadId], references: [id])
  userId          String
  lastMessageAt   DateTime?
  unreadCount     Int       @default(0)
  createdAt       DateTime  @default(now())

  messages        Message[]
  events          Event[]
  orders          Order[]

  @@index([userId])
  @@index([leadId])
}

model Message {
  id              String    @id @default(cuid())
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  content         String
  type            String    @default("text") // text, image, audio, document, system
  direction       String    // inbound, outbound
  status          String    @default("sent") // sent, delivered, read
  whatsappMsgId   String?   // Meta's message ID
  createdAt       DateTime  @default(now())

  @@index([conversationId])
  @@index([createdAt])
}

model Event {
  id              String    @id @default(cuid())
  eventId         String    @unique // for CAPI deduplication
  leadId          String
  lead            Lead      @relation(fields: [leadId], references: [id])
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  type            String    // ViewContent, AddToCart, InitiateCheckout, Purchase
  value           Decimal?  @db.Decimal(10, 2)
  currency        String?   @default("BRL")
  sentToMeta      String    @default("pending") // pending, sent, failed, skipped
  metaResponse    Json?
  retryCount      Int       @default(0)
  lastRetryAt     DateTime?
  userId          String
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([conversationId])
  @@index([sentToMeta])
}

model Order {
  id              String    @id @default(cuid())
  orderId         String    @unique // ORD-0001
  leadId          String
  lead            Lead      @relation(fields: [leadId], references: [id])
  conversationId  String
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  value           Decimal   @db.Decimal(10, 2)
  currency        String    @default("BRL")
  status          String    @default("awaiting_address")
  fullName        String?
  address         String?
  city            String?
  state           String?
  zipCode         String?
  country         String    @default("Brasil")
  trackingCode    String?   // shipping tracking
  userId          String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([status])
}

model AiInsight {
  id              String    @id @default(cuid())
  type            String    // common_question, converting_response, creative_performance
  data            Json      // { question, frequency } or { response, conversionRate }
  productId       String?
  campaignId      String?
  confidence      Decimal?  @db.Decimal(3, 2) // 0.00 - 1.00
  sampleSize      Int       @default(0)
  userId          String
  createdAt       DateTime  @default(now())

  @@index([userId])
  @@index([type])
}
```

---

## 5. BullMQ Queues

| Queue | Processor | Concurrency | Retry | Purpose |
|-------|-----------|-------------|-------|---------|
| `whatsapp-messages` | WhatsAppProcessor | 10 | 3x (5s, 30s, 2min) | Process incoming webhook messages async |
| `meta-events` | EventsProcessor | 5 | 3x (30s, 2min, 10min) | Send events to Meta CAPI |
| `ai-analysis` | AiProcessor | 1 | 1x | Daily cron — analyze conversations |

---

## 6. API Routes Summary

| Method | Route | Auth | Module | Purpose |
|--------|-------|------|--------|---------|
| `POST` | `/auth/facebook` | No | Auth | Start OAuth flow |
| `GET` | `/auth/callback` | No | Auth | OAuth callback |
| `GET` | `/auth/me` | JWT | Auth | Current user |
| `GET` | `/meta/ad-accounts` | JWT | Meta | List ad accounts |
| `GET` | `/meta/ad-accounts/:id/pixels` | JWT | Meta | List pixels |
| `GET/POST` | `/products` | JWT | Products | CRUD |
| `GET/POST` | `/campaigns` | JWT | Campaigns | CRUD |
| `GET` | `/c/:trackingCode` | **No** | Tracking | Click redirect (PUBLIC) |
| `GET/POST` | `/webhooks/whatsapp` | **Signature** | WhatsApp | Webhook (PUBLIC) |
| `GET` | `/conversations` | JWT | Inbox | List conversations |
| `POST` | `/conversations/:id/messages` | JWT | Inbox | Send message |
| `POST` | `/conversations/:id/events` | JWT | Events | Create event |
| `GET` | `/events` | JWT | Events | List events |
| `GET` | `/leads` | JWT | Leads | List leads |
| `GET/PATCH` | `/orders` | JWT | Orders | List/update orders |
| `GET` | `/dashboard/metrics` | JWT | Dashboard | Aggregated metrics |
| `GET` | `/ai/insights` | JWT | AI | AI insights |
| `PATCH` | `/users/settings` | JWT | Auth | Update settings |

**Nota:** Todas as rotas com JWT passam pelo TenantGuard (filtro por userId automático).

---

## 7. Security Architecture

### Defense in Depth

```
Layer 1: Network
  → HTTPS everywhere (SSL on all 3 domains)
  → CORS restricted to app.brazachat.com
  → Rate limiting (tracking: 100/s/IP, webhook: independent, API: 60/min/user)

Layer 2: Authentication
  → Facebook OAuth (Passport.js)
  → JWT in httpOnly cookie (7 days, SameSite=Lax)
  → WebSocket auth via JWT in handshake

Layer 3: Authorization
  → TenantGuard: userId injection in all requests
  → Prisma middleware: automatic filtering by userId
  → No cross-tenant data access possible

Layer 4: Data Protection
  → AES-256-GCM for Meta tokens (CryptoService)
  → SHA-256 for PII sent to Meta CAPI
  → ENCRYPTION_KEY in environment variables only
  → No secrets in frontend bundle

Layer 5: Input Validation
  → class-validator on all DTOs (backend)
  → Zod schemas on all forms (frontend)
  → Webhook signature validation (X-Hub-Signature-256)

Layer 6: Monitoring
  → Pino structured logging
  → Sentry error tracking (production)
  → BullMQ job monitoring (failed events dashboard)
```

---

## 8. Environment Variables

```env
# Database
DATABASE_URL=postgresql://...@supabase.co:6543/postgres?pgbouncer=true

# Auth
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
JWT_SECRET=
ENCRYPTION_KEY=           # 32 bytes hex for AES-256-GCM

# WhatsApp
WHATSAPP_TOKEN=
WHATSAPP_VERIFY_TOKEN=    # For webhook verification
WHATSAPP_APP_SECRET=      # For signature validation

# Redis
REDIS_URL=redis://...

# Frontend
NEXT_PUBLIC_API_URL=https://api.brazachat.com
NEXT_PUBLIC_WS_URL=https://api.brazachat.com

# AI (Epic 6)
OPENAI_API_KEY=

# Monitoring
SENTRY_DSN=

# App
NODE_ENV=production
APP_DOMAIN=link.brazachat.com
```

---

## 9. Architectural Decisions Record (ADR)

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| ADR-1 | Monolith modular NestJS | MVP speed + future extraction path | Microservices (overkill), Serverless (cold starts) |
| ADR-2 | Redis cache for tracking | < 500ms redirect guaranteed | In-memory cache (lost on restart), CDN (complex) |
| ADR-3 | AES-256-GCM for tokens | Industry standard, GCM provides auth | RSA (slower), bcrypt (one-way only) |
| ADR-4 | TenantGuard + Prisma middleware | Defense-in-depth multi-tenant | RLS (better but more complex for MVP) |
| ADR-5 | JWT in httpOnly cookie | XSS-safe, CSRF mitigated with SameSite | localStorage (XSS vulnerable), sessions (stateful) |
| ADR-6 | Socket.io with JWT handshake | Prevents unauthorized real-time access | Polling (high latency), SSE (one-direction) |
| ADR-7 | BullMQ for async processing | Reliable delivery, retry, monitoring | Direct HTTP calls (lose on failure), RabbitMQ (overkill) |
| ADR-8 | Pino over Winston | 5x faster, native NestJS support | Winston (slower), console.log (no structure) |
| ADR-9 | Vercel + Railway split | Vercel optimized for Next.js, Railway for long-running processes | Single VPS (no auto-scale), Fly.io (more complex) |

---

*Architecture by Aria (Architect) — Synkra AIOX*
*BrazaChat Architecture v1.0.0 — 2026-03-15*
