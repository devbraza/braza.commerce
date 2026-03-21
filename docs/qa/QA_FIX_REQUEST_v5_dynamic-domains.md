# QA Fix Request — FR-07/FR-08 Dynamic Domain Selection

> **Autor:** Quinn (@qa) | **Data:** 21/03/2026
> **Gate Decision:** CONCERNS (1 HIGH — bloqueia compilação)
> **Escopo:** Alterações de FR-07/FR-08 (listagem dinâmica de domínios)

---

## Issue 1 — TS4053: Interface `BrazaPagesDomain` não exportada

| Campo | Valor |
|-------|-------|
| **Severidade** | HIGH |
| **Bloqueia?** | Sim — erro de compilação TypeScript |
| **Arquivo** | `packages/api/src/braza-pages/braza-pages.service.ts` linha 18 |
| **Erro** | `TS4053: Return type of public method from exported class has or is using name 'BrazaPagesDomain' from external module but cannot be named` |

### Causa raiz

A interface `BrazaPagesDomain` é declarada sem `export`. O método público `listDomains()` retorna `Promise<BrazaPagesDomain[]>`. O `PagesController` expõe esse retorno via `@Get('braza-pages-domains')`, e o TypeScript exige que tipos usados em retornos de métodos públicos de classes exportadas sejam acessíveis externamente.

### Fix necessário

```diff
- interface BrazaPagesDomain {
+ export interface BrazaPagesDomain {
    id: string;
    domain: string;
    status: string;
  }
```

**Apenas 1 linha** — adicionar `export` antes de `interface`.

### Validação pós-fix

```bash
npx tsc -p packages/api/tsconfig.json --noEmit
# Esperado: 0 erros
```

---

## Checklist para o @dev

- [ ] Adicionar `export` à interface `BrazaPagesDomain` em `braza-pages.service.ts:18`
- [ ] Rodar `npx tsc -p packages/api/tsconfig.json --noEmit` e confirmar 0 erros
- [ ] Nenhum outro arquivo deve ser alterado

---

## Notas de review

Fora este issue, a implementação está sólida:

- `GET /pages/braza-pages-domains` posicionado corretamente antes de `GET :id`
- `domain_id` obrigatório no endpoint de publish (validação 400)
- `listDomains()` filtra apenas status ACTIVE
- Graceful degradation: retorna `[]` se braza.pages offline
- Frontend: select com auto-seleção do primeiro domínio
- `useEffect` carrega domínios apenas no step 4 (não no mount)
- `rel="noopener noreferrer"` adicionado no link de sucesso (fix do LOW anterior)
- Render, template e public controller — intocados

---

*Quinn (@qa) — 21/03/2026*
