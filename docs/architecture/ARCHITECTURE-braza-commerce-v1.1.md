# Arquitetura — braza.commerce v1.1 (Tracking + CAPI + Yampi)

> **Autor:** Aria (Architect) | **Data:** 20/03/2026
> **PRD:** secao 16 | **UX Spec:** `docs/architecture/UX-SPEC-v1.1.md`
> **Base:** Sobre a v1.0 existente (NestJS + Next.js + Prisma + PostgreSQL)

---

## 1. Visao geral

```
                ┌──────────────┐
                │  Facebook    │
                │  Ads         │
                └──────┬───────┘
                       │ click (fbclid + UTMs)
                       ▼
┌─────────────────────────────────────────────────────┐
│                 braza.commerce                       │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌────────────────┐  │
│  │ Frontend │   │ Offer    │   │ API Backend    │  │
│  │ Next.js  │   │ Page     │   │ NestJS         │  │
│  │ :3000    │   │ /p/:slug │   │ :3001          │  │
│  └────┬─────┘   └────┬─────┘   └──┬──────┬──────┘  │
│       │              │            │      │          │
│       │              │ click_id   │      │          │
│       │              ▼            │      │          │
│       │         ┌─────────┐      │      │          │
│       │         │ Tracking│◄─────┘      │          │
│       │         │ Service │             │          │
│       │         └────┬────┘             │          │
│       │              │                  │          │
│       │              ▼                  ▼          │
│       │         ┌─────────┐      ┌──────────┐     │
│       │         │ Meta    │      │ Yampi    │     │
│       │         │ CAPI    │      │ Webhook  │     │
│       │         │ Service │      │ Handler  │     │
│       │         └────┬────┘      └─────┬────┘     │
│       │              │                 │          │
└───────┼──────────────┼─────────────────┼──────────┘
        │              │                 │
        │              ▼                 │
        │     ┌──────────────┐           │
        │     │ Facebook     │           │
        │     │ CAPI Server  │           │
        │     └──────────────┘           │
        │                                │
        │              ┌─────────────────┘
        │              │
        │              ▼
        │     ┌──────────────┐
        │     │ Yampi        │
        │     │ Checkout     │──→ metadata[click_id]
        │     └──────────────┘
        │
        ▼
   ┌──────────┐
   │PostgreSQL│
   │ Campaign │
   │ Click    │
   │ Event    │
   └──────────┘
```

---

## 2. Novos modulos backend

```
packages/api/src/
├── campaigns/                 # E7 — Tracking
│   ├── campaigns.module.ts
│   ├── campaigns.controller.ts   # CRUD campanhas
│   ├── campaigns.service.ts      # Logica de campanhas
│   └── dto/
│       └── create-campaign.dto.ts
│
├── tracking/                  # E7 — Clicks + Funil
│   ├── tracking.module.ts
│   ├── tracking.service.ts       # Captura clicks, gera click_id
│   └── stats.service.ts          # Calcula metricas do funil
│
├── webhooks/                  # E10 — Yampi integration
│   ├── webhooks.module.ts
│   ├── yampi.controller.ts       # POST /api/webhooks/yampi
│   └── yampi.service.ts          # Valida HMAC, processa order.paid
│
├── capi/                      # E8 — Meta Conversion API
│   ├── capi.module.ts
│   └── capi.service.ts           # Envia ViewContent + Purchase para Facebook
│
└── (modulos existentes v1.0)
    ├── pages/
    ├── ai/
    ├── render/
    ├── public/
    ├── upload/
    ├── health/
    └── common/
```

---

## 3. Novas paginas frontend

```
packages/web/src/
├── app/
│   ├── layout.tsx              # ATUALIZAR: adicionar Sidebar + Header
│   │
│   ├── pages/                  # (existente, mover para layout com sidebar)
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/edit/page.tsx
│   │
│   ├── campaigns/              # NOVO
│   │   ├── page.tsx            # Lista de campanhas
│   │   ├── new/page.tsx        # Criar campanha
│   │   └── [id]/page.tsx       # Metricas da campanha
│   │
│   ├── metrics/                # NOVO
│   │   └── page.tsx            # Dashboard geral
│   │
│   ├── events/                 # NOVO
│   │   └── page.tsx            # Log de eventos
│   │
│   ├── settings/               # NOVO
│   │   └── page.tsx            # Config Yampi + Pixel
│   │
│   └── privacy/page.tsx        # (existente)
│
├── components/
│   ├── layout/                 # NOVO — identico ao tracker.braza
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── stats/                  # NOVO
│   │   ├── KpiCard.tsx
│   │   ├── FunnelChart.tsx
│   │   └── ConversionTable.tsx
│   └── (existentes)
```

---

## 4. Banco de dados — Novos models

