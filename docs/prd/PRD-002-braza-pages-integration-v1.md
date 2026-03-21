# PRD-002 — Integração braza.commerce ↔ braza.pages v1.0

> Publicar páginas geradas no braza.commerce diretamente no braza.pages com um clique.
> Zero alterações em funcionalidades existentes de ambas as plataformas.

**Autor:** Morgan (PM) | **Data:** 20/03/2026 | **Status:** Draft | **Validação arquitetural:** ✅ Aprovado por Aria (@architect) — 20/03/2026
**Stakeholder:** João Duarte (Founder)

---

## 1. Problema

O braza.commerce gera landing pages de produto com IA, mas hoje serve essas páginas via NestJS (`GET /p/:slug`). Isso tem problemas:

1. **Performance** — TTFB alto, HTML servido dinamicamente pelo backend
2. **Sem domínio customizado** — páginas ficam em `api.braza.commerce/p/slug`
3. **Sem CDN** — sem cache na edge, sem Cloudflare, sem otimização de entrega
4. **Sem monitoramento** — sem health check, sem alertas de downtime

O braza.pages já resolve todos esses problemas — deploy estático na Vercel, domínios customizados via Cloudflare, health monitoring, alertas.

**Falta a ponte entre eles.**

---

## 2. Visão da integração

```
braza.commerce [gera HTML] → botão "Publicar com braza.pages" → braza.pages [publica exatamente como recebeu]
```

### Princípios inegociáveis

| # | Princípio | Detalhe |
|---|-----------|---------|
| 1 | Template v3.0 intocável | Zero alterações no template do braza.commerce |
| 2 | braza.pages intocável | Zero breaking changes nas funcionalidades existentes |
| 3 | braza.commerce intocável | Zero breaking changes nas funcionalidades existentes |
| 4 | Plataformas independentes | Cada uma na sua URL, funcionam sozinhas |
| 5 | HTML intocável no transporte | O que o braza.commerce enviar, o braza.pages publica **exatamente como recebeu** — zero minificação, zero otimização, zero reprocessamento |

---

## 3. Usuário-alvo

O mesmo do PRD-001 — dropshippers, vendedores de e-commerce, afiliados.

A integração é **transparente** para o usuário final. Ele só vê um botão novo na tela de sucesso.

---

## 4. Arquitetura da integração

### 4.1 Modelo de operação

| Plataforma | URL | Função | Database |
|-----------|-----|--------|----------|
| **braza.commerce** | `commerce.braza.chat` | Criar páginas (fotos + IA → HTML) | Prisma + PostgreSQL |
| **braza.pages** | `pages.braza.chat` | Publicar páginas em domínio customizado | Drizzle + Neon |
| **Páginas publicadas** | domínio do cliente | O que o visitante final vê | — |

### 4.2 Independência total

- Se o braza.pages cair → braza.commerce continua funcionando normalmente
- Se o braza.commerce cair → páginas já publicadas continuam online
- Nenhuma plataforma depende da outra para operar

### 4.3 Comunicação

```
braza.commerce  ──HTTP/API──►  braza.pages
                  (x-api-key)
```

Comunicação unidirecional: braza.commerce **chama** o braza.pages. Nunca o contrário.

---

## 5. Funcionalidades (Scope)

### 5.1 No braza.commerce (frontend)

#### FR-01: Botão "Publicar com braza.pages" na tela de sucesso

**Onde:** Step 4 do fluxo de criação (`packages/web/src/app/pages/new/page.tsx`)

**Comportamento:**
- Aparece na tela de sucesso, após a publicação local (step 4)
- Ao clicar:
  1. Busca o HTML renderizado da página (já pronto, via `GET /p/:slug`)
  2. Envia o HTML para o braza.pages via API
  3. Mostra status de progresso (enviando → publicado)
  4. Exibe a URL final do braza.pages (domínio customizado)

**UI:**
```
✓ Página publicada!

  braza.commerce/p/caneta-inteligente

  [Ver página]  [Dashboard]

  ─────────────────────────────────
  🚀 Publicar com braza.pages
  Publique em domínio customizado com CDN global
  [Publicar com braza.pages]
  ─────────────────────────────────
```

