# BrazaChat — Product Requirements Document (PRD)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-15 | 0.1.0 | Initial PRD draft | Morgan (PM) |
| 2026-03-15 | 0.2.0 | Meta Ads compliance update: fbc format, UTM auto-generation, CAPI hashing, LGPD privacy, deduplication | Morgan (PM) |
| 2026-03-15 | 0.3.0 | Design System Braza oficializado como requisito obrigatório para toda implementação | Morgan (PM) |
| 2026-03-15 | 0.4.0 | Architect review: cache Redis tracking, criptografia AES-256, multi-tenant guard, WebSocket auth, deploy diagram | Aria (Architect) |
| 2026-03-15 | 0.5.0 | Tela de login removida da v1 — sistema opera com acesso direto. OAuth backend mantido para integração Meta API | Morgan (PM) |
| 2026-03-15 | 0.6.0 | Campos adsetName, adName, creativeName removidos do formulário de campanhas v1 — dados passados via UTMs padrão configuráveis em Settings > Tracking | Morgan (PM) |
| 2026-03-15 | 0.7.0 | UTMs: remover seletores de utm_source/utm_medium padrão da aba Tracking — UTMs devem ser puxados diretamente da campanha real do Facebook (nomes reais de campanha, grupo de anúncio, etc.), não valores fixos. Domínio de tracking será configurado após registro do domínio definitivo. Política de privacidade será página apontada após domínio definido | Morgan (PM) |
| 2026-03-15 | 0.8.0 | Adicionados FR20 (página Teste — UTMs + CAPI) e FR21 (template UTMs para Facebook Ads na aba Tracking). Módulo Teste adicionado à lista de telas (P1) | Morgan (PM) |
| 2026-03-16 | 0.9.0 | Domínio atualizado de brazachat.com para brazachat.shop (registro real). Aba WhatsApp adicionada em Settings para configuração da WhatsApp Cloud API. Privacy URL e tracking domain definidos em produção | Morgan (PM) |
| 2026-03-16 | 1.0.0 | **Migração WhatsApp Cloud API → Z-API.** Integração WhatsApp simplificada via Z-API (SaaS). Removida dependência direta da WhatsApp Cloud API, Meta Business Verification e webhook com validação HMAC. Settings > WhatsApp simplificado para Instance ID + Token + Client-Token. Webhook simplificado (JSON direto). Suporte a mídias (imagem, áudio, documento) adicionado ao MVP. Modelo SaaS multi-instância documentado para fase futura | Morgan (PM) |
| 2026-03-16 | 1.2.0 | **Campanhas simplificadas + DELETE.** (1) Link e UTMs clicáveis (click-to-copy, sem campos editáveis). (2) Template UTMs padrão Facebook na criação e detalhe da campanha. (3) Checkbox de seleção + exclusão em massa de campanhas. (4) Endpoint `DELETE /campaigns/:id` adicionado. (5) Drawer de detalhe simplificado — removidos campos editáveis de UTMs | Morgan (PM) |
| 2026-03-16 | 1.1.0 | **Deploy produção + v1 single-tenant operacional.** (1) Autenticação v1: OptionalAuthGuard em todos controllers — tenta JWT cookie, fallback para DEFAULT_USER_ID. Sem tela de login. (2) Facebook OAuth funcional: botão Conectar Facebook em Settings > Integrations redireciona para OAuth real, callback salva token e retorna para Settings. Cookie JWT com domain=.brazachat.shop para cross-subdomain. Scope `email` adicionado ao OAuth. (3) Página Teste CAPI atualizada: campo test_event_code do Facebook (cola do Events Manager), payload completo com client_ip, fbc, fbp, external_id (SHA-256), event_source_url. (4) Upload module: POST /upload/media para mídias na VPS filesystem (16MB max, path traversal protection). (5) Rate limiting: webhook 100 req/s por IP, mensagens 30/min por conversa, cleanup periódico. (6) Deploy: Backend Hetzner VPS (PM2 + Nginx + Let's Encrypt SSL), Frontend Vercel, banco PostgreSQL Hetzner | Morgan (PM) |

---

## 1. Goals and Background Context

### Goals

- Capturar e rastrear leads originados de Meta Ads (Facebook/Instagram) com click tracking completo (fbclid, IP, user agent)
- Centralizar a gestão de conversas WhatsApp num CRM único com inbox estilo WhatsApp Web
- Registrar e enviar eventos de conversão (ViewContent → Purchase) para Meta via Conversion API server-side
- Gerenciar pedidos, endereços e envio de produtos com etiquetas e rastreio
- Gerar insights com IA a partir de conversas para identificar padrões de conversão e otimizar campanhas
- Escalar como SaaS multi-tenant para múltiplos operadores e contas de anúncio

### Background Context

Empresas que vendem via WhatsApp a partir de anúncios Meta enfrentam um problema grave: perdem a rastreabilidade do lead entre o clique no anúncio e a conversa no WhatsApp. Isso impede a otimização de campanhas, pois a Meta não recebe eventos de conversão do funil real (que acontece no chat). O BrazaChat resolve isso criando uma ponte entre Meta Ads e WhatsApp — cada clique gera um link de tracking único, e cada evento no chat (interesse, checkout, compra) é enviado de volta para a Meta via Conversion API. Isso fecha o loop de atribuição e permite que o algoritmo da Meta otimize para as conversões reais.

### Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Operadores ativos no MVP | 10 | 60 dias pós-lançamento |
| Eventos enviados com sucesso para Meta | > 95% delivery rate | Contínuo |
| Tempo de redirect (click → WhatsApp) | < 500ms p95 | Contínuo |
| Uptime do sistema | 99.5% | Mensal |
| Conversas gerenciadas por operador | 100 simultâneas sem degradação | Contínuo |

---

## 2. Requirements

### Functional Requirements

**Tracking & Redirecionamento:**
- **FR1:** O sistema deve gerar links de tracking únicos por campanha (ex: `https://link.brazachat.shop/c/ABX92`) via HTTPS obrigatório, que capturam fbclid, IP, user_agent, timestamp e UTM parameters no clique
- **FR2:** O sistema deve gerar um click_id único por clique (formato: `ck_XXXXXXX`), formatar o `fbc` parameter no padrão Meta (`fb.1.{timestamp}.{fbclid}`), gerar `fbp` (browser ID no formato `fb.1.{timestamp}.{random}`), e redirecionar o usuário para WhatsApp com mensagem dinâmica contendo o produto e click_id invisível
- **FR2.1:** O sistema deve capturar UTM parameters reais passados pela Meta Ads na URL do clique (utm_source, utm_medium, utm_campaign, utm_content, utm_term) — esses valores vêm diretamente do Facebook com os nomes reais de campanha, grupo de anúncio e criativo. Os UTMs são armazenados no registro de clique tal como recebidos, sem valores fixos pré-definidos
- **FR3:** O evento ViewContent deve ser disparado automaticamente quando o lead envia a primeira mensagem no WhatsApp

**Conexão Meta & Contas:**
- **FR4:** O sistema deve permitir autenticação via Facebook Login (OAuth) com permissões `ads_management`, `ads_read`, `business_management`
- **FR5:** Após autenticação, o sistema deve recuperar e listar Ad Accounts e Pixels vinculados à conta Meta do usuário
- **FR6:** O sistema deve respeitar a hierarquia: Ad Account → Pixel → Campaign → Lead → Conversation → Event → Order

**Campanhas & Produtos:**
- **FR7:** O sistema deve permitir criar produtos com nome, preço, moeda, telefone WhatsApp e template de mensagem (ex: "Oi, quero saber mais sobre o {product} que vi no anúncio.")
- **FR8:** O sistema deve permitir criar campanhas vinculando: produto, ad account, pixel e nome — com dropdown de pixels filtrados pela ad account selecionada. ~~Campos adsetName, adName e creativeName removidos do formulário v1~~ — esses dados são passados via UTM parameters configurados em Settings > Tracking (utm_source, utm_medium padrão)

**Inbox & Conversas:**
- **FR9:** O sistema deve exibir uma Inbox estilo WhatsApp Web com lista de conversas à esquerda (nome/telefone + produto, sem preview) e chat à direita
- **FR10:** No topo de cada conversa, exibir: lead, produto, campanha e criativo
- **FR11:** Na parte inferior do chat, exibir botões de evento: AddToCart, InitiateCheckout, Purchase

**Eventos de Conversão:**
- **FR12:** O operador deve poder disparar eventos AddToCart, InitiateCheckout e Purchase via botões na conversa
- **FR13:** Todos os eventos devem ser enviados para Meta via Conversion API (server-side) com compliance total: event_name, event_time, action_source=website, event_source_url, client_user_agent, client_ip_address, fbc (formato `fb.1.{ts}.{fbclid}`), fbp, ph (SHA-256), em (SHA-256 se disponível), external_id (SHA-256), event_id (único para deduplicação), custom_data (value, currency)
- **FR13.1:** Todos os dados pessoais (telefone, email, nome) devem ser normalizados e hasheados com SHA-256 antes do envio para Meta, conforme requisitos da Conversion API
- **FR13.2:** Cada evento deve incluir um `event_id` único para deduplicação. Eventos com mesmo event_id dentro de 48h são deduplicados automaticamente pela Meta

**Pedidos (Orders):**
- **FR14:** Ao marcar Purchase, o sistema deve criar automaticamente um pedido vinculado ao lead/conversa
- **FR15:** O pedido deve coletar: nome completo, endereço, cidade, estado, CEP, país
- **FR16:** O sistema deve permitir gerar etiqueta de envio, registrar código de rastreio e atualizar status (Aguardando endereço → Etiqueta gerada → Enviado → Entregue)

**IA & Insights:**
- **FR17:** O módulo de IA deve analisar todas as conversas de forma passiva (sem responder clientes), cruzando dados de produto, campanha, criativo e mensagens
- **FR18:** A IA deve identificar: perguntas comuns dos leads, respostas que convertem, e criativos que geram mais vendas

**Dashboard & Módulos:**
- **FR19:** O sistema deve possuir os módulos: Dashboard, Campaigns, Inbox, Leads, Orders, Products, Ad Accounts, Pixels, Events, AI Insights, Teste, Settings

**Teste de Integrações:**
- **FR20:** O sistema deve possuir uma página "Teste" com duas funcionalidades: (1) Testar recebimento de UTMs — o operador cola uma URL (default: `https://link.brazachat.shop/c/ABX92?...`) e o sistema exibe uma tabela com cada parâmetro capturado (utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid) com indicador visual de sucesso/falha; (2) Testar envio de conversão (Meta CAPI) — o operador informa Pixel ID, Access Token, tipo de evento, telefone (opcional) e **test_event_code** (copiado do Events Manager do Facebook), e o sistema envia um evento completo para a Meta Conversion API com payload obrigatório: client_ip_address, client_user_agent, fbc, fbp, external_id (SHA-256), event_source_url. Se test_event_code vazio, envia como evento real

**UTM Template para Facebook Ads:**
- **FR21:** A aba Settings > Tracking deve exibir um template de UTMs padrão pronto para o operador copiar e colar no campo "URL Parameters" do Facebook Ads Manager. Template: `utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}` — com botão "Copiar" e instruções de uso

### Non-Functional Requirements

- **NFR1:** O redirecionamento do link de tracking para WhatsApp deve ocorrer em menos de 500ms. O lookup `trackingCode → campanha` deve ser cacheado em Redis (TTL 1h) para evitar query ao PostgreSQL em cada clique
- **NFR2:** O envio de eventos para Meta Conversion API deve usar fila assíncrona (Redis) com retry automático para garantir entrega
- **NFR3:** O sistema deve suportar isolamento multi-tenant via `userId` filter em todas as queries (Prisma middleware + NestJS TenantGuard). Nenhum operador pode acessar dados de outro operador. Pós-MVP considerar RLS no Supabase
- **NFR4:** Tokens Meta (accessToken, refreshToken) devem ser criptografados com AES-256-GCM antes de persistir no banco. Chave de criptografia via variável de ambiente `ENCRYPTION_KEY`. CryptoService centralizado no NestJS para encrypt/decrypt. Tokens nunca expostos no frontend
- **NFR5:** O sistema deve ser construído com arquitetura modular (NestJS modules) para facilitar evolução para SaaS
- **NFR6:** O backend deve suportar pelo menos 100 conversas simultâneas por operador sem degradação perceptível
- **NFR7:** O frontend deve ser responsivo (Web Responsive) para uso em desktop e tablet
- **NFR8:** Toda comunicação com WhatsApp deve ser feita via Z-API (REST API + webhooks). Webhook de recebimento deve validar origem via IP whitelist ou Client-Token
- **NFR9:** O sistema deve manter uptime de 99.5% mensal
- **NFR10:** Dados de clicks e mensagens devem ser retidos por 12 meses; dados de analytics por 24 meses
- **NFR11:** O link de tracking deve exibir brevemente (splash page ou footer) um aviso de coleta de dados conforme LGPD antes do redirect, ou o domínio de tracking deve ter política de privacidade acessível via link
- **NFR12:** Todo link de tracking deve usar HTTPS — HTTP não é permitido pela política Meta Ads
- **NFR13:** O formato do parâmetro `fbc` enviado para Meta CAPI deve seguir estritamente o padrão `fb.1.{creation_time}.{fbclid}` — formatos incorretos são rejeitados pela API
- **NFR14:** Todo frontend DEVE seguir o Braza Design System (`docs/braza-design-system.md`) — cores, tipografia, componentes, animações e ícones conforme documentado. Desvios visuais do padrão Braza são considerados bugs
- **NFR15:** Conexões WebSocket (Socket.io) devem ser autenticadas via JWT no handshake. Cada socket é associado a um userId e só recebe eventos das suas próprias conversas. Conexões sem token válido são rejeitadas
- **NFR15.1:** Credenciais Z-API (Instance ID, Token, Client-Token) devem ser criptografadas com AES-256-GCM via `CryptoService` antes de persistir no banco — mesmo tratamento dos tokens Meta
- **NFR17:** Upload de mídias via `POST /upload/media` com limite de 16MB (limite WhatsApp). Arquivos salvos no filesystem da VPS em `/uploads/media/{userId}/{YYYY-MM-DD}/{uuid}.ext`. Endpoint de serve com proteção contra path traversal (validação de UUID, formato de data, e verificação de path dentro de uploadsDir)
- **NFR18:** Rate limiting: webhook Z-API 100 req/s por IP (`WebhookRateLimitGuard`), envio de mensagens 30 msg/min por conversa (`MessageRateLimitGuard`). Ambos com cleanup periódico de entries expiradas (setInterval 60s) para evitar memory leak
- **NFR19:** Autenticação v1 (single-tenant): `OptionalAuthGuard` em todos os controllers — parseia JWT cookie se disponível, fallback para `DEFAULT_USER_ID` env var. Nunca retorna 401. Quando auth multi-tenant for implementada, substituir por `JwtAuthGuard`
- **NFR16:** O endpoint de webhook Z-API (`/webhook/z-api`) deve ter URL pública estável em produção: `https://api.brazachat.shop/webhook/z-api` (Hetzner VPS). Em desenvolvimento, usar ngrok ou Cloudflare Tunnel. Rate limiter independente (100 req/s por IP com cleanup periódico). Webhook URL registrada na Z-API automaticamente ao salvar credenciais e no startup do backend (OnModuleInit)

---

## 3. User Interface Design Goals

> **REQUISITO OBRIGATÓRIO:** Todo desenvolvimento frontend DEVE seguir o **Braza Design System** documentado em [`docs/braza-design-system.md`](braza-design-system.md). Este documento é a fonte de verdade para cores, tipografia, componentes, animações e padrões visuais. Nenhuma implementação visual deve desviar deste padrão sem aprovação explícita.

### Design System Oficial — Braza Design System v1.0

**Documento de referência:** `docs/braza-design-system.md`
**Origem:** Extraído do Braza Tracker (projeto irmão em produção) para garantir consistência visual entre todas as ferramentas do grupo Braza.

O Design System contém especificações completas e prontas para implementação:

| Seção | O que define | Uso |
|-------|-------------|-----|
| **1. Logo & Branding** | Monograma "B", assets (`docs/assets/logo-dark.png`, `logo-transparent.png`), uso na sidebar | Toda tela que exibe logo |
| **2. Color Tokens** | Tokens CSS dark + light mode, cores semânticas (emerald/amber/red/sky/violet), padrão de icon badge | Toda estilização |
| **3. Typography** | Inter + JetBrains Mono, scale completa (10px-24px) com classes Tailwind exatas | Todo texto |
| **4. Layout & Spacing** | App shell (sidebar 220px, header h-16, content p-6 max-w-5xl), gaps, border radius | Toda estrutura de página |
| **5. Component Patterns** | KPI cards (primary + secondary), nav items, date presets, skeletons, badges de status, semáforo | Todo componente UI |
| **6. Animations** | Card glow, live pulse, stat count-up, shimmer, scrollbar premium | Micro-interactions |
| **7. Icon Library** | Lucide React, mapeamento completo por módulo BrazaChat | Todo ícone |
| **8. Conversion Events** | Cores e ícones por evento (ViewContent/AddToCart/InitiateCheckout/Purchase), botões na Inbox, order status badges | Módulos Inbox, Events, Orders |
| **9. Tech Frontend** | Next.js 15, React 19, TailwindCSS 4, shadcn/ui, tw-animate-css, @tanstack/react-query | Setup do projeto |
| **10. Viewport & Theme** | Dark-first (`#09090b`), theme toggle na sidebar, `antialiased` | Configuração global |

### Regras de Implementação Visual

1. **Dark-first:** O tema escuro (`#09090b`) é o padrão. Light mode é suportado mas secundário
2. **Consistência Braza:** Qualquer novo componente deve seguir os padrões de card, badge e icon badge documentados no Design System
3. **Cores de conversão:** ViewContent=zinc, AddToCart=amber, InitiateCheckout=orange, Purchase=emerald — sem exceções
4. **Sem CSS custom:** Usar apenas Tailwind utility classes + os custom CSS do Design System (card-glow, live-pulse, stat-number, shimmer-border)
5. **Ícones:** Apenas Lucide React, seguindo o mapeamento de módulos do Design System
6. **Fontes:** Apenas Inter (sans) e JetBrains Mono (mono) — sem fontes adicionais

### Overall UX Vision

O BrazaChat deve ter uma interface limpa, funcional e focada em produtividade. O operador trabalha o dia inteiro na plataforma — cada clique a menos importa. A referência visual principal é o WhatsApp Web para a Inbox, combinada com o padrão de dashboard do Braza Tracker para os demais módulos.

### Key Interaction Paradigms

- **Inbox-centric:** A Inbox é o coração do produto — o operador passa 80% do tempo ali. Navegação rápida entre conversas, botões de evento sempre visíveis, zero fricção
- **Click-to-action:** Eventos de conversão (AddToCart, InitiateCheckout, Purchase) devem ser um único clique, não formulários
- **Sidebar navigation:** Menu lateral fixo 220px com ícones Lucide para todos os módulos (padrão Braza Tracker), colapsável em telas menores
- **Contextual data:** Informações do lead (produto, campanha, criativo) sempre visíveis no topo da conversa, sem precisar navegar para outra tela

### Core Screens and Views

| Tela | Propósito | Prioridade MVP |
|------|-----------|----------------|
| ~~Login (Facebook OAuth)~~ | ~~Autenticação via Meta~~ | Removido v1 — sem tela de login nesta versão |
| Dashboard | Métricas gerais: leads, conversões, revenue | P0 |
| Campaigns | Criar/listar campanhas com links de tracking | P0 |
| Products | CRUD de produtos com template de mensagem | P0 |
| Inbox | Lista de conversas + chat + botões de evento | P0 |
| Leads | Lista de todos os leads com filtros | P1 |
| Orders | Lista de pedidos com status e gestão de envio | P0 |
| Ad Accounts | Contas conectadas e pixels | P0 |
| Pixels | Listagem de pixels por ad account | P1 |
| Events | Log de eventos enviados para Meta | P1 |
| AI Insights | Dashboard de insights da IA | P2 |
| Teste | Testar recebimento de UTMs e envio de conversões CAPI | P1 |
| Settings | Configurações da conta e integrações | P1 |

### Accessibility

WCAG AA — Contraste adequado, navegação por teclado funcional, labels em formulários. O Design System Braza já atende AA em dark mode por padrão.

### Target Devices and Platforms

Web Responsive — Prioridade desktop (operadores trabalham em computador), com layout responsivo para tablet. Mobile não é prioridade MVP.

---

## 4. Technical Assumptions

### Repository Structure: Monorepo

```
braza.chat/
├── packages/
│   ├── api/          # NestJS backend
│   ├── web/          # Next.js frontend
│   └── shared/       # Types, utils, constants compartilhados
├── docs/             # PRD, architecture, stories
├── tests/            # E2E tests
└── package.json      # Workspace root
```

### Service Architecture: Monolith Modular (NestJS)

Um único serviço NestJS com módulos bem separados:

| Módulo NestJS | Responsabilidade |
|---------------|-----------------|
| `auth` | Facebook OAuth, JWT sessions |
| `meta` | Meta Marketing API, Ad Accounts, Pixels |
| `campaigns` | CRUD campanhas, geração de links de tracking |
| `tracking` | Captura de cliques, redirect para WhatsApp |
| `whatsapp` | Z-API integration, webhooks, envio/recebimento de mensagens |
| `inbox` | WebSocket para chat real-time |
| `events` | Conversion API, fila de eventos (Redis/BullMQ) |
| `orders` | Pedidos, status, etiquetas |
| `leads` | Gestão de leads |
| `products` | CRUD produtos |
| `ai` | Análise de conversas (fase posterior) |

### Tech Stack

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Backend Runtime | Node.js | 24.x | Já instalado no ambiente |
| Backend Framework | NestJS | 11.x | Modular, TypeScript nativo, DI |
| Frontend Framework | Next.js | 15.x | App Router, SSR, RSC |
| UI Library | React | 19.x | Ecossistema maduro |
| Styling | TailwindCSS | 4.x | Utility-first |
| UI Components | shadcn/ui | latest | Acessíveis, customizáveis |
| Database | PostgreSQL | 16.x | Via Supabase (managed) |
| ORM | Prisma | 6.x | Type-safe, migrations |
| Cache/Filas | Redis + BullMQ | 7.x / 5.x | Fila de eventos, cache |
| Real-time | Socket.io | 4.x | WebSocket para Inbox |
| Auth | Passport.js + JWT | latest | Facebook Strategy + JWT |
| HTTP Client | Axios | 1.x | Meta APIs |
| Validation | class-validator + Zod | latest | Backend + Frontend |

### External Integrations

| API | Uso | Autenticação |
|-----|-----|-------------|
| Meta Marketing API | Listar Ad Accounts, Pixels, Campaigns | OAuth token do usuário |
| Meta Conversion API | Enviar eventos server-side | Access token + pixel_id |
| Z-API | Receber/enviar mensagens WhatsApp via REST API + webhooks | Instance ID + Token + Client-Token (configuráveis em Settings > WhatsApp) |
| Facebook Login | Autenticação OAuth | App ID + App Secret |

### Testing Requirements: Unit + Integration

| Tipo | Escopo | Ferramenta | Cobertura Alvo |
|------|--------|-----------|----------------|
| Unit | Services, utils, validators | Jest | 70% do backend |
| Integration | API endpoints, DB queries | Jest + Supertest | Endpoints críticos |
| E2E | Fluxos principais | Playwright | Smoke tests |
| Manual | WhatsApp webhook, Meta OAuth | — | Checklist |

### Additional Technical Assumptions

### Deployment Architecture

```
┌─────────────────────────────────────────────┐
│  Vercel (Frontend)                          │
│  - Next.js 15 (App Router)                  │
│  - Domínio: app.brazachat.shop              │
│  - Variável: NEXT_PUBLIC_API_URL            │
│  - Static assets + SSR                      │
└──────────────┬──────────────────────────────┘
               │ HTTPS (CORS configurado)
┌──────────────▼──────────────────────────────┐
│  Hetzner VPS (Backend + Database)           │
│  - NestJS 11 (API + WebSocket + Workers)    │
│  - Domínio: api.brazachat.shop              │
│  - PM2 process manager                      │
│  - Nginx reverse proxy + Let's Encrypt SSL  │
│  - PostgreSQL local                         │
│  - Prisma ORM (prisma db push)              │
│  - Webhook endpoint: /webhook/z-api         │
│  - Upload files: /uploads/media/ (VPS disk) │
│  - Node.js 22.x                             │
│  - OptionalAuthGuard (JWT + DEFAULT_USER_ID)│
└─────────────────────────────────────────────┘

Domínios (3 — todos com SSL Let's Encrypt):
  app.brazachat.shop   → Frontend (Vercel)
  api.brazachat.shop   → Backend API + WebSocket (Hetzner)
  link.brazachat.shop  → Tracking redirect (mesmo backend,
                          rota /c/:code)
```

### Additional Technical Assumptions

- **Domínio de tracking:** `link.brazachat.shop` registrado e configurado com SSL válido. Este domínio aponta para o mesmo backend (Hetzner VPS) e a rota `/c/:code` usa cache Redis para garantir < 500ms
- **Webhook Z-API (dev):** Usar ngrok ou Cloudflare Tunnel para expor localhost. Registrar URL via API Z-API `PUT /update-webhook-received`
- **Webhook Z-API (prod):** URL fixa em `https://api.brazachat.shop/webhook/z-api` — registrada automaticamente na Z-API ao salvar credenciais em Settings > WhatsApp
- Database hosting: PostgreSQL local na Hetzner VPS (Prisma ORM, `prisma db push` para migrations)
- WhatsApp: Z-API (SaaS) — REST API para envio/recebimento de mensagens. Sem dependência direta da WhatsApp Cloud API
- Rate limiting: endpoint de tracking (100 req/s por IP) e webhook (rate limiter independente)
- CORS: `app.brazachat.shop` autorizado a acessar `api.brazachat.shop`
- Logging: Pino para logs estruturados desde Epic 1 (mais performante que Winston para NestJS)
- Error tracking: Sentry para capturar erros em produção
- **Criptografia:** CryptoService com AES-256-GCM para tokens Meta. Chave via `ENCRYPTION_KEY` env var
- **Autenticação v1:** OptionalAuthGuard (JWT cookie + DEFAULT_USER_ID fallback). Quando multi-tenant for implementado, substituir por JwtAuthGuard obrigatório

---

## 5. Meta Ads Compliance Requirements

### 5.1 Link Structure & Redirect Policy

- Todos os links de tracking devem usar **HTTPS** obrigatório (HTTP será rejeitado pela Meta)
- O domínio de tracking deve ter **certificado SSL válido**
- O redirect (302) de tracking → WhatsApp é permitido desde que o anúncio indique claramente que o destino é WhatsApp
- O domínio de tracking deve ter uma **política de privacidade** acessível: `https://link.brazachat.shop/privacy` (implementada com texto LGPD)
- Links não devem conter conteúdo enganoso — o destino real (WhatsApp) deve ser transparente

### 5.2 UTM Parameters — Geração Automática

O sistema gera UTMs automaticamente para cada campanha:

| Parâmetro | Valor Auto-gerado | Exemplo |
|-----------|-------------------|---------|
| `utm_source` | `facebook` ou `instagram` | `facebook` |
| `utm_medium` | `paid_social` (fixo) | `paid_social` |
| `utm_campaign` | Nome da campanha no CRM | `braincaps-janeiro` |
| `utm_content` | Nome do criativo | `video-depoimento-01` |
| `utm_term` | Nome do adset | `interesse-saude-25-45` |

**Link completo gerado:**
```
https://link.brazachat.shop/c/ABX92?utm_source=facebook&utm_medium=paid_social&utm_campaign=braincaps-janeiro&utm_content=video-depoimento-01&utm_term=interesse-saude-25-45
```

Os UTMs são armazenados no registro de Click e propagados para Lead, permitindo análise completa de origem.

### 5.3 Conversion API (CAPI) — Compliance

**Formato obrigatório do `fbc`:** `fb.1.{unix_timestamp_ms}.{fbclid}`
**Formato obrigatório do `fbp`:** `fb.1.{unix_timestamp_ms}.{random_10_digits}`

**Campos que requerem SHA-256 antes do envio:**
- `ph` (telefone) — normalizar: remover espaços, hífens, parênteses, incluir código do país
- `em` (email) — normalizar: lowercase, trim
- `fn` (primeiro nome) — normalizar: lowercase, trim
- `ln` (sobrenome) — normalizar: lowercase, trim
- `external_id` — hash recomendado

**Campos que NÃO devem ser hasheados:**
- `client_ip_address`, `client_user_agent`, `fbc`, `fbp`

**Campos obrigatórios por evento web:**
- `event_name`, `event_time`, `action_source=website`, `event_source_url`, `client_user_agent`

**Deduplicação:**
- Todo evento deve incluir `event_id` único
- Meta deduplica eventos com mesmo `event_id` + `event_name` dentro de 48h
- Enviar eventos preferencialmente em até 1 hora após ocorrência

### 5.4 Privacidade & LGPD

- O domínio de tracking deve informar sobre coleta de dados (fbclid, IP, user agent)
- Dados pessoais (telefone, email) devem ser hasheados (SHA-256) antes de envio para terceiros
- Política de retenção de dados deve ser clara e acessível
- Operadores devem ter mecanismo para deletar dados de um lead (direito ao esquecimento)

---

## 6. Out of Scope (MVP)


As seguintes features **não** fazem parte do MVP e serão consideradas para versões futuras:

- **Mobile nativo** (app iOS/Android) — operadores usam desktop
- **Chatbot automático** — IA é apenas analítica, não responde clientes
- **Multi-idioma** — MVP apenas em português
- **Integração com transportadoras** (Correios, Jadlog) — etiquetas geradas como PDF simples
- **Criação automática de instâncias Z-API** (multi-tenant SaaS) — MVP com instância configurada manualmente pelo operador. Fase SaaS: BrazaChat cria instância automaticamente no cadastro do cliente, cliente só escaneia QR Code
- **WhatsApp com múltiplos números simultâneos** — MVP com 1 instância Z-API (1 número) por operador
- **Billing/Subscription** — MVP sem cobrança (validação primeiro)
- **White-label** — sem customização de marca para clientes
- **Importação de leads de outras fontes** — apenas via click tracking
- **Relatórios PDF exportáveis** — apenas dashboard on-screen + CSV export de leads

---

## 7. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Meta API rate limits bloqueiam envio de eventos | Alto | Média | Fila com backoff exponencial, rate limiting interno (10 events/sec) |
| Z-API indisponível ou muda termos/preço | Alto | Baixa | Abstrair integração em módulo isolado (WhatsApp Service interface), permitindo trocar provider (Z-API → Evolution API → Cloud API) sem alterar lógica de negócio |
| Token OAuth expira e operador não reconecta | Médio | Alta | Alerta no dashboard, refresh token automático quando possível |
| Click_id não encontrado na mensagem do lead | Médio | Média | Criar lead "órfão" para triagem manual, melhorar encoding do click_id |
| Volume alto de webhooks sobrecarrega backend | Alto | Média | Processamento assíncrono via Redis, auto-scaling no deployment |

---

## 8. Epic List

| Epic | Título | Goal |
|------|--------|------|
| Epic 1 | Foundation & Setup | Setup do projeto, Ad Accounts/Pixels (OAuth backend only — sem tela de login v1) |
| Epic 2 | Products, Campaigns & Tracking | CRUD produtos/campanhas, links de tracking, redirect WhatsApp |
| Epic 3 | WhatsApp Inbox & Conversations | Z-API integration, inbox real-time, ViewContent auto-event |
| Epic 4 | Conversion Events & Meta API | Botões de evento, Conversion API via fila, log de eventos |
| Epic 5 | Orders & Shipping | Pedidos automáticos, endereço, etiquetas, status tracking |
| Epic 6 | Dashboard, Leads & Analytics | Dashboard métricas, leads com funil, AI Insights passivo |

---

## 9. Epic Details

---

### Epic 1: Foundation & Auth

**Goal:** Estabelecer a fundação técnica do projeto (monorepo, database, CI/CD) e configurar a integração com Meta API (OAuth backend). Ao final deste epic, a infraestrutura está pronta e o sistema pode conectar-se a contas de anúncio. Sem tela de login no frontend nesta versão — acesso direto.

#### Story 1.1: Project Setup & Monorepo Structure

> As a **developer**,
> I want a configured monorepo with backend (NestJS), frontend (Next.js), and shared package,
> so that the entire team has an organized and functional codebase from day one.

**Acceptance Criteria:**

1. Monorepo inicializado com npm workspaces contendo `packages/api`, `packages/web` e `packages/shared`
2. `packages/api` contém NestJS app funcional com health-check endpoint (`GET /health` retorna `{ status: "ok" }`)
3. `packages/web` contém Next.js app com App Router, TailwindCSS e shadcn/ui configurados, exibindo página inicial com texto "BrazaChat"
4. `packages/shared` exporta ao menos um type TypeScript importável por api e web
5. Scripts no root `package.json`: `dev`, `build`, `lint`, `test`, `typecheck` funcionando para ambos os packages
6. ESLint + Prettier configurados com regras consistentes entre api e web
7. `.env.example` atualizado com variáveis necessárias para ambos os packages (incluindo `ENCRYPTION_KEY` para criptografia de tokens)
8. `npm run dev` no root inicia api (porta 3001) e web (porta 3000) simultaneamente
9. `CryptoService` implementado no backend com AES-256-GCM para encrypt/decrypt de tokens Meta (usado pelo auth module)
10. `TenantGuard` implementado como NestJS Guard global que injeta `userId` do JWT em toda request autenticada, garantindo isolamento multi-tenant

#### Story 1.2: Database Schema & Prisma Setup

> As a **developer**,
> I want Prisma configured with PostgreSQL and base models created,
> so that the backend has functional data persistence from the start.

**Acceptance Criteria:**

1. Prisma inicializado em `packages/api` com datasource PostgreSQL (connection string via `DATABASE_URL`)
2. Schema contém os modelos: `User`, `AdAccount`, `Pixel`, `Product`, `Campaign`, `Click`, `Lead`, `Conversation`, `Message`, `Event`, `Order`, `AiInsight`
3. Relacionamentos implementados conforme hierarquia: AdAccount → Pixel → Campaign → Lead → Conversation → Event → Order
4. Modelo `Click` contém campos adicionais de compliance: fbc (formato `fb.1.ts.fbclid`), fbp (formato `fb.1.ts.random`), utm_source, utm_medium, utm_campaign, utm_content, utm_term
5. Modelo `User` contém campos: id, email, name, facebookId, accessToken (encrypted), refreshToken, createdAt, updatedAt
6. Migration inicial criada e aplicável com `npx prisma migrate dev`
7. Prisma Client gerado e injetável como NestJS service (`PrismaService`)
8. Seed script básico com ao menos 1 user de teste
9. Types do Prisma exportados via `packages/shared` para uso no frontend

#### Story 1.3: CI/CD Pipeline & GitHub Actions

> As a **developer**,
> I want a CI/CD pipeline that validates code on every push,
> so that errors are detected before reaching the main branch.

**Acceptance Criteria:**

1. GitHub Actions workflow (`.github/workflows/ci.yml`) dispara em push e PR para `main`
2. Pipeline executa em sequência: install → lint → typecheck → test → build
3. Pipeline roda para ambos os packages (api e web)
4. Cache de `node_modules` configurado para acelerar builds subsequentes
5. Pipeline falha se qualquer step falhar (lint errors, type errors, test failures, build errors)
6. Badge de status do CI visível no README.md
7. Tempo total do pipeline abaixo de 5 minutos

#### Story 1.4: Facebook OAuth Authentication

> **⚠️ NOTA v1:** Sem tela de login dedicada. O sistema opera com `OptionalAuthGuard` — tenta JWT cookie primeiro (setado pelo OAuth), fallback para `DEFAULT_USER_ID` (single-tenant). Botão "Conectar Facebook" está em Settings > Integrations.

> As a **user**,
> I want to connect my Facebook account to the system via OAuth,
> so that the system can access my ad accounts, pixels, and use the Conversion API.

**Acceptance Criteria:**

1. Botão "Conectar Facebook" em Settings > Integrations redireciona para `{API_URL}/auth/facebook` (fluxo OAuth real)
2. Fluxo OAuth backend: Facebook → callback → salva tokens → seta JWT cookie (httpOnly, secure, domain=.brazachat.shop, 7 dias) → redireciona para `/settings?tab=integrations`
3. Permissões solicitadas: `email`, `ads_management`, `ads_read`, `business_management` (WhatsApp gerenciado via Z-API, sem necessidade de permissão Meta)
4. Ao conectar pela primeira vez, cria registro `User` com facebookId, email e name
5. Ao reconectar, atualiza accessToken e refreshToken do usuário existente (encontra pelo facebookId)
6. AccessToken e refreshToken criptografados com `CryptoService` (AES-256-GCM) antes de persistir no banco — nunca armazenados em plaintext
7. Token JWT em httpOnly cookie com domain=`.brazachat.shop` (compartilhado entre api. e app. subdomínios), expiração 7 dias
8. Endpoint `GET /auth/me` retorna dados do usuário: id, name, email, facebookId, facebookConnected (boolean baseado em accessToken), timezone. Parseia JWT cookie se disponível, fallback para DEFAULT_USER_ID
9. Rotas protegidas usam `OptionalAuthGuard` — tenta JWT, fallback para DEFAULT_USER_ID. Nunca retorna 401 na v1
10. Settings > Integrations mostra status Conectado/Desconectado, nome e email do Facebook, permissões ativas
11. Botão "Desconectar Facebook" chama `POST /users/facebook/disconnect` — revoga token na Meta API, limpa accessToken/refreshToken do banco, mantém facebookId e dados históricos

#### Story 1.5: Ad Accounts & Pixels — Meta API Integration

> As an **authenticated user**,
> I want to see my Facebook Ad Accounts and Pixels listed in the system,
> so that I can choose which accounts to use in my campaigns.

**Acceptance Criteria:**

1. Endpoint `GET /meta/ad-accounts` busca ad accounts via Meta Marketing API usando o accessToken do usuário
2. Endpoint `GET /meta/ad-accounts/:id/pixels` busca pixels vinculados a uma ad account
3. Ad accounts e pixels são salvos/atualizados no banco local (cache) após cada fetch
4. Tela "Ad Accounts" no frontend lista todas as ad accounts com nome, id e status
5. Ao clicar numa ad account, exibe os pixels vinculados
6. Botão "Sincronizar" para forçar re-fetch da Meta API
7. Tratamento de erro se token expirado — exibe mensagem pedindo re-autenticação
8. Loading states visíveis durante fetch da Meta API

---

### Epic 2: Products, Campaigns & Tracking

**Goal:** Implementar os módulos de produtos e campanhas com geração de links de tracking, captura de cliques e redirecionamento para WhatsApp. Ao final deste epic, o operador cria um produto, vincula a uma campanha, e leads clicam no link e são redirecionados para WhatsApp com mensagem personalizada.

#### Story 2.1: Products CRUD

> As an **operator**,
> I want to create and manage my products in the system,
> so that I can link them to campaigns and generate personalized WhatsApp messages.

**Acceptance Criteria:**

1. Endpoints REST: `POST /products`, `GET /products`, `GET /products/:id`, `PATCH /products/:id`, `DELETE /products/:id`
2. Campos do produto: name, price, currency (BRL default), whatsappPhone, messageTemplate
3. messageTemplate suporta variável `{product}` que será substituída pelo nome do produto
4. Validação: name obrigatório, price > 0, whatsappPhone no formato internacional (+5511999999999), messageTemplate obrigatório
5. Tela "Products" no frontend com listagem em tabela (nome, preço, telefone)
6. Modal/drawer para criar e editar produto com formulário validado
7. Confirmação antes de deletar produto
8. Produtos vinculados a campanhas não podem ser deletados (soft block com mensagem)

#### Story 2.2: Campaign Creation with Pixel Dropdown

> As an **operator**,
> I want to create campaigns linking product, ad account, pixel, and ad data,
> so that each campaign has a trackable tracking link.

**Acceptance Criteria:**

1. Endpoints REST: `POST /campaigns`, `GET /campaigns`, `GET /campaigns/:id`, `PATCH /campaigns/:id`, `DELETE /campaigns/:id`
2. Campos: name, productId, adAccountId, pixelId
3. Dropdown de Ad Account carrega apenas contas do usuário autenticado
4. Dropdown de Pixel filtra automaticamente pelos pixels da Ad Account selecionada (FR8)
5. Dropdown de Product carrega produtos do usuário
6. Ao criar campanha, gera automaticamente um `trackingCode` único (ex: `ABX92`, 5-6 chars alfanuméricos)
7. UTMs são capturados diretamente da URL do clique vindo do Facebook (nomes reais de campanha, grupo de anúncio e criativo conforme configurados na Meta Ads). Template de UTMs padrão exibido para o operador copiar e colar no Facebook Ads Manager
8. Após criação, exibir painel "Link de Campanha" com:
   - Link da campanha clicável (clique para copiar): `https://link.brazachat.shop/c/{trackingCode}`
   - Template UTMs padrão clicável (clique para copiar): `utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}`
   - Instrução: "Cole no campo URL Parameters do Facebook Ads Manager"
   - Preview da mensagem WhatsApp que o lead vai receber ao clicar
   - Botão "Testar Link" que abre o link numa nova aba para o operador verificar o redirect
9. Tela "Campaigns" com listagem em tabela: checkbox de seleção, nome, produto, ad account, link curto (clique para copiar), total de cliques, leads, taxa de conversão
10. Checkbox individual por campanha + checkbox "selecionar todas" no header da tabela
11. Botão "Excluir selecionadas" aparece quando há campanhas selecionadas — confirmação antes de deletar. Endpoint `DELETE /campaigns/:id` remove campanha e clicks relacionados
12. Detalhe da campanha (drawer ao clicar): métricas (cliques, leads, conversão), link clicável para copiar, UTMs clicável para copiar, botão testar link
13. Validação: todos os campos obrigatórios, pixelId deve pertencer ao adAccountId selecionado

#### Story 2.3: Click Tracking & WhatsApp Redirect

> As a **lead**,
> I want to click on an ad link and be redirected to WhatsApp with a ready message,
> so that I can start a conversation about the product that interested me.

**Acceptance Criteria:**

1. Endpoint `GET /c/:trackingCode` público (sem autenticação) via HTTPS obrigatório processa o clique. Servido em `link.brazachat.shop`
2. Lookup do trackingCode primeiro no Redis (cache), fallback para PostgreSQL se cache miss. Resultado cacheado em Redis com TTL 1h
3. Sistema captura e salva no registro Click: fbclid (query param), ip, userAgent, timestamp, e todos os UTM parameters (utm_source, utm_medium, utm_campaign, utm_content, utm_term)
4. Sistema gera click_id único no formato `ck_XXXXXXX` (7 chars alfanuméricos)
5. Sistema formata `fbc` no padrão Meta: `fb.1.{timestamp_unix_ms}.{fbclid}` e gera `fbp`: `fb.1.{timestamp_unix_ms}.{random_10_digits}` — ambos salvos no Click para envio posterior via CAPI
6. Redirect HTTP 302 para `https://wa.me/{whatsappPhone}?text={encodedMessage}`
7. Mensagem montada a partir do messageTemplate do produto, com `{product}` substituído pelo nome
8. Click_id incluído na mensagem de forma discreta (ex: como sufixo codificado ou parâmetro)
9. Tempo total de processamento do redirect < 500ms (NFR1) — garantido pelo cache Redis
10. Se trackingCode inválido, retorna página 404 amigável
11. Se fbclid ausente, registra o clique mesmo assim (fbc/fbp ficam null — evento CAPI será marcado como skipped)
12. Rate limiting: máximo 100 requests/segundo por IP para prevenir abuso (rate limiter independente)
13. Endpoint deve ser servido via domínio com SSL válido e política de privacidade acessível (compliance Meta + LGPD)

#### Story 2.4: Leads Module — Auto-creation from Clicks

> As an **operator**,
> I want leads to be automatically created from clicks,
> so that I have visibility of all potential customers from first contact.

**Acceptance Criteria:**

1. Ao registrar um Click, o sistema cria ou atualiza um Lead vinculado à campanha
2. Lead identificado por phone (extraído quando mensagem WhatsApp chegar) ou por click_id temporariamente
3. Lead contém: phone (nullable até mensagem chegar), campaignId, productId, clickId, fbclid, ip, userAgent, status (new/contacted/converted/lost), createdAt
4. Endpoint `GET /leads` com filtros: campaignId, productId, status, dateRange
5. Endpoint `GET /leads/:id` retorna lead com clicks e conversations associados
6. Tela "Leads" no frontend com tabela filtrável: nome/telefone, produto, campanha, status, data
7. Lead status atualiza automaticamente: `new` → `contacted` (quando conversa inicia)
8. Contagem de leads visível na tela de Campaigns (total por campanha)

---

### Epic 3: WhatsApp Inbox & Conversations

**Goal:** Integrar com Z-API para receber e enviar mensagens WhatsApp, vincular leads aos cliques via click_id, e entregar uma Inbox real-time estilo WhatsApp Web. Ao final deste epic, o operador recebe mensagens dos leads e responde direto pelo CRM.

#### Story 3.1: Z-API Webhook Setup & Message Reception

> As a **developer**,
> I want to configure the Z-API webhook to receive WhatsApp messages in the backend,
> so that the system captures all messages sent by leads.

**Acceptance Criteria:**

1. Endpoint `POST /webhook/z-api` recebe notificações de mensagens da Z-API (JSON direto, sem validação HMAC)
2. Webhook processa tipos de mensagem: text (campo `text.message`), image (`image.imageUrl`), audio (`audio.audioUrl`), document (`document.documentUrl`)
3. Payload da Z-API mapeado para modelo interno: `phone` → telefone do lead, `messageId` → whatsappMsgId, `momment` → timestamp, `chatName`/`senderName` → nome do lead, `fromMe` → direction (inbound/outbound)
4. Ao receber primeira mensagem de um número, sistema tenta vincular ao Lead existente via click_id extraído do campo `text.message`
5. Se click_id encontrado na mensagem, associa conversation ao lead/click correspondente
6. Se click_id não encontrado, cria lead órfão com status `unmatched` para triagem manual
7. Mensagem recebida salva no banco: conversationId, content, type (text/image/audio/document), direction (inbound), timestamp, mediaUrl (se mídia)
8. Logs estruturados para cada webhook recebido (debug de integração)
9. Retorna HTTP 200 imediatamente e processa mensagem de forma assíncrona (fila Redis) para não bloquear webhook
10. Na inicialização do backend, registra a webhook URL na Z-API via `PUT https://api.z-api.io/instances/{instanceId}/token/{token}/update-webhook-received` com header `Client-Token`
11. Webhook URL em produção: `https://api.brazachat.shop/webhook/z-api` (URL pública estável no Railway). Em dev: ngrok ou Cloudflare Tunnel
12. Rate limiter independente no endpoint webhook (separado das rotas autenticadas) — protege contra flood

#### Story 3.2: Send Messages via Z-API

> As an **operator**,
> I want to send messages to leads directly from the CRM,
> so that I can respond without leaving the system.

**Acceptance Criteria:**

1. Endpoint `POST /conversations/:id/messages` envia mensagem via Z-API: `POST https://api.z-api.io/instances/{instanceId}/token/{token}/send-text` com header `Client-Token`
2. Payload Z-API: `{ "phone": "{leadPhone}", "message": "{content}" }`
3. Mensagem enviada salva no banco com direction `outbound`, status `sent`, e `zaapId` + `messageId` da resposta Z-API
4. Webhook de status update (delivery) via Z-API atualiza status da mensagem no banco
5. Se envio falhar (instância desconectada, número inválido), retorna erro descritivo ao frontend
6. Validação: conversationId deve existir e pertencer ao usuário autenticado
7. Mensagens suportadas no MVP: texto, imagem, áudio e documento (Z-API suporta todos nativamente)
8. Rate limiting por conversa: máximo 30 mensagens/minuto

#### Story 3.3: Inbox UI — Conversation List

> As an **operator**,
> I want to see the list of all active conversations in the Inbox sidebar,
> so that I can quickly navigate between leads.

**Acceptance Criteria:**

1. Endpoint `GET /conversations` retorna conversas do usuário autenticado ordenadas por última mensagem (mais recente primeiro)
2. Cada item da lista exibe apenas: nome ou telefone do lead + nome do produto entre colchetes (FR9)
3. Sem preview de mensagem na lista (design conforme especificação)
4. Indicador visual de mensagens não lidas (badge numérico ou dot)
5. Sidebar ocupa ~30% da tela em desktop, lista scrollável
6. Clicar numa conversa carrega o chat no painel direito
7. Filtro por produto (dropdown no topo da sidebar)
8. Busca por nome/telefone do lead
9. Paginação infinita (scroll para carregar mais conversas)
10. Estado vazio: "Nenhuma conversa ainda — crie uma campanha e compartilhe o link"

#### Story 3.4: Inbox UI — Chat View & Real-time Messages

> As an **operator**,
> I want to see and respond to messages in real-time within the conversation,
> so that the experience is fluid like WhatsApp Web.

**Acceptance Criteria:**

1. Painel de chat ocupa ~70% da tela à direita da sidebar
2. Topo do chat exibe: nome do lead, produto, campanha e criativo (FR10)
3. Mensagens exibidas em bolhas: inbound à esquerda (cinza), outbound à direita (azul/verde)
4. Cada mensagem exibe: conteúdo, horário, status (sent/delivered/read com ícones check)
5. Campo de input na parte inferior com botão enviar e suporte a Enter para enviar
6. WebSocket (Socket.io) autenticado via JWT no handshake (`client.handshake.auth.token`). Conexão rejeitada se token inválido ou expirado
7. Cada socket associado ao userId do operador — só recebe eventos das suas próprias conversas (isolamento multi-tenant no real-time)
8. Novas mensagens (recebidas via webhook Z-API) aparecem instantaneamente na conversa aberta e atualizam a sidebar
9. Auto-scroll para última mensagem ao abrir conversa e ao receber nova mensagem
10. Loading skeleton ao carregar histórico de mensagens
11. Histórico de mensagens paginado (scroll up para carregar mensagens anteriores)

#### Story 3.5: ViewContent Auto-event on First Message

> As an **operator**,
> I want the ViewContent event to be fired automatically when the lead sends the first message,
> so that Meta registers the interest without manual action from me.

**Acceptance Criteria:**

1. Ao receber a primeira mensagem de um lead vinculado (com click_id), sistema dispara evento ViewContent automaticamente
2. Evento enfileirado no Redis/BullMQ (não bloqueia o processamento do webhook)
3. Evento contém: event_name=ViewContent, event_time, fbclid, ip, user_agent (do click original), phone_hash (SHA256), click_id
4. Registro criado na tabela Event: leadId, conversationId, type=ViewContent, sentToMeta=pending
5. Não dispara ViewContent duplicado se lead já tem este evento
6. Se lead não tem fbclid (clique orgânico), evento é criado localmente mas não enviado para Meta
7. Log do evento para auditoria

---

### Epic 4: Conversion Events & Meta API

**Goal:** Implementar os botões de evento na conversa (AddToCart, InitiateCheckout, Purchase), enviar eventos para Meta Conversion API via fila assíncrona com retry, e fornecer um log de eventos auditável. Ao final deste epic, o loop de atribuição está completo.

#### Story 4.1: Conversion Event Buttons in Chat

> As an **operator**,
> I want AddToCart, InitiateCheckout, and Purchase buttons at the bottom of the chat,
> so that I can mark the conversion stage with a single click.

**Acceptance Criteria:**

1. Três botões visíveis abaixo do campo de input do chat: AddToCart, InitiateCheckout, Purchase (FR11)
2. Botões com cores distintas: AddToCart (amarelo), InitiateCheckout (laranja), Purchase (verde)
3. Ao clicar, modal de confirmação: "Marcar {eventName} para {leadName}?" com botão confirmar
4. Endpoint `POST /conversations/:id/events` cria evento com type, value (opcional) e currency
5. Para Purchase, campo `value` é pré-preenchido com preço do produto e `currency` com moeda do produto
6. Após confirmar, botão mostra feedback visual e evento aparece como mensagem de sistema no chat
7. Eventos seguem ordem lógica: não permitir Purchase sem InitiateCheckout prévio, nem InitiateCheckout sem AddToCart
8. Botão do evento já registrado fica desabilitado com ícone check (não permite duplicação)
9. Eventos salvos na tabela Event: leadId, conversationId, type, value, currency, sentToMeta=pending, createdAt

#### Story 4.2: Meta Conversion API — Event Queue & Delivery

> As a **system**,
> I want to send conversion events to Meta via Conversion API asynchronously and reliably,
> so that no conversion is lost and Meta's algorithm optimizes correctly.

**Acceptance Criteria:**

1. Job BullMQ `send-meta-event` processa eventos com status `pending` da tabela Event
2. Payload enviado para Meta Conversion API (`POST https://graph.facebook.com/v21.0/{pixel_id}/events`) com compliance total:
   - `event_name`: ViewContent/AddToCart/InitiateCheckout/Purchase
   - `event_time`: Unix timestamp do momento do evento
   - `action_source`: "website"
   - `event_source_url`: URL do link de tracking original
   - `event_id`: ID único do evento (para deduplicação — window de 48h)
   - `user_data.client_ip_address`: IP do click (sem hash)
   - `user_data.client_user_agent`: User agent do click (sem hash)
   - `user_data.fbc`: Formato `fb.1.{timestamp}.{fbclid}` (sem hash)
   - `user_data.fbp`: Formato `fb.1.{timestamp}.{random}` (sem hash)
   - `user_data.ph`: Telefone normalizado + SHA-256
   - `user_data.em`: Email normalizado + SHA-256 (se disponível)
   - `user_data.external_id`: click_id com SHA-256
   - `custom_data.value`: Valor da conversão
   - `custom_data.currency`: Moeda (BRL)
3. Normalização antes do hash: telefone sem espaços/hífens/parênteses com código do país, email lowercase sem espaços
4. Pixel ID obtido da campanha vinculada ao lead
5. Access token obtido da ad account do usuário (via tabela AdAccount)
6. Em caso de sucesso (HTTP 200), atualiza Event: sentToMeta=sent, metaResponse armazenado, event_match_quality score registrado
7. Em caso de falha, retry automático com backoff exponencial: 3 tentativas (30s, 2min, 10min)
8. Após 3 falhas, marca Event: sentToMeta=failed, erro logado para diagnóstico
9. Se lead não tem fbc (sem fbclid), evento é marcado sentToMeta=skipped (Meta rejeita eventos sem identificadores suficientes)
10. Fila processa no máximo 10 eventos/segundo para respeitar rate limits da Meta API
11. Log estruturado para cada envio: eventId, pixelId, status, responseTime, eventMatchQuality
12. Eventos devem ser enviados em near real-time (preferencialmente em até 1 hora após ocorrência, conforme best practice Meta)

#### Story 4.3: Events Log & Monitoring

> As an **operator**,
> I want to see the history of all events sent to Meta,
> so that I can audit conversions and identify delivery failures.

**Acceptance Criteria:**

1. Endpoint `GET /events` com filtros: campaignId, type, sentToMeta, dateRange
2. Tela "Events" no frontend com tabela: lead, produto, campanha, tipo de evento, valor, status de envio, data
3. Badge de status colorido: sent (verde), pending (amarelo), failed (vermelho), skipped (cinza)
4. Ao clicar num evento, drawer/modal mostra detalhes completos: payload enviado, resposta da Meta, horário de cada tentativa
5. Contador no topo da tela: total de eventos, taxa de sucesso (%), eventos com falha
6. Botão "Reenviar" para eventos com status `failed` — reenfileira no BullMQ
7. Paginação com 50 eventos por página
8. Dados de eventos também acessíveis via endpoint `GET /leads/:id/events`

---

### Epic 5: Orders & Shipping

**Goal:** Implementar criação automática de pedidos ao marcar Purchase, coleta de dados de envio, geração de etiquetas e tracking de status. Ao final deste epic, o operador gerencia todo o fulfillment dentro do CRM.

#### Story 5.1: Auto-create Order on Purchase Event

> As an **operator**,
> I want an order to be automatically created when I mark Purchase in a conversation,
> so that I don't need to manually register orders.

**Acceptance Criteria:**

1. Ao criar evento Purchase (Story 4.1), sistema cria automaticamente um registro Order vinculado ao lead e conversation
2. Order contém: leadId, conversationId, productId, value, currency, status=`awaiting_address`, createdAt
3. Dados pré-preenchidos do lead: phone, productName, campaignName
4. Após criação do pedido, mensagem de sistema aparece no chat: "Pedido #ORD-XXXX criado"
5. Order ID gerado no formato legível: `ORD-` + 4 dígitos sequenciais (ex: ORD-0001)
6. Notificação visual na sidebar da Inbox indicando que a conversa tem pedido associado
7. Não permite criar segundo pedido na mesma conversa sem cancelar o anterior

#### Story 5.2: Order Address Collection & Management

> As an **operator**,
> I want to fill in the order shipping data,
> so that I can generate the shipping label and dispatch the product.

**Acceptance Criteria:**

1. Endpoint `PATCH /orders/:id` aceita atualização de dados de envio: fullName, address, city, state, zipCode, country
2. Tela de detalhes do pedido acessível via tela "Orders" ou via link no chat
3. Formulário de endereço com campos: nome completo, endereço, cidade, estado (dropdown UFs), CEP, país
4. Validação de CEP: formato XXXXX-XXX para Brasil
5. Ao salvar endereço, status atualiza de `awaiting_address` → `address_complete`
6. Campos de endereço editáveis enquanto status não for `shipped` ou `delivered`
7. Botão "Copiar endereço" para clipboard formatado

#### Story 5.3: Shipping Labels & Order Status Tracking

> As an **operator**,
> I want to generate shipping labels and track order status,
> so that I have full control of fulfillment.

**Acceptance Criteria:**

1. Botão "Gerar etiqueta de envio" visível quando status = `address_complete`
2. Ao clicar, sistema gera etiqueta em formato PDF com: remetente, destinatário, produto, peso estimado
3. Etiqueta abre em nova aba para impressão (PDF via navegador)
4. Campo para registrar código de rastreio manualmente (input + botão salvar)
5. Status transitions: `awaiting_address` → `address_complete` → `label_generated` → `shipped` → `delivered`
6. Ao registrar código de rastreio, status atualiza para `shipped`
7. Botão "Marcar como entregue" para transição `shipped` → `delivered`
8. Timeline visual no detalhe do pedido mostrando cada transição de status com data/hora
9. Mensagem de sistema no chat ao mudar status

#### Story 5.4: Orders List & Filters

> As an **operator**,
> I want to see all orders in a dedicated screen with filters,
> so that I can manage fulfillment in an organized way.

**Acceptance Criteria:**

1. Endpoint `GET /orders` com filtros: status, productId, campaignId, dateRange
2. Tela "Orders" no frontend com tabela: ID, lead, produto, valor, status, data, código de rastreio
3. Badge de status colorido: awaiting_address (vermelho), address_complete (amarelo), label_generated (azul), shipped (laranja), delivered (verde)
4. Clicar no pedido abre drawer com detalhes completos
5. Contadores no topo: total de pedidos por status
6. Ordenação por data com opção de ordenar por status
7. Busca por nome do lead, telefone ou ID do pedido
8. Link direto para a conversa associada ao pedido

---

### Epic 6: Dashboard, Leads & Analytics

**Goal:** Implementar o Dashboard com métricas de performance, aprimorar o módulo de Leads com visão completa do funil, e criar o módulo de AI Insights para análise passiva de conversas. Ao final deste epic, o operador tem visibilidade total do negócio.

#### Story 6.1: Dashboard — Key Metrics & Overview

> As an **operator**,
> I want to see a dashboard with key business metrics,
> so that I quickly know how my campaigns, conversions, and revenue are performing.

**Acceptance Criteria:**

1. Endpoint `GET /dashboard/metrics` retorna métricas agregadas com filtro de período (today, 7d, 30d, custom)
2. KPI cards no topo: Total Clicks, Total Leads, Total Conversations, Total Revenue
3. Cada KPI mostra valor atual e variação percentual vs período anterior
4. Gráfico de linha: Clicks e Leads por dia (últimos 7/30 dias)
5. Gráfico de funil: Clicks → Leads → ViewContent → AddToCart → InitiateCheckout → Purchase (com taxa de conversão)
6. Tabela "Top Campaigns": 5 campanhas com mais conversões
7. Tabela "Top Products": 5 produtos com mais receita
8. Tabela "Top Creatives": 5 criativos com melhor taxa de conversão (dados vindos dos UTMs — utm_content)
9. Filtros: período (today, 7d, 30d, custom) + utm_source (facebook/instagram/all) — persistidos na URL (query params)
10. Loading skeletons enquanto dados carregam
11. Estado vazio com call-to-action

#### Story 6.2: Leads Module — Enhanced View & Funnel Status

> As an **operator**,
> I want to see all my leads with their conversion funnel status,
> so that I can prioritize who needs attention and identify opportunities.

**Acceptance Criteria:**

1. Endpoint `GET /leads` aprimorado com campos: lastEventType, lastMessageAt, conversationCount, utmSource, utmCampaign, utmContent
2. Tela "Leads" com tabela enriquecida: nome/telefone, produto, campanha, criativo (utm_content), fonte (utm_source), último evento, última mensagem, status
3. Filtros avançados: produto, campanha, fonte (utm_source), criativo (utm_content), status do lead, último evento, período
4. Badge de último evento com cores do funil
5. Clicar no lead abre drawer com timeline completa
6. Contadores no topo por status de funil
7. Exportar leads como CSV (inclui todos os UTMs: source, medium, campaign, content, term)
8. Ordenação por: data de criação, última mensagem, último evento
9. Busca por nome, telefone ou click_id
10. Ao clicar no lead, drawer mostra seção "Origem" com todos os UTM parameters do clique original (rastreabilidade completa)

#### Story 6.3: Settings Module — Account & Integration Config

> As an **operator**,
> I want to configure my account data and integrations in the system,
> so that the system works correctly with my data and preferences.

**Acceptance Criteria:**

1. Tela "Settings" com abas: Profile, Integrations, WhatsApp, Tracking, Shipping
2. Aba Profile: nome, email (read-only do Facebook), foto, timezone
3. Aba Integrations: status da conexão Facebook (conectado/desconectado), botão reconectar, lista de permissões atuais, data da última sincronização de Ad Accounts
3.1. Aba WhatsApp (NOVA): Configuração e conexão WhatsApp via Z-API. Dividida em 2 seções:
   **Seção 1 — Credenciais Z-API:**
   - **Instance ID:** ID da instância Z-API (campo texto) — por instância
   - **Token:** Token da instância Z-API (campo password) — por instância
   - **Client-Token:** Token de segurança da conta Z-API (campo password) — por conta (vale para todas as instâncias)
   - **Botão "Salvar":** Persiste credenciais criptografadas (AES-256-GCM) no banco e registra automaticamente as webhook URLs na Z-API
   - Texto de ajuda: "1. Acesse z-api.io → 2. Crie uma instância → 3. Cole Instance ID e Token → 4. Vá em Security e copie o Client-Token → 5. Clique Salvar → 6. Escaneie o QR Code abaixo"
   **Seção 2 — Conexão WhatsApp (aparece após salvar credenciais):**
   - **Status da Conexão:** Indicador visual (🟢 Conectado / 🔴 Desconectado / 🟡 Aguardando QR) — via Z-API `GET /status` (campos: `connected`, `smartphoneConnected`, `error`)
   - **QR Code embutido:** Se instância não conectada, exibir QR Code (base64) dentro do dashboard via Z-API `GET /qr-code/image`. Auto-refresh a cada 20s (WhatsApp invalida QR a cada 20s). Máximo 3 tentativas, depois botão "Gerar novo QR". Ao conectar, QR desaparece automaticamente
   - **Dados do dispositivo (após conectar):** Exibir informações do WhatsApp conectado via Z-API `GET /device` — número de telefone, nome do perfil, foto, modelo do dispositivo, se é Business
   - **Botão "Reconectar":** Se desconectado, tenta restaurar sessão via Z-API `GET /restore-session`. Se falhar, exibe QR Code novamente
   - **Botão "Desconectar WhatsApp":** Desconecta a instância (com confirmação)
4. Aba Tracking:
   - Campo "Domínio de Tracking": domínio customizado para links de campanha. Default: `link.brazachat.shop`
   - Preview de como o link fica com o domínio configurado: `https://{dominio}/c/ABX92?utm_source=...`
   - Checkbox "Incluir UTMs automaticamente nos links" (ativado por default)
   - Configuração de UTM padrão: permite ao operador definir `utm_source` padrão (facebook/instagram/custom) e `utm_medium` padrão (paid_social/cpc/custom)
   - Link para política de privacidade do domínio de tracking (obrigatório para compliance Meta — campo URL)
   - Indicador de SSL: verificação automática se o domínio tem HTTPS válido (verde = OK, vermelho = sem SSL)
5. Aba Shipping: dados do remetente para etiquetas (nome/empresa, endereço, cidade, estado, CEP, telefone)
6. Endpoint `PATCH /users/settings` para salvar configurações
7. Dados de remetente usados pela geração de etiqueta (Story 5.3)
8. Domínio de tracking usado na geração de links de campanha (Story 2.2)
9. Botão "Desconectar Facebook" com confirmação (revoga token, mantém dados históricos)
10. Validação de todos os campos com feedback visual

#### Story 6.4: AI Insights — Passive Conversation Analysis

> As an **operator**,
> I want AI to analyze my conversations and show me insights,
> so that I know which approaches convert more and which creatives work better.

**Acceptance Criteria:**

1. Job BullMQ `analyze-conversations` roda diariamente (cron) processando conversas das últimas 24h
2. Análise agrupa dados por: produto, campanha, criativo e resultado da conversa
3. IA identifica e salva na tabela AiInsight: perguntas mais comuns (top 10), respostas que precederam Purchase, criativos com melhor taxa de conversão
4. Endpoint `GET /ai/insights` retorna insights com filtro: produto, campanha, período
5. Tela "AI Insights" com 3 seções: Perguntas Frequentes, Respostas que Convertem, Performance por Criativo
6. Cada insight mostra: dado, frequência/contagem, confiança
7. Indicador de volume mínimo: insights com menos de 10 conversas mostram "Dados insuficientes"
8. IA não responde aos clientes — apenas observa e reporta (FR17)
9. Integração via OpenAI API (GPT-4o-mini) para análise de texto — API key configurável em Settings

---

## 10. Checklist Results Report

### Executive Summary

- **PRD Completeness:** 88%
- **MVP Scope:** Just Right
- **Readiness for Architecture:** READY FOR ARCHITECT

### Category Statuses

| Category | Status |
|----------|--------|
| Problem Definition & Context | PASS |
| MVP Scope Definition | PASS (Out of Scope section added) |
| User Experience Requirements | PASS |
| Functional Requirements | PASS (21 FRs) |
| Non-Functional Requirements | PASS (10 NFRs) |
| Epic & Story Structure | PASS (6 epics, 25 stories) |
| Technical Guidance | PASS |
| Cross-Functional Requirements | PASS |
| Clarity & Communication | PASS |

### Decision: READY FOR ARCHITECT

---

## 11. Next Steps

### UX Expert Prompt

> @ux-design-expert — O Braza Design System já foi criado em `docs/braza-design-system.md` com todos os tokens, componentes e padrões visuais extraídos do Braza Tracker. Para wireframes detalhados dos core screens (Inbox, Dashboard, Campaigns, Orders), usar este Design System como base obrigatória.

### Architect Prompt

> @architect — Review the PRD at `docs/prd.md` and the Design System at `docs/braza-design-system.md`. Create the system architecture document covering: monorepo structure, NestJS module design, database schema (Prisma), API design, WebSocket architecture for Inbox, BullMQ queue design for Meta events, and deployment architecture. O frontend DEVE usar a stack e padrões definidos no Design System (Next.js 15, shadcn/ui, Tailwind 4, Lucide React). Use the `nextjs-react` tech preset as reference.

---

*Generated by Morgan (PM) — Synkra AIOX*
*BrazaChat PRD v0.1.0 — 2026-03-15*