```prisma
model Campaign {
  id            String         @id @default(cuid())
  pageId        String
  page          Page           @relation(fields: [pageId], references: [id])
  name          String
  checkoutUrl   String
  pixelId       String?
  accessToken   String?
  status        CampaignStatus @default(ACTIVE)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  clicks        Click[]

  @@index([pageId])
}

enum CampaignStatus {
  ACTIVE
  PAUSED
  ARCHIVED
}

model Click {
  id           String    @id @default(cuid())
  campaignId   String
  campaign     Campaign  @relation(fields: [campaignId], references: [id])
  clickId      String    @unique
  fbclid       String?
  fbc          String?
  fbp          String?
  ip           String
  userAgent    String
  utmSource    String?
  utmMedium    String?
  utmCampaign  String?
  utmContent   String?
  utmTerm      String?
  createdAt    DateTime  @default(now())
  events       Event[]

  @@index([campaignId])
  @@index([clickId])
  @@index([createdAt])
}

model Event {
  id         String    @id @default(cuid())
  clickId    String
  click      Click     @relation(fields: [clickId], references: [id])
  type       EventType
  value      Decimal?  @db.Decimal(10, 2)
  currency   String?   @default("BRL")
  metadata   Json?
  createdAt  DateTime  @default(now())

  @@index([clickId])
  @@index([type])
  @@index([createdAt])
}

enum EventType {
  VIEW_CONTENT
  INITIATE_CHECKOUT
  ADD_PAYMENT_INFO
  PURCHASE
  PAYMENT_REFUSED
}

// Adicionar relacao em Page (existente)
model Page {
  // ... campos existentes
  campaigns  Campaign[]
}
```

---

## 5. API — Novos endpoints

### Campanhas

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/campaigns` | — | Criar campanha |
| GET | `/campaigns` | — | Listar campanhas |
| GET | `/campaigns/:id` | — | Detalhe + stats |
| PATCH | `/campaigns/:id` | — | Editar (nome, checkout, pixel) |
| PATCH | `/campaigns/:id/pause` | — | Pausar campanha |
| PATCH | `/campaigns/:id/activate` | — | Ativar campanha |
| GET | `/campaigns/:id/stats` | — | Metricas do funil (com filtro periodo) |
| GET | `/campaigns/:id/clicks` | — | Lista de clicks paginada |
| GET | `/campaigns/:id/events` | — | Lista de eventos paginada |

### Webhooks

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/api/webhooks/yampi` | HMAC | Recebe webhooks da Yampi |

### Tracking (interno — chamado pela offer page)

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/tracking/click` | — | Registra click (chamado pelo JS da offer page) |

### Metricas globais

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/metrics/overview` | — | Metricas gerais (todas as campanhas) |
| GET | `/events` | — | Log de eventos global paginado |

### Settings

| Metodo | Rota | Auth | Descricao |
|--------|------|------|-----------|
| GET | `/settings` | — | Configuracoes atuais |
| PATCH | `/settings` | — | Atualizar (yampi secret, pixel padrao) |

**Total novos: ~14 endpoints**

---

## 6. Tracking — Fluxo tecnico detalhado

### 6.1 Captura do click (offer page)

Quando a offer page renderiza, o JS da pagina faz:

```javascript
// No template v3.0 (injetado pelo render engine)
const params = new URLSearchParams(window.location.search);
const fbclid = params.get('fbclid');
const utms = {
  source: params.get('utm_source'),
  medium: params.get('utm_medium'),
  campaign: params.get('utm_campaign'),
  content: params.get('utm_content'),
  term: params.get('utm_term'),
};

// Registrar click no backend
fetch('/tracking/click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignId: '{{campaign_id}}',
    fbclid,
    ...utms,
  }),
}).then(r => r.json()).then(data => {
  // Guardar click_id para usar no CTA
  window.__clickId = data.clickId;
});
```

### 6.2 Redirect para checkout com metadata

O botao "Comprar agora" na offer page:

```javascript
// CTA click handler (injetado pelo render engine)
document.querySelectorAll('.cta-button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const checkoutUrl = new URL('{{checkout_url}}');
    if (window.__clickId) {
      checkoutUrl.searchParams.set('metadata[click_id]', window.__clickId);
    }
    if (fbclid) {
      checkoutUrl.searchParams.set('metadata[fbclid]', fbclid);
    }
    window.location.href = checkoutUrl.toString();
  });
});
```

### 6.3 Webhook da Yampi

```typescript
// yampi.controller.ts
@Post('api/webhooks/yampi')
async handleYampiWebhook(@Req() req: Request, @Res() res: Response) {
  // 1. Validar HMAC
  const signature = req.headers['x-yampi-hmac-sha256'];
  if (!this.yampi.validateSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Processar evento
  const { event, data } = req.body;
  if (event === 'order.paid') {
    const clickId = data.metadata?.click_id;
    if (clickId) {
      // Registrar evento PURCHASE
      await this.tracking.registerEvent(clickId, 'PURCHASE', data.total);
      // Disparar Purchase para Meta CAPI
      await this.capi.sendPurchase(clickId, data.total);
    }
  }

  return res.status(200).send('OK');
}
```

