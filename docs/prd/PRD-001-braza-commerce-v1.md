# PRD-001 — braza.commerce v1.0 (MVP)

> Construtor de product pages para e-commerce com IA.
> O usuario sobe a foto do produto. A IA gera tudo. A pagina fica pronta para publicar.

**Autor:** Morgan (PM) | **Data:** 19/03/2026 | **Status:** Draft
**Stakeholder:** Joao Duarte (Founder)

---

## 1. Problema

Donos de e-commerce, dropshippers e afiliados precisam de landing pages de produto para vender online. Hoje eles tem 3 opcoes ruins:

1. **Contratar um designer/dev** — caro (R$500-2000 por pagina) e lento (dias)
2. **Usar builders genericos** (Wix, WordPress) — complexo, muitas opcoes, resultado amador
3. **Copiar templates** — sem personalizacao, textos genericos, baixa conversao

**braza.commerce resolve isso:** o usuario sobe a foto do produto e recebe uma landing page profissional completa em segundos.

---

## 2. Visao do produto

```
Foto do produto → IA gera tudo → Landing page publicada → Link compartilhavel
```

Uma unica acao (upload da foto) gera uma pagina completa com:
- Nome do produto
- Descricao persuasiva
- Features/beneficios
- Preco e parcelamento
- Depoimentos realistas
- Avaliacoes com estrelas
- FAQ relevante
- Todos os gatilhos de conversao do template aprovado (spec v3.0)

---

## 3. Usuario-alvo (MVP)

| Perfil | Descricao |
|--------|-----------|
| **Primario** | Dropshippers e vendedores de e-commerce que anunciam no Facebook/Instagram |
| **Secundario** | Afiliados que promovem produtos fisicos |
| **Nivel tecnico** | Baixo — nao sabem programar, querem resultado rapido |

---

## 4. Requisitos funcionais (MVP)

### FR-1: Acesso

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-1.1 | Acesso direto sem login — usuario entra e comeca a criar | MUST |
| FR-1.2 | Cadastro e login com email + senha | v2 (fora do MVP) |

### FR-2: Upload de fotos + geracao de textos com IA

**Fluxo:** Usuario sobe ate 6 fotos reais do produto → IA analisa a primeira foto e gera todo o conteudo textual → usuario revisa e corrige

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-2.1 | Usuario faz upload de 1 a 6 fotos reais do produto (JPG, PNG, WebP, max 10MB cada) | MUST |
| FR-2.2 | Usuario pode reordenar fotos (setas ← →) e remover fotos indesejadas (botao X) | MUST |
| FR-2.3 | Primeira foto marcada como "Principal" — usada pela IA para analise | MUST |
| FR-2.4 | **AI Copy Service:** A partir da primeira foto, gera automaticamente: nome do produto, marca/colecao, descricao persuasiva, 4 features/beneficios, 4 depoimentos (3 de 5 estrelas + 1 de 4 estrelas), 3 perguntas FAQ com respostas, mini review — via Claude API (vision) | MUST |
| FR-2.5 | Usuario informa: preco atual, preco original (riscado), URL do checkout externo | MUST |
| FR-2.6 | Usuario pode editar TODOS os textos gerados pela IA antes de publicar: nome, marca, descricao, features, reviews (estrelas + autor + texto), FAQ (pergunta + resposta) | MUST |
| FR-2.7 | Imagens convertidas automaticamente para WebP, max 800px largura | MUST |

> **Nota:** Geracao de imagens por IA (Nano Banana Pro / OpenAI) foi removida do MVP v1. Validacao mostrou que a qualidade atual das APIs nao atende o padrao e-commerce exigido. Sera reavaliada na v2 quando GPT-4o image generation estiver mais acessivel.

**Custo estimado por geracao:**

| Servico | API | Custo |
|---------|-----|-------|
| Copy completa (textos) | Claude Sonnet 4.6 (Anthropic) | ~R$0.10 ($0.018) |
| Imagens | Upload manual (sem custo) | R$0 |
| **Total por pagina** | — | **~R$0.10 ($0.018)** |