**Estados do botão:**
| Estado | Texto | Visual |
|--------|-------|--------|
| Disponível | "Publicar com braza.pages" | Botão secundário |
| Enviando | "Publicando..." | Loading spinner |
| Sucesso | "Publicado! → meudominio.com/slug" | Verde, link clicável |
| Erro | "Falha ao publicar. Tentar novamente?" | Vermelho, retry |
| braza.pages offline | "Serviço indisponível no momento" | Cinza, desabilitado |

#### FR-02: Indicador de publicação braza.pages no dashboard

**Onde:** Dashboard de páginas (`packages/web/src/app/pages/page.tsx`)

**Comportamento:**
- Páginas publicadas via braza.pages mostram badge adicional: "braza.pages ✓"
- Link clicável que abre a URL do braza.pages em nova aba
- Informação salva no campo `brazaPagesUrl` do model Page

### 5.2 No braza.commerce (backend)

#### FR-03: Endpoint de publicação no braza.pages

**Onde:** Novo endpoint no PagesController (`packages/api/src/pages/pages.controller.ts`)

```
POST /pages/:id/publish-to-braza-pages
Body: { domain_id?: string }
```

**Lógica:**
1. Busca a página pelo ID (valida que está PUBLISHED)
2. Renderiza o HTML completo via `RenderService.render(page)` — mesmo HTML que o `GET /p/:slug` serve
3. Envia o HTML para o braza.pages (endpoint de passthrough)
4. Recebe a URL de retorno
5. Salva `brazaPagesUrl` e `brazaPagesDeployId` no model Page
6. Retorna a URL ao frontend

#### FR-04: Campo brazaPagesUrl no model Page

**Onde:** Schema Prisma (`packages/api/prisma/schema.prisma`)

**Novos campos:**
```prisma
model Page {
  // ... campos existentes (intocados)
  brazaPagesUrl       String?   // URL da página no braza.pages
  brazaPagesDeployId  String?   // ID do deployment no braza.pages
  brazaPagesPublishedAt DateTime? // Quando foi publicado no braza.pages
}
```

#### FR-05: Serviço de comunicação com braza.pages

**Onde:** Novo serviço (`packages/api/src/braza-pages/braza-pages.service.ts`)

**Responsabilidades:**
- Encapsula toda comunicação HTTP com a API do braza.pages
- Envia HTML + slug + domain_id + source
- Recebe resposta com `{ success, url, deployment_id, vercel_deployment_id, status, source }`
- Trata erros por código HTTP (401, 400, 413, 422, 404, 502)
- Health check antes de publicar (validar que braza.pages está acessível)

**Configuração via env vars (conforme contrato braza.pages):**
```env
BRAZA_PAGES_URL=https://pages.braza.chat
BRAZA_PAGES_API_KEY=secret-compartilhado
```

**Referência:** Contrato completo em `braza.pages/docs/INTEGRATION-DEPLOY-PASSTHROUGH.md`

### 5.3 No braza.pages (backend) — ✅ IMPLEMENTADO

#### FR-06: Endpoint de deploy passthrough (HTML direto) — ✅ PRONTO

**Status:** Implementado em 20/03/2026. Documentação em `braza.pages/docs/INTEGRATION-DEPLOY-PASSTHROUGH.md`.

**Contrato real implementado:**

```
POST /api/deploy-passthrough
Headers: { x-api-key: API_SECRET, Content-Type: application/json }
Body: {
  html: string,        // HTML completo — max 50MB — NÃO MODIFICADO
  slug: string,        // a-z, 0-9, hífens — começa/termina com letra/número
  domain_id: string,   // UUID de domínio ACTIVE no braza.pages
  source: "braza-commerce"  // Opcional — identificador da origem
}
```

**Response sucesso (200):**
```json
{
  "success": true,
  "url": "https://meudominio.com/meu-produto",
  "deployment_id": "uuid-do-registro-no-banco",
  "vercel_deployment_id": "dpl_abc123",
  "status": "ready",
  "source": "braza-commerce"
}
```

**Códigos de erro:**
| Status | Quando |
|--------|--------|
| 401 | x-api-key ausente ou inválida |
| 400 | Body não é JSON válido |
| 413 | HTML maior que 50MB |
| 422 | Campo obrigatório faltando, slug inválido, UUID inválido, domínio não ativo |
| 404 | domain_id não existe no banco |
| 502 | Falha no deploy da Vercel |

