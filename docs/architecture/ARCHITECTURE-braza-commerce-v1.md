# Arquitetura — braza.commerce v1.0 (MVP)

> **Autor:** Aria (Architect) | **Data:** 19/03/2026 | **Status:** Approved
> **PRD:** `docs/prd/PRD-001-braza-commerce-v1.md`
> **Template base:** `docs/prototypes/LANDING-PAGE-SPEC.md` (v3.0)

---

## 1. Visao geral

braza.commerce e um monolito modular que transforma fotos de produto em landing pages de alta conversao usando IA.

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
    │  │ AI Copy Svc  │──┼──────▶│    Claude API          │
    │  └──────────────┘  │       │    (Vision → Textos)   │
    │  ┌──────────────┐  │       └───────────────────────┘
    │  │ AI Image Svc │──┼──────▶┌───────────────────────┐
    │  └──────────────┘  │       │    Google AI            │
    │                    │       │    (Nano Banana Pro     │
    │                    │       │     → 6 fotos)          │
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

---

## 2. Decisoes de arquitetura

### Stack mantida do braza.chat

| Componente | Tecnologia | Versao | Justificativa |
|-----------|-----------|--------|---------------|
| Frontend | Next.js | 15 | Ja instalado, App Router, React 19 |
| Backend | NestJS | 10+ | Ja instalado, modular, TypeScript |
| ORM | Prisma | 5+ | Ja instalado, type-safe, migrations |
| Banco | PostgreSQL | 15+ | Ja configurado |
| Runtime | Node.js | 18+ | Ja configurado |
| Monorepo | npm workspaces | — | packages/api + packages/web + packages/shared |

### Novas dependencias (apenas o necessario)

| Dependencia | Modulo | Motivo |
|------------|--------|--------|
| `@anthropic-ai/sdk` | AI Copy Service | Claude API vision (textos) |
| `@google/generative-ai` | AI Image Service | Nano Banana Pro / Gemini 3 Pro Image (fotos) |
| `sharp` | Upload Service | Conversao WebP + resize de imagens |
| `bcrypt` | Auth | Hash de senhas |
| `@nestjs/jwt` + `passport-jwt` | Auth | Autenticacao JWT |
| `slugify` | Pages | Geracao de slugs unicos |

### Dependencias que NAO vamos usar (MVP)

| Tecnologia | Motivo |
|-----------|--------|
| Redis | Nao precisa de cache para MVP — volume baixo |
| S3/Cloudflare R2 | Disco local para MVP — migrar depois |
| Queue (Bull/BullMQ) | Geracao sincrona e suficiente (< 15s) |
| WebSocket | Nao tem real-time no MVP |
| Template engine (Handlebars/EJS) | String replacement e suficiente para 1 template |

---

## 3. Estrutura de modulos (Backend — NestJS)

```
packages/api/src/
├── app.module.ts              # Root module
├── main.ts                    # Bootstrap
│
├── auth/                      # E1.3 — Autenticacao
│   ├── auth.module.ts
│   ├── auth.controller.ts     # POST /auth/register, /auth/login, GET /auth/me
│   ├── auth.service.ts        # Register, login, validate
│   ├── jwt.strategy.ts        # Passport JWT strategy
│   ├── jwt-auth.guard.ts      # Guard para rotas protegidas
│   └── dto/
│       ├── register.dto.ts
│       └── login.dto.ts
│
├── pages/                     # E3.1 — CRUD de paginas
│   ├── pages.module.ts
│   ├── pages.controller.ts    # CRUD + publish/unpublish
│   ├── pages.service.ts       # Business logic
│   └── dto/
│       ├── create-page.dto.ts
│       └── update-page.dto.ts
│
├── upload/                    # E2.1 — Upload de imagens
│   ├── upload.module.ts
│   ├── upload.controller.ts   # POST /pages/:id/images
│   ├── upload.service.ts      # Processamento (WebP, resize, salvar)
│   └── multer.config.ts       # Configuracao multer
│
├── ai/                        # E2.2 — Geracao com IA
│   ├── ai.module.ts
│   ├── ai.controller.ts       # POST /pages/:id/generate, /regenerate
│   ├── ai.service.ts          # Claude API integration
│   └── prompts/
│       └── generate-content.ts # Prompt template para geracao
│
├── render/                    # E4.1 — Render Engine
│   ├── render.module.ts
│   ├── render.service.ts      # Template v3.0 + data → HTML
│   └── template.html          # Copia do template v3.0 (source of truth: docs/prototypes/)
│
├── public/                    # E4.2 — Paginas publicas
│   ├── public.module.ts
│   └── public.controller.ts   # GET /p/:slug (sem auth)
│
└── common/
    ├── services/
    │   ├── prisma.service.ts  # Prisma client
    │   └── crypto.service.ts  # Helpers de crypto (se necessario)
    └── guards/
        └── jwt-auth.guard.ts
```

---

## 4. Estrutura de paginas (Frontend — Next.js)