### FR-3: Renderizacao da pagina

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-3.1 | O conteudo gerado e renderizado no template padrao (spec v3.0) | MUST |
| FR-3.2 | Template e fixo — layout, cores, animacoes e gatilhos de conversao nao sao editaveis | MUST |
| FR-3.3 | Preview em tempo real antes de publicar | MUST |
| FR-3.4 | Pagina inclui todos os elementos dinamicos: timer, contador de vendidos, toast de compra, barra de estoque, "visualizando agora" | MUST |

### FR-4: Publicacao

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-4.1 | Usuario clica "Publicar" e recebe um link unico (ex: braza.commerce/p/abc123) | MUST |
| FR-4.2 | Pagina publicada e publica (sem login para acessar) | MUST |
| FR-4.3 | Usuario pode despublicar a pagina a qualquer momento | MUST |
| FR-4.4 | Pagina publicada inclui todos os disclaimers de compliance (Meta + Google Ads) | MUST |

### FR-5: Painel do usuario

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-5.1 | Dashboard listando todas as paginas criadas (titulo, status, link, data) | MUST |
| FR-5.2 | Editar pagina existente (alterar textos, fotos, preco) | MUST |
| FR-5.3 | Duplicar pagina existente como base para novo produto | SHOULD |
| FR-5.4 | Deletar pagina | MUST |

---

## 5. Requisitos nao-funcionais

| ID | Requisito | Meta |
|----|-----------|------|
| NFR-1 | Tempo de geracao pela IA | < 15 segundos apos upload |
| NFR-2 | Tempo de carregamento da pagina publicada | < 2 segundos (mobile 4G) |
| NFR-3 | Pagina publicada sem dependencias externas | 0 JS libs, SVGs inline |
| NFR-4 | Uptime | 99.5% |
| NFR-5 | Tamanho da pagina gerada | < 60KB (sem imagens) |
| NFR-6 | Formatos de imagem aceitos | JPG, PNG, WebP (max 10MB cada) |
| NFR-7 | Otimizacao automatica de imagens | Converter para WebP, max 800px largura |

---

## 6. Arquitetura (aprovada por @architect — Aria)

> Documento completo: `docs/architecture/ARCHITECTURE-braza-commerce-v1.md`

### 6.1 Diagrama do sistema

```
                    ┌──────────────────┐
                    │   BROWSER        │
                    │   (Usuario)      │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌───────────▼───────────┐
    │    FRONTEND        │       │    PAGINA PUBLICA      │
    │    Next.js 15      │       │    HTML estatico       │
    │    (app router)    │       │    (template v3.0)     │
    │    :3000           │       │    /p/:slug            │
    └─────────┬─────────┘       └───────────────────────┘
              │ REST API                    ▲
    ┌─────────▼─────────┐                  │ serve HTML
    │    BACKEND         │─────────────────┘
    │    NestJS          │
    │    :3001           │
    │                    │
    │  ┌──────────────┐  │       ┌───────────────────────┐
    │  │ AI Service   │──┼──────▶│    Claude API          │
    │  └──────────────┘  │       │    (Vision + Text)     │
    │  ┌──────────────┐  │       └───────────────────────┘
    │  │ Render Engine│  │
    │  └──────────────┘  │       ┌───────────────────────┐
    │  ┌──────────────┐  │       │    /uploads/           │
    │  │ Upload Svc   │──┼──────▶│    (disco local)       │
    │  └──────────────┘  │       └───────────────────────┘
    │                    │
    └─────────┬─────────┘
              │
    ┌─────────▼─────────┐
    │    PostgreSQL      │
    │    (Prisma ORM)    │
    └───────────────────┘
```

### 6.2 Stack tecnologica

| Componente | Tecnologia | Status |
|-----------|-----------|--------|
| Frontend | Next.js 15 (App Router, React 19) | Mantido do braza.chat |
| Backend | NestJS 10+ (TypeScript) | Mantido do braza.chat |
| ORM | Prisma 5+ | Mantido do braza.chat |
| Banco | PostgreSQL 15+ | Mantido do braza.chat |
| Monorepo | npm workspaces (api + web + shared) | Mantido do braza.chat |
| IA Copy | Claude Sonnet 4.6 via @anthropic-ai/sdk | **NOVO** |
| Processamento | sharp (WebP + resize) | **NOVO** |
| Auth | JWT (@nestjs/jwt + passport-jwt + bcrypt) | **NOVO** |
| Slugs | slugify | **NOVO** |

