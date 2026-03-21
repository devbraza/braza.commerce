# Arquitetura — Tracking v1.1 (braza.commerce)

> **Autor:** Aria (Architect) | **Data:** 21/03/2026
> **PRD:** `docs/prd/PRD-001-braza-commerce-v1.md` — secao 16
> **Pesquisa:** `docs/research/yampi-integration-research.md`
> **Status:** Draft — pendente aprovacao

---

## 1. Descoberta Critica: O que ja existe

Ao analisar o codebase, **a maior parte do tracking ja esta implementada:**

| Componente | Status | Arquivo |
|-----------|--------|---------|
| Model Campaign | JA EXISTE | `prisma/schema.prisma` |
| Model Click | JA EXISTE | `prisma/schema.prisma` |
| Model Event | JA EXISTE | `prisma/schema.prisma` |
| Model Settings | JA EXISTE | `prisma/schema.prisma` (yampiSecretKey) |
| TrackingService | JA EXISTE | `src/tracking/tracking.service.ts` |
| CampaignsService | JA EXISTE | `src/campaigns/campaigns.service.ts` |
| CapiService | JA EXISTE | `src/capi/capi.service.ts` |
| YampiController | JA EXISTE | `src/webhooks/yampi.controller.ts` |
| Script de tracking | JA EXISTE | Injetado pelo `RenderService` |
| HMAC-SHA256 validation | JA EXISTE | `YampiController` |
| Metadata click_id | JA EXISTE | Script injeta no checkout URL |

### O que o PRD pede vs o que existe

| PRD pede | Codebase tem | Gap |
|----------|-------------|-----|
| Pagina = Campanha (sem tabela Campaign) | Campaign como tabela separada (pageId FK) | **DECISAO ARQUITETURAL** |
| Campos tracking no Page | Campos no Campaign | Precisa unificar |
| Event types: PAGE_VIEW, CTA_CLICK, CHECKOUT, PURCHASE | Event types: VIEW_CONTENT, INITIATE_CHECKOUT, ADD_PAYMENT_INFO, PURCHASE, PAYMENT_REFUSED | Precisa alinhar |
| POST `/api/track/view` | POST `/tracking/click` | Ja funciona, renomear? |
| POST `/api/track/click` | Script ja intercepta links | Ja funciona |
| POST `/api/webhooks/yampi` | JA EXISTE | Funcional |
| GET `/api/pages/:id/stats` | GET `/campaigns/:id/stats` | Precisa mudar rota |
| Dashboard por pagina | Dashboard por campanha | Precisa ajustar |
| Slug customizada | Page.slug ja existe (auto-gerado) | Precisa tornar editavel |

---

## 2. Decisao Arquitetural: Page = Campaign

### Opcao A: Eliminar Campaign, mover campos pro Page (PRD original)

```
Page
├── checkoutUrl (mover de Campaign)
├── pixelId (mover de Campaign)
├── accessToken (mover de Campaign)
├── clicks → Click[] (mover FK de campaignId para pageId)
└── events via clicks
```

**Pros:** Simplicidade, fluxo unico, sem entidade extra
**Contras:** Destrutivo (migration de dados, reescrever services, controllers, testes). Perde capacidade de ter multiplas campanhas por pagina no futuro.

### Opcao B: Manter Campaign, mas tornar transparente (RECOMENDADA)

```
Page (sem mudanca)
└── Campaign (auto-criada, 1:1 com Page no MVP)
    ├── checkoutUrl
    ├── pixelId
    ├── accessToken
    ├── clicks → Click[]
    └── events via clicks
```

**Como funciona:**
1. Quando o usuario configura tracking na criacao da pagina, o sistema cria uma Campaign automaticamente (invisivel pro usuario)
2. O frontend mostra os campos de tracking como se fossem da pagina
3. O dashboard mostra stats da campanha ativa, mas a rota usa pageId
4. No futuro (v2), pode-se expor campanhas multiplas por pagina

