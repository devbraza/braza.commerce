# QA Fix Request — BrazaChat v0.1.0

**Reviewer:** Quinn (QA)
**Date:** 2026-03-15
**Gate Decision:** CONCERNS
**Target:** @dev (Dex)

---

## Instruções para o Dev

Corrija os itens abaixo na ordem indicada (Wave 1 primeiro, depois Wave 2, etc.). Cada wave agrupa itens que podem ser feitos em paralelo. Só avance para a próxima wave quando a anterior estiver completa.

Após corrigir tudo, rode `npm run typecheck && npm run lint && npm run test && npm run build` e confirme que tudo passa. Depois marque como "Ready for Review" novamente.

---

## Wave 1 — BLOQUEADORES CRÍTICOS (fazer primeiro)

### FIX-001: Conectar webhook WhatsApp ao service
**Severidade:** CRITICAL
**Arquivo:** `packages/api/src/whatsapp/whatsapp.controller.ts`
**Problema:** O `POST /webhook/whatsapp` responde `200 EVENT_RECEIVED` mas nunca chama `whatsappService.handleWebhook()`. Todo o pipeline de mensagens inbound é código morto.
**Correção:** Implementar resolução de `userId` (pode ser via config/env var para v1 single-tenant) e chamar `this.whatsappService.handleWebhook(body, userId)` antes do `res.status(200).send()`.
**ACs afetados:** Story 3.1 (todos), FR3

---

### FIX-002: Remover JWT Secret fallback inseguro
**Severidade:** CRITICAL
**Arquivo:** `packages/api/src/auth/auth.service.ts` (linha ~69) e `packages/api/src/auth/guards/jwt-auth.guard.ts` (linha ~17)
**Problema:** `process.env.JWT_SECRET || 'secret'` — fallback previsível.
**Correção:** Remover o fallback. Lançar erro se `JWT_SECRET` não estiver definido:
```typescript
const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET environment variable is required');
```
**ACs afetados:** NFR4, segurança geral

---

### FIX-003: Adicionar validação de assinatura no webhook
**Severidade:** CRITICAL
**Arquivo:** `packages/api/src/whatsapp/whatsapp.controller.ts`
**Problema:** Webhook aceita qualquer POST sem validar `X-Hub-Signature-256`.
**Correção:** Criar um guard ou middleware que valide o header `X-Hub-Signature-256` usando `FACEBOOK_APP_SECRET` como chave HMAC-SHA256 sobre o raw body.
**ACs afetados:** Story 3.1 AC2, NFR8

---

### FIX-004: Adicionar DTOs com class-validator nos controllers
**Severidade:** CRITICAL
**Arquivos:** Todos os controllers que usam `dto: any`:
- `campaigns/campaigns.controller.ts` — criar `CreateCampaignDto`, `UpdateCampaignDto`
- `events/events.controller.ts` — criar `CreateEventDto`
- `orders/orders.controller.ts` — criar `CreateOrderDto`, `UpdateAddressDto`
- `whatsapp/whatsapp.controller.ts` — criar `SendMessageDto`, `CreateConversationEventDto`
**Problema:** Sem validação, dados inválidos passam direto para o Prisma.
**Correção:** Criar DTOs com decorators `@IsString()`, `@IsUUID()`, `@IsEnum()`, `@IsOptional()`, etc. Adicionar `ValidationPipe` global no `main.ts`:
```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```
**ACs afetados:** Todas as stories com validação

---

## Wave 2 — SEGURANÇA E INTEGRIDADE

### FIX-005: Verificar ownership de productId/adAccountId na criação de campanha
**Severidade:** HIGH
**Arquivo:** `packages/api/src/campaigns/campaigns.service.ts`
**Problema:** `create()` aceita qualquer `productId` e `adAccountId` sem verificar se pertencem ao userId.
**Correção:** Antes de criar, verificar:
```typescript
const product = await this.prisma.product.findFirst({ where: { id: dto.productId, userId } });
if (!product) throw new NotFoundException('Product not found');
const adAccount = await this.prisma.adAccount.findFirst({ where: { id: dto.adAccountId, userId } });
if (!adAccount) throw new NotFoundException('Ad Account not found');
```

---

### FIX-006: Corrigir normalizePhone para E.164 compliance
**Severidade:** HIGH
**Arquivo:** `packages/api/src/common/utils/hash.ts`
**Problema:** `normalizePhone` não remove o `+` do início. Meta CAPI exige E.164 sem `+`.
**Correção:**
```typescript
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}
```

---

### FIX-007: Corrigir acesso direto ao prisma no controller
**Severidade:** MEDIUM
**Arquivo:** `packages/api/src/whatsapp/whatsapp.controller.ts`
**Problema:** `createEvent` usa `(this.whatsappService as any).prisma` — quebra encapsulamento.
**Correção:** Criar método `getConversation(userId, conversationId)` no `WhatsappService` e usar no controller.

---

### FIX-008: Corrigir orderId para formato ORD-XXXX sequencial
**Severidade:** MEDIUM
**Arquivos:** `packages/api/src/events/events.service.ts` e `packages/api/src/orders/orders.service.ts`
**Problema:** Dois formatos diferentes de orderId (`ORD-{timestamp}` vs `UUID.slice(0,8)`), ambos com risco de colisão.
**Correção:** Usar formato consistente `ORD-` + 4 dígitos sequenciais. Consultar último orderId do usuário e incrementar.

