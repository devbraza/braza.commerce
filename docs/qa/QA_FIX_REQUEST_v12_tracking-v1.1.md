# QA_FIX_REQUEST v12 — Tracking v1.1

> **Autor:** Quinn (QA) | **Data:** 21/03/2026
> **Stories:** E7.1, E7.2, E8.1, E9.1
> **Gate:** CONCERNS → precisa fix antes de deploy
> **Prioridade:** Todas as issues devem ser corrigidas

---

## Issue 1 — MEDIUM: `duplicate()` nao copia tracking

**Arquivo:** `packages/api/src/pages/pages.service.ts` — metodo `duplicate()` (linha ~162)

**Problema:** Quando o usuario duplica uma pagina que tem Campaign ativa, a pagina duplicada nao herda o tracking. O `duplicate()` copia `checkoutUrl` da Page, mas nao cria Campaign para a copia. Resultado: pagina duplicada sem tracking ativo, script nao injetado no HTML.

**Correcao:** Apos criar a pagina duplicada, verificar se a pagina original tem Campaign ativa. Se sim, criar Campaign para a copia com os mesmos dados (checkoutUrl, pixelId, accessToken).

```typescript
// Apos criar a pagina duplicada:
const originalCampaign = await this.campaignsService.findActiveByPageId(id);
if (originalCampaign) {
  await this.campaignsService.create({
    pageId: duplicatedPage.id,
    name: duplicatedPage.title || duplicatedPage.slug,
    checkoutUrl: originalCampaign.checkoutUrl,
    pixelId: originalCampaign.pixelId,
    accessToken: originalCampaign.accessToken,
  });
}
```

**Teste:** Duplicar pagina com tracking → pagina duplicada tem Campaign ativa com mesmos dados.

---

## Issue 2 — MEDIUM: Frontend nao valida URL do checkout

**Arquivo:** `packages/web/src/app/pages/new/page.tsx` — funcao `saveTracking()` (linha ~186)

**Problema:** O Step 3 (tracking) aceita qualquer texto no campo URL do checkout. A AC diz "Validacao basica: URL do checkout deve comecar com `https://`", mas `saveTracking()` nao faz essa validacao. O usuario pode salvar uma URL invalida (ex: "yampi.com" sem https).

**Correcao:** Adicionar validacao antes de salvar:

```typescript
const saveTracking = async () => {
  if (!pageId) return;
  // Validacao: URL deve comecar com https://
  if (checkoutUrl && !checkoutUrl.startsWith('https://')) {
    alert('URL do checkout deve comecar com https://');
    return;
  }
  // ... resto do codigo
};
```

**Teste:** Digitar URL sem https → alerta exibido, nao salva. Digitar URL com https → salva normalmente.

---

## Issue 3 — LOW: Route order documentada

**Arquivo:** `packages/api/src/pages/pages.controller.ts` (linha ~63)

**Problema:** O endpoint `GET :id/stats` esta posicionado antes de `GET :id`, o que e correto para NestJS (mais especifico primeiro). Porem, se um pageId fosse literalmente "stats", haveria conflito. Com cuid() isso nunca acontece, mas a intencao deve ser documentada.

**Correcao:** Adicionar comentario no controller:

```typescript
// IMPORTANT: :id/stats MUST come before :id to avoid route conflict
@Get(':id/stats')
```

**Teste:** Nenhum teste necessario — apenas documentacao.

---

## Checklist de correcoes

- [x] Issue 1: `duplicate()` copia Campaign da pagina original
- [x] Issue 2: Validacao `https://` no frontend Step 3
- [x] Issue 3: Comentario de route order no controller

---

## Instrucoes para @dev

1. Corrigir as 3 issues na ordem listada
2. Rodar `npx tsc --noEmit` no api e web apos cada correcao
3. Marcar checkboxes acima conforme completar
4. Devolver para @qa para re-review

---

*QA_FIX_REQUEST v12 — Quinn (QA) — 21/03/2026*