**Pros:**
- Zero migration destrutiva — nao mexe no schema existente
- Todo o TrackingService, CampaignsService, CapiService, YampiController continua funcionando
- Reutiliza 100% do codigo existente
- Caminho aberto pra multiplas campanhas por pagina no futuro

**Contras:**
- Camada de indireção (Page → Campaign → Click → Event), mas e transparente pro usuario

### Veredicto: OPCAO B

Justificativa: O codigo ja existe e funciona. Reescrever tudo pra eliminar Campaign seria retrabalho sem ganho funcional. A unificacao acontece na **camada de apresentacao** (frontend + API routes), nao no schema.

---

## 3. Schema Prisma — Alteracoes necessarias

### Nenhuma alteracao no schema existente

Os models Campaign, Click, Event e Settings ja existem com os campos corretos. A unica mudanca necessaria:

```prisma
// Page — tornar slug editavel (ja existe, mas auto-gerado)
// Nenhuma alteracao no model — a mudanca e no CreatePageDto/UpdatePageDto
// que passa a aceitar slug como input do usuario

// Validacao de slug unico ja existe (findBySlug + unique constraint)
```

### Event types existentes vs PRD

| Existente | PRD | Acao |
|-----------|-----|------|
| VIEW_CONTENT | PAGE_VIEW | **Manter VIEW_CONTENT** — e o termo padrao do Meta/industria |
| INITIATE_CHECKOUT | CHECKOUT | **Manter INITIATE_CHECKOUT** — alinhado com Yampi event |
| ADD_PAYMENT_INFO | (nao tem) | Manter — Yampi pode disparar |
| PURCHASE | PURCHASE | Igual |
| PAYMENT_REFUSED | (nao tem) | Manter — util pro funil |

**Recomendacao:** Manter os event types existentes. Sao mais descritivos e alinhados com a nomenclatura Meta/Yampi. O dashboard exibe com labels amigaveis:

| EventType (banco) | Label no dashboard |
|-------------------|--------------------|
| VIEW_CONTENT | Page Views |
| INITIATE_CHECKOUT | Checkouts |
| PURCHASE | Compras |

---

## 4. Modulos NestJS — Estrutura existente

Todos os modulos necessarios **ja existem:**

```
src/
├── tracking/          # TrackingModule — registro de clicks e eventos
│   ├── tracking.service.ts
│   └── tracking.controller.ts
├── campaigns/         # CampaignsModule — CRUD + stats
│   ├── campaigns.service.ts
│   └── campaigns.controller.ts
├── capi/              # CapiModule — Meta Conversion API
│   └── capi.service.ts
├── webhooks/          # WebhooksModule — Yampi webhook handler
│   └── yampi.controller.ts
├── settings/          # SettingsModule — config global (yampiSecretKey)
│   └── settings.service.ts
├── render/            # RenderModule — geracao HTML + script tracking
│   ├── render.service.ts
│   └── template.html
├── static-pages/      # StaticPagesModule — local + CF Pages deploy
│   ├── static-page-generator.service.ts
│   └── cloudflare-pages.service.ts
├── pages/             # PagesModule — CRUD + publish
│   ├── pages.service.ts
│   └── pages.controller.ts
└── public/            # PublicModule — serve paginas renderizadas
    └── public.controller.ts
```

### Alteracoes nos modulos

| Modulo | Alteracao |
|--------|----------|
| PagesModule | Novo endpoint `GET /pages/:id/stats` (proxy pro CampaignsService) |
| PagesModule | `publish()` cria Campaign automaticamente se nao existir |
| PagesController | Aceitar `checkoutUrl`, `pixelId`, `accessToken` no create/update (passa pro Campaign) |
| CampaignsService | Nenhuma — ja tem `getStats()` |
| TrackingService | Nenhuma — ja registra clicks e eventos |
| WebhooksModule | Nenhuma — ja processa order.created, order.paid, payment.refused |
| RenderModule | Nenhuma — ja injeta script de tracking |

---

## 5. Script de Tracking — Como funciona (ja implementado)

O `RenderService.render()` ja injeta um script inline no HTML quando existe uma campanha ativa:

