# QA Fix Request — Cloudflare Pages Polish (v8)

**Date:** 2026-03-21
**Reviewer:** Quinn (QA)
**Gate Decision:** CONCERNS
**Target:** @dev (Dex)
**Context:** Re-review após fixes do v7. Sem issues bloqueantes, mas 2 items para ficar 100%.

---

## MEDIUM-01: Import dinâmico desnecessário dentro do loop

**Severidade:** MEDIUM
**Arquivo:** `cloudflare-pages.service.ts:86,124`

**Problema:** `readFile`, `writeFile` e `rm` são importados via `await import('fs/promises')` dentro do método, mas `readdir`, `copyFile` e `mkdir` já estão importados estaticamente no topo do arquivo (linha 2). Inconsistência e overhead desnecessário de dynamic import.

**Fix:** Adicionar `readFile`, `writeFile` e `rm` ao import estático da linha 2 e remover os `await import(...)` das linhas 86 e 124.

**Critério de aceite:**
- [ ] `readFile`, `writeFile`, `rm` no import estático da linha 2
- [ ] Zero `await import('fs/promises')` no código
- [ ] Build passa sem erros

---

## LOW-01: Parâmetro excludeSlug não utilizado no fluxo real

**Severidade:** LOW
**Arquivo:** `cloudflare-pages.service.ts:52`, `static-page-generator.service.ts:105`

**Problema:** `deployAll` aceita `excludeSlug` como parâmetro opcional (linha 52, 69), mas o `remove()` no `StaticPageGeneratorService` (linha 105) chama `deployAll(this.staticDir)` SEM passar o slug excluído. Como o diretório local já foi deletado na linha 96 antes do `deployAll`, funciona corretamente — mas o parâmetro `excludeSlug` nunca é usado e é dead code na API pública.

**Fix:** Remover o parâmetro `excludeSlug` do `deployAll()` já que o fluxo de remoção deleta o diretório local antes de chamar o deploy (o slug já não vai existir no `staticDir`).

**Critério de aceite:**
- [ ] Parâmetro `excludeSlug` removido de `deployAll()`
- [ ] Filtro `e.name !== excludeSlug` removido da linha 69
- [ ] Build passa sem erros

---

## Resumo

| ID | Sev | Descrição | Bloqueia? |
|----|-----|-----------|-----------|
| MEDIUM-01 | MEDIUM | Import dinâmico desnecessário | NAO |
| LOW-01 | LOW | Parâmetro excludeSlug dead code | NAO |

---

*QA Fix Request gerado por Quinn — 2026-03-21*