**Arquivos criados no braza.pages:**
| Arquivo | Função |
|---------|--------|
| `app/api/deploy-passthrough/route.ts` | Endpoint principal |
| `migrations/0001_add_passthrough_deploy_type.sql` | Migration do enum |
| `docs/INTEGRATION-DEPLOY-PASSTHROUGH.md` | Documentação de integração |

---

## 6. Fora do escopo (MVP)

| Item | Motivo | Futuro? |
|------|--------|---------|
| Gestão de domínios pelo braza.commerce | Complexidade — usuário configura domínios direto no braza.pages | v2 |
| Sincronização bidirecional | Não necessário — comunicação é unidirecional | Avaliar |
| Atualizar página já publicada no braza.pages | MVP = publicar uma vez | v2 |
| Despublicar via braza.commerce | Usuário faz direto no braza.pages | v2 |
| Seleção de domínio na UI | MVP = usa domínio padrão configurado via env | v2 |
| Tracking/campaigns nas páginas braza.pages | Tracking script é injetado no HTML pelo render — já vai junto | — |
| Self-hosting de imagens no braza.pages | Ver limitação CON-01 abaixo | v2 |

---

## 7. Fluxo completo (end-to-end)

```
USUÁRIO no braza.commerce:
  1. Sobe fotos do produto
  2. IA gera textos
  3. Revisa e edita
  4. Escolhe slug
  5. Publica (localmente no braza.commerce — /p/:slug)
  6. Vê tela de sucesso ← AQUI aparece o botão novo
  7. Clica "Publicar com braza.pages"

BRAZA.COMMERCE (backend):
  8. Renderiza HTML completo (mesmo do /p/:slug)
  9. POST para braza.pages /api/deploy-passthrough
     { html: "<!DOCTYPE html>...", slug: "caneta-inteligente", domain_id: "uuid" }

BRAZA.PAGES:
  10. Recebe HTML (não toca nele)
  11. Deploy na Vercel: /caneta-inteligente/index.html
  12. Purga cache Cloudflare
  13. Retorna: https://meudominio.com/caneta-inteligente

BRAZA.COMMERCE:
  14. Salva brazaPagesUrl no database
  15. Mostra URL ao usuário: "Publicado! → meudominio.com/caneta-inteligente"

VISITANTE FINAL:
  16. Acessa https://meudominio.com/caneta-inteligente
  17. Cloudflare serve do cache → Vercel serve o HTML estático
  18. Vê a mesma página, com performance máxima
```

---

## 7.1 Limitações conhecidas (validação arquitetural — @architect)

| ID | Limitação | Impacto | Severidade | Resolução |
|---|---|---|---|---|
| **CON-01** | Imagens no HTML apontam para o servidor do braza.commerce (`{API_URL}/uploads/...`). Se o braza.commerce cair, imagens quebram nas páginas publicadas via braza.pages. | Dependência de runtime parcial — contradiz independência total | **MÉDIA** | MVP: aceitável, funciona. v2: upload de imagens junto com HTML ou usar URLs de produção absolutas |
| **CON-02** | `domain_id` fixo via env var — todas as páginas vão para o mesmo domínio | Sem flexibilidade de domínio por página | **BAIXA** | MVP: suficiente (1 operador, 1 domínio). v2: seleção de domínio na UI |
| **CON-03** | Slug collision teórica — braza.commerce e braza.pages validam unicidade nos seus próprios DBs independentemente | Se slug existir por outra via no braza.pages, será sobrescrito sem aviso | **BAIXA** | MVP: risco mínimo (mesmo operador). Slug do braza.commerce é repassado diretamente |

---

## 8. Requisitos não-funcionais

| # | Requisito | Meta |
|---|-----------|------|
| NFR-01 | Latência do deploy | < 30 segundos (upload HTML + deploy Vercel + purge cache) |
| NFR-02 | Disponibilidade | Degradação graciosa — se braza.pages offline, botão desabilitado |
| NFR-03 | Segurança | API key compartilhada, nunca exposta no frontend |
| NFR-04 | HTML fidelidade | Byte-a-byte — o HTML servido no domínio deve ser idêntico ao enviado |
| NFR-05 | Tamanho máximo HTML | Até 50MB (limite do braza.pages — template v3.0 renderizado ≈ 45KB) |
| NFR-06 | Idempotência | Publicar a mesma página 2x atualiza o deploy, não duplica |

---

## 9. Métricas de sucesso