```
Pagina carrega
  → Script captura fbclid + UTMs da URL
  → POST /tracking/click com campaignId
  → Recebe clickId (ck_xxxxx), armazena em window.__clickId
  → Evento VIEW_CONTENT registrado automaticamente

Lead clica CTA
  → Script intercepta o link
  → Appenda metadata[click_id] + metadata[fbclid] na URL do checkout
  → Redirect pro Yampi
```

### Integracao com Cloudflare Pages

O script ja faz POST para o backend (Hetzner). Como as landing pages sao HTML estatico no CF Pages, o script precisa da **URL absoluta do backend** para os POSTs. Isso ja funciona — o `RenderService` injeta a URL do backend no script.

**Nenhuma alteracao necessaria no script de tracking.**

---

## 6. Fluxo Unificado — O que precisa mudar

### Backend (PagesService)

```
ANTES:
  1. User cria page (POST /pages)
  2. User cria campaign separada (POST /campaigns)
  3. Campaign tem seus proprios checkoutUrl, pixelId, accessToken

DEPOIS:
  1. User cria page com campos de tracking (POST /pages)
     → Backend recebe: { title, price, ..., checkoutUrl, pixelId, accessToken }
     → PagesService.create() cria Page
     → Se checkoutUrl informada: cria Campaign automaticamente (name = page.title)
  2. User publica (PATCH /pages/:id/publish)
     → Se Campaign existe e esta ACTIVE: script de tracking embutido no HTML
     → Se nao: pagina sem tracking (funciona normal)
```

### Frontend (pages/new/page.tsx)

```
ANTES:
  Step 1: Upload fotos
  Step 2: Editar textos
  Step 3: Publicar

DEPOIS:
  Step 1: Upload fotos
  Step 2: Editar textos
  Step 3: Configurar tracking (NOVO)
    → URL do checkout (Yampi)
    → Pixel ID (Meta)
    → Access Token (Meta)
    → (todos opcionais — pagina funciona sem tracking)
  Step 4: Publicar (com slug editavel)
```

### API Routes — Mapeamento

| Frontend chama | Backend faz |
|---------------|-------------|
| `POST /pages` com checkoutUrl/pixelId/accessToken | Cria Page + Campaign automatica |
| `PATCH /pages/:id` com checkoutUrl/pixelId/accessToken | Atualiza Campaign da pagina |
| `GET /pages/:id/stats?from=&to=` | Busca Campaign ativa da pagina → chama CampaignsService.getStats() |
| `DELETE /pages/:id` | Deleta Page + Campaign + Clicks + Events (cascade) |

---

## 7. Dashboard de Tracking

### Endpoint

```
GET /pages/:id/stats?from=2026-03-01&to=2026-03-21
```

### Implementacao

O `CampaignsService.getStats()` ja faz as queries agregadas. O novo endpoint no PagesController:

```typescript
@Get(':id/stats')
async getStats(
  @Param('id') pageId: string,
  @Query('from') from?: string,
  @Query('to') to?: string,
) {
  // Busca campaign ativa da pagina
  const campaign = await this.campaignsService.findActiveByPageId(pageId);
  if (!campaign) return emptyStats;
  return this.campaignsService.getStats(campaign.id, from, to);
}
```

### Response shape (ja existe no CampaignsService)

```json
{
  "clicks": 847,
  "viewContent": 847,
  "checkouts": 158,
  "purchases": 47,
  "revenue": 3753.00,
  "aov": 79.85,
  "viewContentRate": 100,
  "checkoutRate": 18.65,
  "purchaseRate": 5.55,
  "overallConversion": 5.55
}
```

### Performance

Para MVP, queries agregadas diretas (COUNT, SUM) sao suficientes. Volume esperado:
- ~1000 clicks/dia por pagina no pico
- ~30 paginas ativas
- ~30K registros/dia

PostgreSQL lida com isso sem materializacao. Se necessario no futuro, adicionar indice composto `(clickId, type, createdAt)` e/ou materializar com pg_cron.

### Indices recomendados

