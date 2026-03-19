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

### FR-2: Upload e geracao com IA (2 servicos separados)

**Fluxo:** Usuario sobe 1 foto de referencia → IA gera 6 imagens profissionais + todo o conteudo textual

| ID | Requisito | Prioridade |
|----|-----------|------------|
| FR-2.1 | Usuario faz upload de 1 foto de referencia do produto (JPG, PNG, WebP) | MUST |
| FR-2.2 | **AI Image Service:** A partir da foto de referencia, gera 6 imagens profissionais estilo e-commerce (fundo branco, lifestyle, detalhe, angulos diferentes) via Nano Banana Pro (Google Gemini 3 Pro Image) | MUST |
| FR-2.3 | **AI Copy Service:** A partir da foto de referencia, gera automaticamente: nome do produto, descricao persuasiva (max 3 frases), 4 features/beneficios, 4 depoimentos (3 de 5 estrelas + 1 de 4 estrelas), 3 perguntas FAQ com respostas via Claude API (vision) | MUST |
| FR-2.4 | A foto de referencia NAO e publicada — apenas as 6 imagens geradas pela IA aparecem no carrossel | MUST |
| FR-2.5 | Usuario informa: preco atual, preco original (riscado), URL do checkout externo | MUST |
| FR-2.6 | Usuario pode editar qualquer texto gerado pela IA antes de publicar | MUST |
| FR-2.7 | Usuario pode pedir para a IA regenerar um campo especifico (texto) | SHOULD |
| FR-2.8 | Usuario pode pedir para a IA regenerar uma imagem especifica | SHOULD |

**Custo estimado por geracao completa:**

| Servico | API | Custo |
|---------|-----|-------|
| 6 imagens profissionais | Nano Banana Pro (Google Gemini 3 Pro Image) | ~R$4.30 ($0.80) |
| Copy completa (textos) | Claude Sonnet 4.6 (Anthropic) | ~R$0.10 ($0.018) |
| **Total por pagina** | — | **~R$4.40 ($0.82)** |

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
| IA Imagens | Nano Banana Pro (Gemini 3 Pro Image) via @google/generative-ai | **NOVO** |
| Processamento | sharp (WebP + resize) | **NOVO** |
| Auth | JWT (@nestjs/jwt + passport-jwt + bcrypt) | **NOVO** |
| Slugs | slugify | **NOVO** |

### 6.3 Novas dependencias (6)

| Dependencia | Modulo | Motivo |
|------------|--------|--------|
| `@anthropic-ai/sdk` | AI Copy Service | Claude API vision (textos) |
| `@google/generative-ai` | AI Image Service | Nano Banana Pro / Gemini 3 Pro Image (fotos) |
| `sharp` | Upload Service | Conversao WebP + resize |
| `slugify` | Pages | Slugs unicos para URLs |

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

**AI Image Service (Google — Nano Banana Pro):**

| Config | Valor |
|--------|-------|
| Model | gemini-3-pro-image-preview (Nano Banana Pro) |
| SDK | @google/generative-ai |
| Input | Foto de referencia + prompt descrevendo estilo e-commerce |
| Output | 6 imagens profissionais 4K (fundo branco, lifestyle, detalhe, angulos) |
| Custo | ~R$4.30 (~$0.80) por 6 imagens |
| Formato output | Converter para WebP otimizado, 800px largura via sharp |
| Vantagens | Especializado em e-commerce, texto fiel, sombras reais, 4K nativo |

**6 imagens geradas (sugestao de estilos):**

| Posicao | Estilo | Descricao |
|---------|--------|-----------|
| 1 | Hero — fundo branco | Produto centralizado, fundo clean, iluminacao profissional |
| 2 | Angulo 45° | Produto em perspectiva, mostra profundidade |
| 3 | Detalhe/close-up | Textura, material, acabamento |
| 4 | Lifestyle | Produto em contexto de uso real |
| 5 | Escala/tamanho | Produto com referencia de tamanho |
| 6 | Embalagem/unboxing | Produto embalado ou sendo aberto |

**Rate limit:** 5 req/min por usuario (prevenir abuso — custo maior)

**Custo total por pagina:** ~R$4.40 ($0.82) = imagens + copy

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
GOOGLE_AI_API_KEY=AIza...
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
3. Faz upload de 1 foto de referencia do produto
4. Informa: preco, preco original, URL do checkout
5. Clica "Gerar com IA"
6. Em paralelo:
   - Nano Banana Pro gera 6 imagens profissionais e-commerce
   - Claude analisa foto e gera: nome, descricao, features, reviews, FAQ
7. Usuario ve preview da pagina completa (imagens + textos)
8. Edita textos se quiser (opcional)
9. Pede regeneracao de imagem ou texto especifico (opcional)
10. Clica "Publicar"
11. Recebe link compartilhavel
12. Usa o link nos anuncios (Meta Ads, Google Ads)
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
| E2 | Upload & AI | Upload referencia, Nano Banana (imagens), Claude (copy) | 3 |
| E3 | Page Builder | CRUD de paginas, interface de edicao | 2 |
| E4 | Publish & Serve | Render engine (template v3.0), publicacao, link publico | 2 |
| E5 | Dashboard | Listagem de paginas, acoes (editar, duplicar, deletar) | 1 |

**Total estimado:** 10 stories (sem auth = menos complexidade)

---

*PRD-001 braza.commerce v1.0 — Reviewed*
*Morgan (PM) + Aria (Architect) — 19/03/2026*
*Stack: Next.js 15 + NestJS + Prisma + PostgreSQL + Claude API (copy) + Nano Banana Pro (imagens)*
*14 endpoints | 2 models | 6 modulos | 3 paginas | 2 servicos de IA | ~R$4.40/pagina gerada | sem auth (v2)*