| Métrica | Meta | Como medir |
|---------|------|-----------|
| Taxa de uso do botão | > 50% das páginas publicadas | `COUNT(brazaPagesUrl IS NOT NULL) / COUNT(status=PUBLISHED)` |
| Taxa de sucesso do deploy | > 95% | Logs de erro no braza-pages.service |
| Tempo médio de deploy | < 15s | Timestamp entre clique e resposta |

---

## 10. Dependências e riscos

### Dependências

| Dependência | De | Para | Tipo |
|-------------|-----|------|------|
| API key compartilhada | braza.pages | braza.commerce | Configuração |
| Domínio ativo no braza.pages | braza.pages | Endpoint passthrough | Pré-requisito |
| braza.pages rodando | braza.pages | Botão funcionar | Runtime |

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| braza.pages offline | Baixa | Baixa | Botão desabilitado, retry manual |
| HTML muito grande (> 50MB) | Muito baixa | Média | Validação de tamanho no endpoint (braza.pages retorna 413) |
| API key comprometida | Baixa | Alta | Rotação de key, rate limiting |
| Imagens quebram se braza.commerce cair | Média | Média | CON-01: URLs apontam para braza.commerce — resolver na v2 |

---

## 11. Estimativa de impacto nos projetos

### braza.commerce — ADITIVO APENAS

| Tipo | Arquivo | Mudança |
|------|---------|---------|
| **Novo** | `packages/api/src/braza-pages/braza-pages.service.ts` | Serviço de comunicação |
| **Novo** | `packages/api/src/braza-pages/braza-pages.module.ts` | Module NestJS |
| **Edição mínima** | `packages/api/src/pages/pages.controller.ts` | +1 endpoint (`POST /:id/publish-to-braza-pages`) |
| **Edição mínima** | `packages/api/prisma/schema.prisma` | +3 campos opcionais no model Page |
| **Edição mínima** | `packages/web/src/app/pages/new/page.tsx` | +1 botão no step 4 |
| **Edição mínima** | `packages/web/src/app/pages/page.tsx` | +1 badge no card de página |
| **Edição mínima** | `packages/api/src/pages/pages.module.ts` | Import do BrazaPagesModule |
| **Nenhuma** | `packages/api/src/render/template.html` | ❌ INTOCÁVEL |
| **Nenhuma** | `packages/api/src/render/render.service.ts` | ❌ INTOCÁVEL |

### braza.pages — ✅ IMPLEMENTADO (20/03/2026)

| Tipo | Arquivo | Status |
|------|---------|--------|
| **Novo** | `app/api/deploy-passthrough/route.ts` | ✅ Implementado |
| **Novo** | `migrations/0001_add_passthrough_deploy_type.sql` | ✅ Aplicado |
| **Novo** | `docs/INTEGRATION-DEPLOY-PASSTHROUGH.md` | ✅ Documentado |
| **Edição mínima** | `lib/db/schema.ts` | ✅ Enum `deploy_type` + `"passthrough"` |
| **Nenhuma** | Todos os endpoints existentes | ❌ INTOCADOS |
| **Nenhuma** | Pipeline de geração IA | ❌ INTOCADO |
| **Nenhuma** | Pipeline de otimização | ❌ INTOCADO |

---

## 12. Épicos sugeridos

| Epic | Escopo | Projeto | Status |
|------|--------|---------|--------|
| E11 — braza.pages Passthrough API | Endpoint `/api/deploy-passthrough` | braza.pages | ✅ CONCLUÍDO |
| E12 — braza.commerce → braza.pages Integration | Serviço, endpoint, UI (botão + badge) | braza.commerce | 🔜 PRÓXIMO |

**Ordem de execução:** ~~E11 primeiro~~ ✅ → E12 agora (integrar no braza.commerce).

**Env vars necessárias no braza.commerce (conforme contrato):**
```env
BRAZA_PAGES_URL=https://pages.braza.chat           # URL base do braza.pages
BRAZA_PAGES_API_KEY=mesmo-valor-do-API_SECRET       # Chave compartilhada
BRAZA_PAGES_DEFAULT_DOMAIN_ID=uuid-do-dominio       # Domínio padrão para deploy (MVP)
```

---

*PRD-002 — braza.commerce ↔ braza.pages Integration v1.0*
*Morgan (PM) — 20/03/2026*
