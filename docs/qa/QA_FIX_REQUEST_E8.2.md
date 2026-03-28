# QA Fix Request — E8.2 CAPI Event Deduplication

> **Story:** E8.2
> **Reviewer:** Quinn (QA)
> **Data:** 2026-03-28
> **Veredito anterior:** CONCERNS
> **Objetivo:** Elevar para PASS

---

## Issue #1: event_id nao e deterministico (retries geram IDs diferentes)

**Severidade:** MEDIUM
**Arquivo:** `packages/api/src/capi/capi.service.ts`

**Problema:**
O `event_id` atual usa `Date.now()` no formato: `vc_{clickId}_{timestamp}`. Se o webhook da Yampi reenviar o mesmo evento (retry de rede), o timestamp sera diferente, gerando um `event_id` novo. Meta trata como evento separado — nao deduplica.

**Fix:**
Remover timestamp do `event_id`. Usar apenas `{type}_{click.clickId}`. Como o banco so permite um evento por click+tipo, o `clickId` ja e unico o suficiente.

**De:**
```typescript
const eventId = `vc_${click.clickId}_${Date.now()}`;
const eventId = `purchase_${click.clickId}_${Date.now()}`;
```

**Para:**
```typescript
const eventId = `vc_${click.clickId}`;
const eventId = `purchase_${click.clickId}`;
```

---

## Issue #2: CAPI dispara mesmo quando evento e duplicata no banco

**Severidade:** HIGH
**Arquivo:** `packages/api/src/webhooks/yampi.controller.ts`

**Problema:**
Quando o webhook Yampi chega pela segunda vez:
1. `registerEvent()` detecta duplicata no banco e retorna o evento existente (nao cria novo)
2. Mas `sendPurchase()` e chamado de qualquer forma (linha 58) — dispara CAPI pro Facebook

Com o event_id deterministico (fix #1), Meta deduplicaria. Porem, o correto e nem fazer a chamada HTTP desnecessaria.

**Fix:**
`registerEvent()` deve indicar se o evento e novo ou duplicata. Se duplicata, pular a chamada CAPI.

**De (yampi.controller.ts, linhas 54-61):**
```typescript
if (event === 'order.paid') {
  const total = this.yampi.extractOrderTotal(resource);
  await this.tracking.registerEvent(clickId, 'PURCHASE', total);
  await this.capi.sendPurchase(clickWithCampaign, clickWithCampaign.campaign, total).catch(...);
}
```

**Para:**
```typescript
if (event === 'order.paid') {
  const total = this.yampi.extractOrderTotal(resource);
  const ev = await this.tracking.registerEvent(clickId, 'PURCHASE', total);
  if (ev && ev.createdAt.getTime() > Date.now() - 5000) {
    await this.capi.sendPurchase(clickWithCampaign, clickWithCampaign.campaign, total).catch(...);
  } else {
    this.logger.warn(`CAPI Purchase skipped: duplicate event for click ${clickId}`);
  }
}
```

**Alternativa mais limpa:** Fazer `registerEvent` retornar `{ event, isNew }` para deixar explicito.

---

## Resumo

| # | Severidade | Arquivo | Fix |
|---|-----------|---------|-----|
| 1 | MEDIUM | capi.service.ts | Remover timestamp do event_id |
| 2 | HIGH | yampi.controller.ts + tracking.service.ts | Pular CAPI quando evento e duplicata |

**Criterio de PASS:** Ambos os fixes implementados + tsc zero errors.