```sql
-- Ja deve existir (FK)
CREATE INDEX idx_click_campaign_id ON "Click"("campaignId");
CREATE INDEX idx_event_click_id ON "Event"("clickId");

-- Para queries de stats por periodo
CREATE INDEX idx_event_created_at ON "Event"("createdAt");
CREATE INDEX idx_click_created_at ON "Click"("createdAt");
```

---

## 8. Webhook Yampi — Ja implementado

O `YampiController` ja:
1. Valida HMAC-SHA256 via header `x-yampi-hmac-sha256`
2. Extrai `metadata.click_id` do payload
3. Busca Click pelo clickId
4. Registra Event (INITIATE_CHECKOUT para order.created, PURCHASE para order.paid)
5. Dispara Meta CAPI (sendPurchase) para order.paid

### Env var necessaria

```
YAMPI_WEBHOOK_SECRET=wh_FxrvNaZJl3EZkTS1v21IOGgooL41vtNbPoX2S
```

> **Nota:** Essa secret ja foi obtida pelo usuario na configuracao da Yampi.

---

## 9. Seguranca

### Endpoints de tracking (POST /tracking/click)

| Protecao | Status |
|----------|--------|
| Rate limiting | IMPLEMENTAR — throttle 10 req/s por IP |
| Validacao de input | JA EXISTE — ValidationPipe global |
| CORS | JA EXISTE — origin restrito a FRONTEND_URL |
| No auth required | Correto — endpoints publicos (landing page precisa chamar) |

### Webhook Yampi (POST /api/webhooks/yampi)

| Protecao | Status |
|----------|--------|
| HMAC-SHA256 | JA EXISTE |
| Processamento | Sincrono hoje — CONSIDERAR async pra futuro |
| Idempotencia | IMPLEMENTAR — check se evento ja foi registrado pro mesmo clickId + type |

### Dados sensiveis

| Campo | Classificacao | Tratamento |
|-------|--------------|------------|
| pixelId | Credencial | Armazenado no banco, nao exposto na API publica |
| accessToken | Credencial | Armazenado no banco, nao exposto na API publica |
| yampiSecretKey | Credencial | Armazenado no banco (Settings), env var no Hetzner |
| IP do lead | PII | Armazenado para tracking, nao exposto no dashboard |
| fbclid | Identificador tecnico | OK — nao e dado pessoal |

---

## 10. Slug Customizada

### O que ja existe

- `Page.slug` — campo unique, auto-gerado a partir do titulo
- `PagesService.create()` — gera slug com `slugify(title)` + uniqueness check
- `PagesService.findBySlug()` — busca pagina por slug

### O que precisa mudar

1. **CreatePageDto / UpdatePageDto** — aceitar `slug` como campo opcional
2. **PagesService.create()** — se slug informado, usar; se nao, auto-gerar
3. **PagesService.update()** — permitir alterar slug (antes de publicar)
4. **Validacao** — regex `/^[a-z0-9-]+$/`, min 3, max 60 caracteres
5. **Frontend** — input de slug no Step 4 (publicacao) com preview da URL

---

## 11. Resumo de Alteracoes Necessarias

### Backend

| Arquivo | Alteracao | Complexidade |
|---------|----------|-------------|
| `pages.service.ts` | Criar Campaign auto no create/update se tracking fields presentes | Baixa |
| `pages.controller.ts` | Novo endpoint GET /:id/stats | Baixa |
| `pages.controller.ts` | Aceitar checkoutUrl/pixelId/accessToken no DTO | Baixa |
| `campaigns.service.ts` | Novo metodo findActiveByPageId() | Baixa |
| `create-page.dto.ts` | + checkoutUrl, pixelId, accessToken, slug (opcionais) | Baixa |

### Frontend

| Arquivo | Alteracao | Complexidade |
|---------|----------|-------------|
| `pages/new/page.tsx` | Step 3: campos de tracking + Step 4: slug editavel | Media |
| `pages/[id]/stats/page.tsx` | Nova pagina: dashboard de tracking | Media-alta |
| `pages/page.tsx` | Mini metricas nos cards da listagem | Baixa |