---

## 7. Meta CAPI — Integracao server-side

### Endpoint Facebook

```
POST https://graph.facebook.com/v21.0/{pixel_id}/events?access_token={token}
```

### Payload ViewContent

```json
{
  "data": [{
    "event_name": "ViewContent",
    "event_time": 1711000000,
    "action_source": "website",
    "event_source_url": "https://braza.commerce/p/coelha-pascoa",
    "user_data": {
      "client_ip_address": "189.x.x.x",
      "client_user_agent": "Mozilla/5.0...",
      "fbc": "fb.1.1711000000.xxxxx",
      "fbp": "fb.1.1711000000.12345"
    },
    "custom_data": {
      "content_name": "Coelha Pascoa",
      "content_type": "product"
    }
  }]
}
```

### Payload Purchase

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1711000000,
    "action_source": "website",
    "user_data": {
      "fbc": "fb.1.xxx.fbclid",
      "fbp": "fb.1.xxx.random"
    },
    "custom_data": {
      "value": 79.90,
      "currency": "BRL"
    }
  }]
}
```

---

## 8. Stats Service — Calculo de metricas

```typescript
// stats.service.ts
async getFunnelStats(campaignId: string, from: Date, to: Date) {
  const clicks = await this.prisma.click.count({
    where: { campaignId, createdAt: { gte: from, lte: to } },
  });

  const viewContent = await this.prisma.event.count({
    where: {
      click: { campaignId },
      type: 'VIEW_CONTENT',
      createdAt: { gte: from, lte: to },
    },
  });

  const purchases = await this.prisma.event.count({
    where: {
      click: { campaignId },
      type: 'PURCHASE',
      createdAt: { gte: from, lte: to },
    },
  });

  const revenue = await this.prisma.event.aggregate({
    where: {
      click: { campaignId },
      type: 'PURCHASE',
      createdAt: { gte: from, lte: to },
    },
    _sum: { value: true },
  });

  return {
    clicks,
    viewContent,
    viewContentRate: clicks > 0 ? (viewContent / clicks * 100).toFixed(1) : '0',
    purchases,
    purchaseRate: viewContent > 0 ? (purchases / viewContent * 100).toFixed(1) : '0',
    revenue: Number(revenue._sum.value || 0),
    aov: purchases > 0 ? Number(revenue._sum.value || 0) / purchases : 0,
  };
}
```

---

## 9. Settings — Armazenamento

Para MVP sem auth, as configuracoes ficam em uma tabela simples:

```prisma
model Settings {
  id              String  @id @default("default")
  yampiSecretKey  String?
  defaultPixelId  String?
  defaultAccessToken String?
  updatedAt       DateTime @updatedAt
}
```

---

## 10. Novas dependencias

| Dependencia | Motivo |
|------------|--------|
| `crypto` (nativo Node) | HMAC-SHA256 para validar webhook Yampi |

**Nenhuma dependencia nova necessaria.** `fetch` nativo do Node 18+ para Meta CAPI. `crypto` ja e built-in.

---

## 11. Seguranca

| Camada | Implementacao |
|--------|--------------|
| Webhook Yampi | Validacao HMAC-SHA256 via `X-Yampi-Hmac-SHA256` |
| Access Token Meta | Armazenado no banco (Settings), nunca no frontend |
| Click ID | Formato `ck_` + 7 chars aleatorios (nao sequencial) |
| Rate limiting | `/tracking/click` limitado a 60 req/min por IP |
| CORS | Offer page pode chamar `/tracking/click` (same-origin) |

---

## 12. Performance

| Operacao | Target | Estrategia |
|----------|--------|-----------|
| Registrar click | < 50ms | Insert simples, indices no campaignId |
| Stats funil | < 200ms | Indices em createdAt + type, queries COUNT |
| Webhook Yampi | < 100ms | Responde 200 rapido, processa async |
| Meta CAPI | Fire-and-forget | Nao bloqueia response, log erros |
| Dashboard | < 500ms | Queries agregadas com indice |

---

## 13. Modificacoes na offer page (render engine)

O render engine precisa injetar no template v3.0:

1. **Script de tracking** — captura fbclid/UTMs e registra click
2. **Campaign ID** — placeholder `{{campaign_id}}` no template
3. **Click handler no CTA** — redirect para checkout com metadata

Esses scripts sao injetados APENAS quando a pagina tem uma campanha ativa vinculada. Paginas sem campanha continuam funcionando como antes (redirect direto para checkoutUrl).

---

*Arquitetura braza.commerce v1.1 — Aria (Architect) — 20/03/2026*
*4 novos modulos | 3 novos models | ~14 novos endpoints | 0 novas dependencias*