```
packages/web/src/
├── app/
│   ├── layout.tsx             # Root layout (Inter font, metadata)
│   ├── page.tsx               # Redirect → /login ou /pages
│   │
│   ├── login/
│   │   └── page.tsx           # E1.3 — Tela de login
│   ├── register/
│   │   └── page.tsx           # E1.3 — Tela de cadastro
│   │
│   ├── pages/                 # AREA AUTENTICADA
│   │   ├── page.tsx           # E5.1 — Dashboard (lista de paginas)
│   │   ├── new/
│   │   │   └── page.tsx       # E3.2 — Criar nova pagina (upload + AI + edit)
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx   # E3.2 — Editar pagina existente
│   │
│   └── privacy/
│       └── page.tsx           # Politica de privacidade (manter)
│
├── components/
│   ├── image-uploader.tsx     # Componente drag & drop para fotos
│   ├── content-editor.tsx     # Campos editaveis do conteudo gerado
│   ├── page-card.tsx          # Card da pagina no dashboard
│   ├── page-preview.tsx       # Preview inline do template
│   └── auth-guard.tsx         # Wrapper que protege rotas
│
└── lib/
    ├── api.ts                 # Fetch wrapper com JWT
    └── auth.ts                # Token management (localStorage)
```

---

## 5. Rotas da API

### Publicas (sem auth)

| Metodo | Rota | Descricao | Story |
|--------|------|-----------|-------|
| POST | `/auth/register` | Criar conta | E1.3 |
| POST | `/auth/login` | Login → JWT | E1.3 |
| GET | `/p/:slug` | Servir pagina publica (HTML) | E4.2 |
| GET | `/uploads/*` | Servir imagens estaticas | E2.1 |

### Protegidas (JWT required)

| Metodo | Rota | Descricao | Story |
|--------|------|-----------|-------|
| GET | `/auth/me` | Dados do usuario | E1.3 |
| POST | `/pages` | Criar pagina (DRAFT) | E3.1 |
| GET | `/pages` | Listar paginas do usuario | E3.1 |
| GET | `/pages/:id` | Detalhe da pagina | E3.1 |
| PATCH | `/pages/:id` | Editar pagina | E3.1 |
| DELETE | `/pages/:id` | Deletar pagina | E3.1 |
| POST | `/pages/:id/images` | Upload de fotos | E2.1 |
| DELETE | `/pages/:id/images/:imgId` | Remover foto | E2.1 |
| POST | `/pages/:id/generate` | Gerar conteudo com IA | E2.2 |
| POST | `/pages/:id/regenerate` | Regenerar campo especifico | E2.3 |
| PATCH | `/pages/:id/publish` | Publicar pagina | E4.2 |
| PATCH | `/pages/:id/unpublish` | Despublicar pagina | E4.2 |
| POST | `/pages/:id/duplicate` | Duplicar pagina | E5.1 |

**Total: 16 endpoints (4 publicos + 12 protegidos)**

---

## 6. Banco de dados (Prisma schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum PageStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  pages        Page[]
}