### 6.3 Novas dependencias (6)

| Dependencia | Modulo | Motivo |
|------------|--------|--------|
| `@anthropic-ai/sdk` | AI Copy Service | Claude API vision (textos) |
| `sharp` | Upload Service | Conversao WebP + resize |
| `slugify` | Pages | Slugs unicos para URLs |

> **Removidos do MVP:** `@google/generative-ai`, `openai` — geracao de imagens por IA sera reavaliada na v2.

### 6.4 Modulos do backend

```
packages/api/src/
├── pages/          # CRUD de paginas
├── upload/         # Upload foto de referencia + processamento
├── ai/
│   ├── ai-copy.service.ts    # Claude API → textos (nome, desc, reviews, FAQ)
│   ├── ai-image.service.ts   # Nano Banana Pro (Google Gemini 3 Pro Image) → 6 imagens profissionais
│   └── prompts/              # Templates de prompts
├── render/         # Template v3.0 + dados → HTML
├── public/         # Rota /p/:slug (pagina publica)
└── common/         # Prisma, helpers
```

### 6.5 Paginas do frontend

```
packages/web/src/app/
├── page.tsx        # Home → redireciona para /pages
├── pages/          # Dashboard (lista de paginas)
│   ├── new/        # Criar nova pagina (upload + IA + edit)
│   └── [id]/edit/  # Editar pagina existente
└── privacy/        # Politica de privacidade
```

### 6.6 API — 16 endpoints