### Infra

| Item | Alteracao | Complexidade |
|------|----------|-------------|
| Env var Hetzner | Adicionar YAMPI_WEBHOOK_SECRET | Trivial |
| Rate limiting | Adicionar throttle nos endpoints de tracking | Baixa |
| Indices DB | Adicionar indices em Event.createdAt e Click.createdAt | Baixa |

### Nenhuma alteracao necessaria

| Componente | Motivo |
|-----------|--------|
| Schema Prisma | Models ja existem com campos corretos |
| TrackingService | Ja registra clicks e eventos |
| CapiService | Ja envia ViewContent e Purchase |
| YampiController | Ja processa order.created e order.paid |
| RenderService | Ja injeta script de tracking |
| CloudflarePagesService | Script ja embutido no HTML estatico |
| template.html | CTA ja interceptado pelo script |

---

## 12. Diagrama de Fluxo Completo

```
USUARIO (braza.commerce frontend)
  │
  ├─ Step 1: Upload fotos
  ├─ Step 2: Edita textos (IA + manual)
  ├─ Step 3: Configura tracking
  │    └─ checkoutUrl + pixelId + accessToken
  ├─ Step 4: Define slug + Publica
  │
  ▼
BACKEND (NestJS — Hetzner)
  │
  ├─ PagesService.create()
  │    ├─ Cria Page
  │    └─ Cria Campaign automatica (se tracking configurado)
  │
  ├─ PagesService.publish()
  │    ├─ RenderService.render(page, campaignId)
  │    │    ├─ Gera HTML com template v3.0
  │    │    └─ Injeta script de tracking (campaignId + backend URL)
  │    ├─ StaticPageGenerator.generate()
  │    │    ├─ Salva HTML local (/var/www/static-pages/{slug}/)
  │    │    └─ CloudflarePagesService.deployAll()
  │    └─ Salva staticUrl no banco
  │
  ▼
CLOUDFLARE PAGES (edge global — SP)
  │
  └─ Landing page servida (HTML estatico + script tracking)

  ▼
LEAD (clica no anuncio)
  │
  ├─ Abre landing page (CF Pages)
  │    └─ Script: POST /tracking/click → registra VIEW_CONTENT
  │
  ├─ Clica "Comprar agora"
  │    └─ Script: appenda metadata[click_id] + metadata[fbclid]
  │         → Redirect pro checkout Yampi
  │
  ▼
YAMPI (checkout terceirizado)
  │
  ├─ order.created → POST /api/webhooks/yampi
  │    └─ TrackingService.registerEvent(INITIATE_CHECKOUT)
  │
  ├─ order.paid → POST /api/webhooks/yampi
  │    ├─ TrackingService.registerEvent(PURCHASE, valor)
  │    └─ CapiService.sendPurchase() → Meta CAPI
  │
  ▼
DASHBOARD (frontend — Vercel)
  │
  └─ GET /pages/:id/stats → exibe funil em tempo real
       Page Views → Checkouts → Compras → Revenue
```

---

## 13. Epics Revisados (com base na analise)

| Epic | Nome | Complexidade real | Justificativa |
|------|------|------------------|---------------|
| E6 | Slug customizada | **Baixa** | Slug ja existe, so tornar editavel |
| E7 | Fluxo unificado: Campaign auto + campos tracking no frontend | **Media** | Backend quase pronto, frontend precisa Step 3 + Step 4 |
| E8 | Webhook Yampi (env var + idempotencia + rate limit) | **Baixa** | Ja implementado, so config + hardening |
| E9 | Dashboard de tracking | **Media** | Stats ja existem, precisa nova pagina frontend |

**Estimativa total:** Significativamente menor que o planejado. A base de tracking ja existe — o trabalho e de **integracao e polish**, nao de construcao from scratch.

---

*Documento de arquitetura — Aria (Architect) — 21/03/2026*
*Handoff → @pm (Morgan) para validacao e delegacao ao @sm*