model Page {
  id                 String     @id @default(cuid())
  userId             String
  user               User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug               String     @unique
  status             PageStatus @default(DRAFT)
  title              String?
  price              Decimal?   @db.Decimal(10, 2)
  originalPrice      Decimal?   @db.Decimal(10, 2)
  checkoutUrl        String?
  aiGeneratedContent Json?
  userEditedContent  Json?
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  publishedAt        DateTime?
  images             PageImage[]

  @@index([userId])
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

---

## 7. Render Engine — Decisao arquitetural critica

O render engine e o componente mais importante — e a ponte entre os dados e o template v3.0.

### Abordagem: String replacement

```
Template HTML (string) + Dados (JSON) → HTML final (string)
```

**Por que NAO usar template engine (Handlebars/EJS):**
- Template v3.0 tem SVGs inline complexos que engines podem escapar errado
- Template tem `<script>` inline que engines podem conflitar
- So temos 1 template — nao justifica uma engine
- String replacement e mais rapido e previsivel

**Implementacao:**

```typescript
class RenderService {
  private template: string; // carregado do arquivo na inicializacao

  render(page: Page, images: PageImage[]): string {
    // 1. Merge: userEditedContent sobre aiGeneratedContent
    const content = { ...page.aiGeneratedContent, ...page.userEditedContent };

    // 2. Substituicoes simples
    let html = this.template;
    html = html.replace('{{product_name}}', content.name);
    html = html.replace('{{product_brand}}', content.brand);
    html = html.replace('{{product_description}}', content.description);
    html = html.replace('{{price}}', formatBRL(page.price));
    html = html.replace('{{original_price}}', formatBRL(page.originalPrice));
    html = html.replace('{{discount_pct}}', calcDiscount(page.price, page.originalPrice));
    html = html.replace('{{installments}}', calcInstallments(page.price));
    html = html.replace('{{checkout_url}}', page.checkoutUrl);

    // 3. Blocos dinamicos (features, reviews, FAQ)
    html = this.renderFeatures(html, content.features);
    html = this.renderReviews(html, content.reviews);
    html = this.renderFAQ(html, content.faq);
    html = this.renderMiniReview(html, content.miniReview);

    // 4. Carrossel (N imagens)
    html = this.renderCarousel(html, images);

    // 5. Soldcount randomico
    html = html.replace('{{sold_count}}', String(randomInt(150, 400)));

    return html;
  }
}
```

### Template com placeholders

O template v3.0 precisa ser convertido de dados hardcoded para placeholders `{{campo}}`. Isso acontece na story E4.1. O arquivo original em `docs/prototypes/` permanece como referencia visual — a versao com placeholders fica em `packages/api/src/render/template.html`.

---

## 8. AI Service — Integracao Claude

### Fluxo

```
1. Recebe imagens (base64) do upload
2. Monta prompt com regras do template v3.0
3. Envia para Claude API (vision)
4. Recebe JSON estruturado
5. Valida JSON (schema check)
6. Se invalido: retry 1x com prompt de correcao
7. Salva em Page.aiGeneratedContent
```

### Configuracao

```typescript
// ai.service.ts
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2000,
  messages: [{
    role: 'user',
    content: [
      ...images.map(img => ({
        type: 'image',
        source: { type: 'base64', media_type: 'image/webp', data: img.base64 }
      })),
      { type: 'text', text: GENERATION_PROMPT }
    ]
  }]
});
```

### Custo estimado por geracao

| Item | Tokens | Custo |
|------|--------|-------|
| Input (imagens + prompt) | ~2000 | ~$0.006 |
| Output (JSON) | ~800 | ~$0.012 |
| **Total por geracao** | ~2800 | **~$0.018 (~R$0.10)** |

---

## 9. Upload e armazenamento de imagens

### Fluxo

```
1. Usuario faz upload (multer, max 10MB)
2. Validar MIME type real (magic bytes, nao extensao)
3. Converter para WebP via sharp
4. Redimensionar para max 800px largura
5. Salvar em /uploads/pages/{pageId}/{position}.webp
6. Registrar PageImage no banco
```

### Armazenamento MVP

```
/uploads/
  └── pages/
      └── {pageId}/
          ├── 1.webp  (foto principal — hero)
          ├── 2.webp
          ├── 3.webp
          ├── 4.webp
          ├── 5.webp
          └── 6.webp
```

**Migrar para S3/R2 na v2** quando volume justificar.

---

## 10. Seguranca

| Camada | Implementacao |
|--------|--------------|
| **Autenticacao** | JWT (7 dias expiracao) via @nestjs/jwt |
| **Senhas** | bcrypt (10 salt rounds) |
| **Ownership** | Toda rota de Page valida `page.userId === req.user.id` |
| **Upload** | Validacao MIME real + limite 10MB + whitelist (jpg, png, webp) |
| **XSS no render** | Escapar conteudo gerado pela IA antes de injetar no template |
| **SQL injection** | Prisma ORM (parametrizado por padrao) |
| **Rate limiting** | @nestjs/throttler — 10 req/min no /generate (prevenir abuso da API) |
| **CORS** | Permitir apenas origin do frontend |
| **Helmet** | Headers de seguranca padrao |
| **API key** | ANTHROPIC_API_KEY no .env (nunca no codigo) |

---

## 11. Variaveis de ambiente (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/brazacommerce

# Auth
JWT_SECRET=gerar-secret-forte-aqui
JWT_EXPIRES_IN=7d

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Server
API_PORT=3001
WEB_PORT=3000
NODE_ENV=development
```

---

## 12. Performance targets

| Metrica | Target | Como atingir |
|---------|--------|-------------|
| First paint pagina publica | < 1s | HTML inline (0 blocking), Google Fonts async |
| Full load pagina publica | < 2s (4G) | < 60KB HTML + imagens WebP otimizadas |
| Geracao IA | < 15s | Claude Sonnet (rapido), imagens ja em WebP |
| API response (CRUD) | < 200ms | Prisma com indices, queries simples |
| Upload + processamento | < 3s por imagem | Sharp e rapido para resize + WebP |

---

## 13. Decisoes fora do escopo (v2+)

| Decisao | Quando | Motivo |
|---------|--------|--------|
| CDN (Cloudflare) | v2 | Volume baixo no MVP |
| S3/R2 para imagens | v2 | Disco local e suficiente |
| Redis cache | v2 | Sem necessidade de cache |
| Queue para IA | v2 | Sincrono e suficiente (< 15s) |
| SSR para pagina publica | v2 | Backend serve HTML direto |
| Monitoring (Sentry) | v2 | console.log para MVP |
| CI/CD | v2 | Deploy manual (regra do projeto) |

---

*Arquitetura braza.commerce v1.0 — Aria (Architect) — 19/03/2026*
*Stack: Next.js 15 + NestJS + Prisma + PostgreSQL + Claude API*
*16 endpoints | 3 models | 7 modulos backend | 5 paginas frontend*