---

## Wave 3 — FRONTEND CRÍTICO

### FIX-009: Página Campaigns — formulário de criação
**Severidade:** HIGH
**Arquivo:** `packages/web/src/app/campaigns/page.tsx`
**Problema:** Não tem formulário para criar campanhas — apenas lista.
**Correção:** Adicionar formulário com:
- Campos: name, productId (dropdown), adAccountId (dropdown), pixelId (dropdown filtrado por adAccount), adsetName, adName, creativeName
- Após criação: exibir painel "Link de Campanha" com link completo, link curto, tabela de UTMs, botões "Copiar Link Completo", "Copiar Link Curto", "Testar Link"
**ACs afetados:** Story 2.2 AC3-8

---

### FIX-010: Página Settings — implementar 4 abas
**Severidade:** HIGH
**Arquivo:** `packages/web/src/app/settings/page.tsx`
**Problema:** Exibe apenas perfil read-only. Faltam abas Profile, Integrations, Tracking, Shipping.
**Correção:** Implementar componente de tabs com:
- **Profile:** nome editável, timezone dropdown
- **Integrations:** status Facebook, botão reconectar, permissões
- **Tracking:** domínio, preview link, checkbox UTMs auto
- **Shipping:** dados remetente para etiquetas
**ACs afetados:** Story 6.3 (9 de 10 ACs)

---

### FIX-011: Página Dashboard — filtros, gráficos e tabelas
**Severidade:** HIGH
**Arquivo:** `packages/web/src/app/dashboard/page.tsx`
**Problema:** Apenas KPI cards. Faltam filtros de período, gráficos, tabelas top campaigns/products/creatives.
**Correção:**
- Adicionar filtros de período (today/7d/30d) com date preset buttons do DS
- Adicionar variação percentual vs período anterior nos KPIs
- Tabela "Top 5 Campanhas" e "Top 5 Produtos"
- Loading skeletons do DS
- Estado vazio com call-to-action
**ACs afetados:** Story 6.1 AC1, AC3-9

---

### FIX-012: Página Leads — filtros avançados e drawer
**Severidade:** HIGH
**Arquivo:** `packages/web/src/app/leads/page.tsx`
**Problema:** Tabela básica sem filtros, sem drawer de detalhe, sem export CSV.
**Correção:**
- Filtros: status, campanha, produto
- Badge de último evento com cores do funil
- Busca por nome/telefone
- Botão exportar CSV
**ACs afetados:** Story 6.2 AC1-10

---

### FIX-013: Inbox — corrigir bug no valor do Purchase
**Severidade:** MEDIUM
**Arquivo:** `packages/web/src/app/inbox/page.tsx`
**Problema:** `fireEvent` nunca passa `value` para eventos Purchase:
```typescript
const value = type === 'Purchase' && product ? undefined : undefined;
```
Ambos os ramos retornam `undefined`.
**Correção:** Para Purchase, usar o preço do produto:
```typescript
const value = type === 'Purchase' ? selectedConv?.lead.product?.price : undefined;
```
**ACs afetados:** Story 4.1 AC5

---

## Wave 4 — MELHORIAS DE QUALIDADE

### FIX-014: Loading skeletons em todas as páginas
**Severidade:** LOW
**Arquivos:** Todos os `page.tsx` que usam `<p>Carregando...</p>`
**Correção:** Substituir por skeleton do DS:
```tsx
<div className="bg-[#111113] rounded-xl border border-white/[0.06] p-5 animate-pulse">
  <div className="h-4 bg-white/[0.06] rounded w-24 mb-4" />
  <div className="h-8 bg-white/[0.06] rounded w-32" />
</div>
```

---

### FIX-015: Adicionar paginação nos endpoints de listagem
**Severidade:** LOW
**Arquivos:** Todos os services com `findAll` (leads, orders, events, campaigns, products)
**Correção:** Aceitar `?page=1&limit=50` e aplicar `skip` / `take` no Prisma.

---

### FIX-016: Adicionar `max-w-5xl mx-auto` no conteúdo das páginas
**Severidade:** LOW
**Arquivos:** Todos os `page.tsx`
**Correção:** Wrapper interno: `<div className="max-w-5xl mx-auto">...</div>`

---

## Resumo

| Wave | Itens | Severidade | Escopo |
|------|-------|------------|--------|
| Wave 1 | FIX-001 a FIX-004 | CRITICAL | Backend — segurança e funcionalidade core |
| Wave 2 | FIX-005 a FIX-008 | HIGH/MEDIUM | Backend — integridade e compliance |
| Wave 3 | FIX-009 a FIX-013 | HIGH/MEDIUM | Frontend — páginas incompletas |
| Wave 4 | FIX-014 a FIX-016 | LOW | Polimento visual e UX |

**Total: 16 itens de correção em 4 waves.**

---

*Gerado por Quinn (QA) — 2026-03-15*
*Gate: CONCERNS — requer correção dos bloqueadores antes de aprovação*