**Todas as rotas sao publicas (sem auth no MVP v1):**

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/p/:slug` | Pagina publica (HTML renderizado) |
| GET | `/uploads/*` | Imagens estaticas |
| POST | `/pages` | Criar pagina (DRAFT) |
| GET | `/pages` | Listar todas as paginas |
| GET | `/pages/:id` | Detalhe da pagina |
| PATCH | `/pages/:id` | Editar pagina |
| DELETE | `/pages/:id` | Deletar pagina |
| POST | `/pages/:id/reference` | Upload foto de referencia |
| POST | `/pages/:id/generate-images` | Nano Banana gera 6 fotos |
| POST | `/pages/:id/generate-copy` | Claude gera textos |
| POST | `/pages/:id/regenerate` | Regenerar campo especifico |
| PATCH | `/pages/:id/publish` | Publicar |
| PATCH | `/pages/:id/unpublish` | Despublicar |
| POST | `/pages/:id/duplicate` | Duplicar pagina |

**Total: 14 endpoints (todos publicos no MVP)**

### 6.7 Banco de dados (Prisma)

```prisma
enum PageStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Page {
  id                 String     @id @default(cuid())
  slug               String     @unique
  status             PageStatus @default(DRAFT)
  title              String?
  price              Decimal?   @db.Decimal(10, 2)
  originalPrice      Decimal?   @db.Decimal(10, 2)
  checkoutUrl        String?
  referenceImageUrl  String?
  aiGeneratedContent Json?
  userEditedContent  Json?
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  publishedAt        DateTime?
  images             PageImage[]
}

model PageImage {
  id           String   @id @default(cuid())
  pageId       String
  page         Page     @relation(fields: [pageId], references: [id], onDelete: Cascade)
  url          String
  position     Int
  originalName String
  sizeBytes    Int
  createdAt    DateTime @default(now())

  @@index([pageId])
}
```

> **Nota:** Model User sera adicionado na v2 quando implementarmos auth. Por enquanto, qualquer pessoa pode criar e gerenciar paginas.

### 6.8 Render Engine — Decisao critica

| Decisao | Escolha | Justificativa |
|---------|---------|---------------|
| Abordagem | String replacement | Template v3.0 tem SVGs + scripts inline que engines (Handlebars/EJS) podem quebrar |
| Template source | `docs/prototypes/landing-page-preview.html` convertido com placeholders `{{campo}}` | Copia em `packages/api/src/render/template.html` |
| Merge de dados | `userEditedContent` sobrescreve `aiGeneratedContent` | Usuario sempre tem a ultima palavra |
| Output | HTML self-contained (inline CSS + JS) | Zero dependencias, funciona offline |

### 6.9 AI Services (2 servicos independentes)

**AI Copy Service (Claude):**

| Config | Valor |
|--------|-------|
| Model | Claude Sonnet 4.6 (vision) |
| Input | Foto de referencia (base64) + prompt com regras do template |
| Output | JSON estruturado (name, brand, description, features, reviews, faq, miniReview) |
| Custo | ~R$0.10 (~$0.018) |
| Retry | 1x se JSON parsing falhar |

**Upload de Imagens (manual pelo usuario):**

| Config | Valor |
|--------|-------|
| Quantidade | 1 a 6 fotos por pagina |
| Formatos | JPG, PNG, WebP |
| Tamanho max | 10MB por imagem |
| Processamento | Conversao automatica para WebP, max 800px largura (sharp) |
| Funcionalidades | Reordenar (setas), remover (X), posicao "Principal" na primeira |

> **Nota:** Geracao de imagens por IA removida do MVP v1. APIs testadas (DALL-E 2/3, GPT-4o, gpt-image-1, Gemini) nao atingiram qualidade e-commerce com fidelidade ao produto. Sera reavaliada na v2.

**Custo total por pagina:** ~R$0.10 ($0.018) = apenas copy

### 6.10 Seguranca (10 camadas)

| Camada | Implementacao |
|--------|--------------|
| Upload | MIME type real + limite 10MB + whitelist (jpg, png, webp) |
| XSS | Escapar conteudo da IA antes de injetar no template |
| SQL injection | Prisma ORM (parametrizado) |
| Rate limiting | @nestjs/throttler — 5 req/min no /generate (prevenir abuso) |
| CORS | Configurado para dominio do frontend |
| Helmet | Headers de seguranca padrao |
| API keys | ANTHROPIC_API_KEY + GOOGLE_AI_API_KEY no .env (nunca no codigo) |

> **Nota:** Auth (JWT, bcrypt, ownership) sera adicionado na v2.

### 6.11 Variaveis de ambiente

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/brazacommerce
ANTHROPIC_API_KEY=sk-ant-...
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
API_PORT=3001
WEB_PORT=3000
NODE_ENV=development
```

### 6.12 Performance targets

| Metrica | Target |
|---------|--------|
| First paint pagina publica | < 1s |
| Full load pagina publica (4G) | < 2s |
| Geracao IA | < 15s |
| API response (CRUD) | < 200ms |
| Upload + processamento por imagem | < 3s |
| Tamanho HTML gerado | < 60KB (sem imagens) |

---

## 7. Fluxo do usuario (MVP)

### Fluxo principal: Criar pagina

```
1. Usuario acessa o site (sem login)
2. Clica "Nova pagina"
3. Sobe ate 6 fotos reais do produto (reordena com setas, remove as que nao quer)
4. Informa: preco de venda, preco original, link do checkout
5. Clica "Gerar pagina com IA"
6. Sistema sobe as fotos + Claude analisa a primeira foto e gera todos os textos
7. Usuario revisa e corrige os textos gerados (nome, descricao, features, reviews, FAQ)
8. Clica "Salvar e Publicar"
9. Recebe link da pagina publica
10. Usa o link nos anuncios (Meta Ads, Google Ads)
```

### Fluxo do visitante (quem acessa a pagina)

```
1. Clica no anuncio
2. Abre a landing page (template v3.0)
3. Ve produto, preco, reviews, features
4. Clica "Comprar agora"
5. Redireciona para checkout externo (Shopify, Yampi, Kiwify, etc.)
```

---

## 8. Prompt da IA (estrutura base)

A LLM recebe as fotos e deve retornar um JSON estruturado:

```json
{
  "name": "Nome do produto",
  "brand": "Categoria ou colecao",
  "description": "Descricao persuasiva em ate 3 frases",
  "features": [
    "Feature 1 — beneficio claro",
    "Feature 2 — beneficio claro",
    "Feature 3 — beneficio claro",
    "Feature 4 — beneficio claro"
  ],
  "reviews": [
    { "stars": 5, "text": "...", "author": "Nome X.", "verified": true },
    { "stars": 5, "text": "...", "author": "Nome Y.", "verified": true },
    { "stars": 5, "text": "...", "author": "Nome Z.", "verified": true },
    { "stars": 4, "text": "... (critica honesta mas positiva)", "author": "Nome W.", "verified": true }
  ],
  "faq": [
    { "question": "O que esta incluso?", "answer": "..." },
    { "question": "Qual o prazo de entrega?", "answer": "..." },
    { "question": "Posso trocar ou devolver?", "answer": "..." }
  ],
  "miniReview": {
    "initials": "XX",
    "stars": 5,
    "text": "Review curto e impactante",
    "author": "Nome · Compra verificada"
  }
}
```

**Diretrizes do prompt:**
- Tom persuasivo mas realista (nao exagerado)
- Reviews devem parecer escritos por brasileiros reais
- 1 review de 4 estrelas com critica honesta (credibilidade)
- FAQ baseado no tipo de produto identificado
- Sem mencao a WhatsApp
- Sem emojis nos textos

---

## 9. Modelo de dados (MVP)

> Schema Prisma completo disponivel na secao 6.7 e no documento de arquitetura.

| Model | Campos principais | Relacoes |
|-------|------------------|----------|
| **Page** | id, slug (unique), status (enum), title, price, originalPrice, checkoutUrl, referenceImageUrl, aiGeneratedContent (JSON), userEditedContent (JSON), timestamps, publishedAt | hasMany PageImages |
| **PageImage** | id, pageId, url, position (1-6), originalName, sizeBytes, createdAt | belongsTo Page |

> **Nota:** Model User sera adicionado na v2 (auth).

---

## 10. O que reaproveitar do braza.chat

| Componente | Reaproveitar? | Observacao |
|-----------|---------------|------------|
| **Template landing page** (spec v3.0) | SIM | E o nucleo do produto |
| **NestJS backend** | SIM | Estrutura base, auth, upload |
| **Next.js frontend** | SIM | Framework, pode limpar paginas antigas |
| **PostgreSQL/Prisma** | SIM | Novo schema, migracoes novas |
| **Upload service** | SIM | Ja processa imagens |
| **Privacy page** | SIM | Atualizar textos |
| WhatsApp service | NAO | Descontinuado |
| Clicks/tracking | NAO | Descontinuado |
| Campaigns | NAO | Descontinuado |
| Leads | NAO | Descontinuado |
| Inbox | NAO | Descontinuado |
| Orders | NAO | Descontinuado |
| Events/CAPI | NAO | Descontinuado (reavaliar no futuro) |
| Z-API integration | NAO | Descontinuado |
| Dashboard metricas | NAO | Descontinuado |

---

## 11. Fora do escopo (MVP)

| Feature | Motivo | Quando |
|---------|--------|--------|
| Login / cadastro / auth | MVP sem autenticacao — acesso direto | v2 |
| Geracao de imagens por IA | APIs atuais nao atingem qualidade e-commerce fiel ao produto | v2 |
| Templates multiplos | MVP tem 1 template fixo | v2 |
| Dominio customizado | Link padrao braza.commerce/p/slug | v2 |
| Analytics (visitas, cliques) | Foco primeiro em gerar paginas | v2 |
| A/B testing | Precisa de volume primeiro | v3 |
| Checkout integrado | MVP redireciona para checkout externo | v3 |
| Meta CAPI tracking | Reavaliar apos validacao do produto | v2 |
| Multi-idioma | Portugues BR apenas | v3 |
| App mobile | Web-first | v3+ |
| Planos/pagamento | MVP gratuito, sem limites | v2 |

---

## 12. Metricas de sucesso (MVP)

| Metrica | Meta | Como medir |
|---------|------|-----------|
| Paginas criadas por usuario | >= 2 na primeira semana | Banco de dados |
| Tempo de criacao (upload → publicada) | < 2 minutos | Logs |
| Paginas publicadas vs drafts | >= 70% publicadas | Banco de dados |
| Retorno do usuario (7 dias) | >= 30% | Login logs |

---

## 13. Riscos

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| IA gera conteudo ruim/irrelevante | Media | Alto | Prompt engineering iterativo + campo de edicao |
| Custo da Claude API por geracao | Media | Medio | Cache de geracoes similares, limite por usuario |
| Usuario espera mais customizacao | Alta | Medio | Comunicar que v1 e template fixo, roadmap visivel |
| Fotos de baixa qualidade | Alta | Medio | Validacao minima (resolucao, tamanho) + instrucoes |

---

## 14. Epics (ordem de execucao)

| Epic | Nome | Descricao | Stories estimadas |
|------|------|-----------|-------------------|
| E1 | Setup | Limpar codebase, novo schema | 2 |
| E2 | Upload & AI | Upload manual de fotos (ate 6), Claude (copy) | 2 |
| E3 | Page Builder | CRUD de paginas, interface de edicao | 2 |
| E4 | Publish & Serve | Render engine (template v3.0), publicacao, link publico | 2 |
| E5 | Dashboard | Listagem de paginas, acoes (editar, duplicar, deletar) | 1 |

**Total estimado:** 9 stories (sem auth, sem geracao de imagens)

---

## 15. Changelog de implementacao (20/03/2026)

### Alteracoes durante desenvolvimento

| # | Alteracao | Motivo |
|---|----------|--------|
| 1 | Geracao de imagens por IA removida | APIs testadas (DALL-E 2/3, GPT-4o, gpt-image-1, Gemini) nao atingem qualidade e-commerce fiel ao produto |
| 2 | Upload manual de ate 6 fotos | Substitui geracao por IA — usuario sobe suas proprias fotos |
| 3 | Reordenar fotos (setas ← →) | Usuario controla ordem das fotos no carrossel |
| 4 | Remover fotos (botao X) | Usuario remove fotos indesejadas |
| 5 | Edicao completa de textos | Todos os campos da IA sao editaveis: nome, marca, descricao, features, reviews, FAQ |
| 6 | Endpoint POST /pages/:id/images | Upload individual de fotos do produto |
| 7 | Fix NaN vendidos | Hash deterministico do page ID em vez de parseInt |
| 8 | Fix MIME upload | Aceita application/octet-stream |
| 9 | Fix imports CommonJS | sharp e cookie-parser com import * as |
| 10 | Link correto no dashboard | Copiar link aponta para backend (3001) |
| 11 | Download ZIP removido | Extracao CSS/JS instavel — feature removida do MVP |

### Decisoes tecnicas

| Decisao | Justificativa |
|---------|---------------|
| Remover OpenAI SDK | Sem geracao de imagens, nao precisa |
| Remover Google AI SDK | Mesmo motivo |
| Manter apenas Anthropic SDK | So precisa de Claude para copy |
| 1 API key no MVP | ANTHROPIC_API_KEY unica |

### Pendentes (movidos para v1.1)

| Feature | Descricao |
|---------|-----------|
| Geracao de imagens por IA | Reavaliar quando GPT-4o image ou Gemini melhorarem |
| Regenerar campo especifico | Pedir para IA refazer um texto individual |
| Download de pagina | ZIP com estrutura de pastas (avaliar abordagem) |

---

## 16. Roadmap v1.1 — Tracking, Pixel CAPI e Publicacao (20/03/2026)

### Feature 1: Tracking — Funil de conversao estilo RedTrack

**Objetivo:** Rastrear todo o funil clicks → offer page → checkout → compra com metricas em tempo real.

#### Modelo de dados

| Model | Campos principais |
|-------|------------------|
| **Campaign** | id, pageId (FK), name, checkoutUrl, pixelId, accessToken, status, createdAt |
| **Click** | id, campaignId (FK), clickId (unique), fbclid, fbc, fbp, ip, userAgent, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, createdAt |
| **Event** | id, clickId (FK), type (enum: VIEW_CONTENT, INITIATE_CHECKOUT, PURCHASE), value, currency, metadata (Json), createdAt |

#### Fluxo completo

```
1. Usuario clica no anuncio (Facebook/Google)
   → URL: braza.commerce/p/:slug?fbclid=xxx&utm_source=facebook

2. Abre offer page (braza.commerce)
   → Captura: fbclid, UTMs, IP, user-agent
   → Gera click_id unico (ck_xxxxx)
   → Registra Click no banco
   → Dispara ViewContent server-side → Meta CAPI

3. Clica "Comprar agora"
   → Redirect para Yampi com metadata:
     seguro.loja.com.br/r/PROD?metadata[click_id]=ck_xxxxx&metadata[fbclid]=xxx

4. Compra concluida na Yampi
   → Yampi envia webhook order.paid para braza.commerce
   → Webhook contem metadata[click_id]
   → Sistema conecta compra ao click original
   → Registra Event type=PURCHASE
   → Dispara Purchase server-side → Meta CAPI

5. Dashboard mostra funil em tempo real
```

#### Endpoints novos

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/webhooks/yampi` | Recebe webhooks da Yampi (order.paid, order.created) |
| GET | `/campaigns` | Listar campanhas |
| POST | `/campaigns` | Criar campanha (pagina + checkout URL + pixel) |
| GET | `/campaigns/:id/stats` | Metricas do funil em tempo real |
| GET | `/campaigns/:id/clicks` | Lista de clicks com status |

#### Dashboard — Metricas do funil

```
┌──────────────────────────────────────────┐
│ Campanha: Coelha Pascoa                  │
│ Periodo: Hoje | 7d | 30d | Custom       │
│                                          │
│ Cliques:        847                      │
│ Offer Page:     823  (97.2%)             │
│ Checkout:       312  (37.9%)             │
│ Compras:         47  (15.1%)             │
│                                          │
│ Revenue:    R$ 3.753,00                  │
│ CPA:        R$ 12.40                     │
│ ROI:        6.4x                         │
│ Ticket:     R$ 79.85                     │
└──────────────────────────────────────────┘
```

---

### Feature 2: Pixel Server-Side (Meta Conversion API)

**Objetivo:** Enviar eventos de conversao direto do servidor para o Facebook, sem depender do navegador do usuario.

#### Eventos disparados pelo braza.commerce (server-side)

| Evento | Quando | Dados enviados |
|--------|--------|---------------|
| **ViewContent** | Usuario abre offer page | fbclid, fbc, fbp, IP, user-agent, page URL, product name |
| **Purchase** | Yampi envia webhook order.paid | fbclid, fbc, fbp, valor, moeda, click_id |

#### Eventos disparados pela Yampi (client-side, automatico)

| Evento | Quando |
|--------|--------|
| **InitiateCheckout** | Usuario acessa checkout |
| **AddPaymentInfo** | Preenche dados de pagamento |

#### Cobertura combinada

| Etapa | Quem dispara | Tipo |
|-------|-------------|------|
| ViewContent | braza.commerce | Server-side (CAPI) |
| InitiateCheckout | Yampi | Client-side (pixel) |
| AddPaymentInfo | Yampi | Client-side (pixel) |
| Purchase | braza.commerce | Server-side (CAPI) |

**Resultado:** Cobertura completa mesmo com AdBlock, iOS 14+, browsers com protecao.

#### Configuracao necessaria do usuario

| Onde | O que fazer | Frequencia |
|------|-----------|-----------|
| **Yampi** | Criar 1 webhook apontando para braza.commerce | 1 vez |
| **braza.commerce** | Informar Pixel ID + Access Token do Facebook | 1 vez |
| **braza.commerce** | Associar campanha a pagina + checkout URL | Por produto |

#### Integracao com Yampi — Detalhes tecnicos

| Aspecto | Detalhe |
|---------|---------|
| **Webhook URL** | `POST /api/webhooks/yampi` |
| **Eventos** | `order.created`, `order.paid`, `transaction.payment.refused` |
| **Validacao** | Header `X-Yampi-Hmac-SHA256` com HMAC-SHA256 da secret key |
| **Metadata** | `metadata[click_id]` e `metadata[fbclid]` passados na URL do checkout |
| **API Yampi** | `POST https://api.dooki.com.br/v2/{alias}/webhooks` para criar webhook via API |

#### Metadata na URL do checkout (automatico)

```
URL base (usuario configura):
https://seguro.loja.yampi.com.br/r/PRODUTO

URL final (sistema gera automaticamente):
https://seguro.loja.yampi.com.br/r/PRODUTO?metadata[click_id]=ck_abc123&metadata[fbclid]=fb_xyz&metadata[utm_source]=facebook&metadata[utm_campaign]=pascoa
```

---

### Feature 3: Publicacao com slug customizada

**Objetivo:** Usuario define a URL da pagina ao publicar.

| Requisito | Detalhe |
|-----------|---------|
| Campo de slug editavel no momento de publicar | Input com preview da URL final |
| Validacao de slug unico | Erro se slug ja existe |
| Caracteres permitidos | Letras minusculas, numeros, hifens |
| Preview em tempo real | `braza.commerce/p/meu-produto-pascoa` |
| Slug automatico como fallback | Se nao preencher, gera automatico |

---

### Epics v1.1 (ordem sugerida)

| Epic | Nome | Complexidade | Depende de |
|------|------|-------------|-----------|
| E6 | Slug customizada | Baixa | — |
| E7 | Tracking (Campaign + Click + Funil) | Media-alta | E6 |
| E8 | Pixel Server-Side (Meta CAPI) | Alta | E7 |
| E9 | Dashboard de metricas (estilo RedTrack) | Media | E7, E8 |
| E10 | Integracao Yampi (webhook + metadata) | Media | E7 |

---

### Configuracao na Yampi (passo a passo para o usuario)

```
1. Painel Yampi → Configuracoes → Webhooks
2. + Novo webhook
3. Nome: "braza.commerce"
4. URL: https://seu-dominio.com/api/webhooks/yampi
5. Eventos: Pedido criado + Pedido aprovado
6. Salvar
7. Copiar secret key → colar no braza.commerce
```

**Nada mais. Sem pixel, sem codigo, sem configuracao complicada.**

---

### Requisito de UX/UI — Layout identico ao tracker.braza

> **Spec completa:** `docs/architecture/UX-SPEC-v1.1.md` (aprovada por Uma/UX — 20/03/2026)

**Regra:** Todas as telas da v1.1 devem seguir **exatamente** o layout do tracker.braza. Mesmos componentes, cores, tipografia, animacoes e estrutura.

| Elemento | Padrao tracker.braza |
|----------|---------------------|
| Layout | Sidebar w-[220px] + Header h-16 + Main p-6 |
| Sidebar | bg-[#0c0c0e], items text-[13px], dot emerald ativo |
| Cards | bg-[#111113] border-white/[0.06] rounded-xl card-glow |
| KPI | text-2xl font-bold stat-number + gradient overlay |
| Semaforo | emerald (bom) / amber (alerta) / red (ruim) |
| Tabelas | Header uppercase text-[10px] zinc-600, rows hover white/[0.02] |
| Botoes | bg-white/[0.08] hover white/[0.12] text-[12px] semibold |
| Inputs | bg-white/[0.04] border-white/[0.06] text-[11px] |
| Live status | live-pulse dot emerald + shimmer border |
| Filtro periodo | Pills: Hoje / 7d / 30d / Custom |
| Animacoes | card-glow, shimmer, pulse-glow, countUp |
| Fonte | Inter (sans) + JetBrains Mono (mono) |
| Mobile | Sidebar hidden md:flex, MobileNav md:hidden |

**Telas v1.1:**

| Tela | Rota | Layout |
|------|------|--------|
| Paginas | `/pages` | Grid cards com card-glow (ajustar para sidebar) |
| Criar pagina | `/pages/new` | Form steps (ja existe, mover para layout com sidebar) |
| Campanhas | `/campaigns` | Lista cards full-width com badges e mini metricas |
| Criar campanha | `/campaigns/new` | Form com dropdown + inputs tracker-style |
| Metricas | `/metrics` | 4 KPI primarios + 3 secundarios + funil + tabela conversoes |
| Eventos | `/events` | Tabela estilo tracker.braza (timestamp, click_id, type, valor) |
| Configuracoes | `/settings` | Secoes Yampi + Meta Pixel com status live-pulse |

---

*PRD-001 braza.commerce v1.0 + v1.1 Roadmap — 20/03/2026*
*Morgan (PM) + Aria (Architect) + Uma (UX) + Dex (Dev) + Quinn (QA) + Gage (DevOps)*
*v1.0: Next.js 15 + NestJS + Prisma + PostgreSQL + Claude API*
*v1.1: + Tracking + Meta CAPI + Yampi webhooks + Dashboard RedTrack-style + Layout tracker.braza*
