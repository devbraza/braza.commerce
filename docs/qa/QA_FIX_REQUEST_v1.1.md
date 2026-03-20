# QA Fix Request — Post-Implementation Audit v1.1

**De:** Quinn (QA)
**Para:** @dev (Dex)
**Data:** 2026-03-20
**Contexto:** Auditoria pos-implementacao do Fix Plan v1.1 (6 fases). A maioria das correcoes foi aplicada corretamente. Os issues abaixo sao residuais.

---

## Issues Encontrados

### FIX-1 — HIGH — Settings interface desatualizada + logica quebrada
**Arquivo:** `packages/web/src/app/settings/page.tsx`
**Linhas:** 8-13, 29

**Problema:** O backend agora retorna `hasYampiSecret: boolean` e `yampiSecretKey: undefined` (via `settings.service.ts:get()`), mas o frontend ainda espera `yampiSecretKey: string | null`. Isso causa:
- Linha 29: `setYampiSecret(s.yampiSecretKey || '')` sempre inicializa como `''` — usuario nunca sabe se ja tem secret configurada
- A interface nao reflete o campo `hasYampiSecret` que o backend retorna

**Correcao:**
1. Atualizar interface `SettingsData`:
```typescript
interface SettingsData {
  hasYampiSecret: boolean;
  defaultPixelId: string | null;
  defaultAccessToken: string | null;
  updatedAt: string;
}
```
2. Remover `setYampiSecret(s.yampiSecretKey || '')` da linha 29
3. Usar `settings.hasYampiSecret` para mostrar indicador visual (ex: "Secret configurada" ou placeholder diferente)
4. O campo yampiSecret deve comecar vazio — o usuario digita uma NOVA secret para substituir

---

### FIX-2 — MEDIUM — Settings accessToken input sem type="password"
**Arquivo:** `packages/web/src/app/settings/page.tsx`
**Linha:** 147

**Problema:** O input do Access Token nao tem `type="password"`. Embora o backend retorne mascarado, quando o usuario digita um novo token ele fica visivel em plaintext na tela.

**Correcao:** Adicionar `type="password"` ao input:
```tsx
<input
  type="password"
  value={accessToken}
  ...
```

---

### FIX-3 — LOW — Cor hardcoded fora do design system no step 4
**Arquivo:** `packages/web/src/app/pages/new/page.tsx`
**Linha:** 387

**Problema:** `text-[#2CB67D]` — cor hardcoded na mensagem de pagina publicada. Todas as outras instancias de `#2CB67D` foram convertidas para `bg-emerald-500`, mas esta foi esquecida.

**Correcao:** Trocar `text-[#2CB67D]` por `text-emerald-500`

---

### FIX-4 — MEDIUM — Events page mostra "Carregando..." junto com erro
**Arquivo:** `packages/web/src/app/events/page.tsx`
**Linhas:** 42-54

**Problema:** Quando `error` esta setado e `data` e null, a condicao `!error && data` e false, caindo no else que mostra "Carregando..." abaixo da mensagem de erro.

**Correcao:** Adicionar guard para nao renderizar loading quando tem error:
```tsx
{!error && data ? (
  <>...content...</>
) : !error ? (
  <div className="flex items-center justify-center py-20 text-zinc-500">Carregando...</div>
) : null}
```

---

### FIX-5 — LOW — MobileNav sem aria-current nos links ativos
**Arquivo:** `packages/web/src/components/layout/MobileNav.tsx`
**Linha:** 71 (dentro do Link)

**Problema:** O Sidebar recebeu `aria-current="page"` nos links ativos, mas o MobileNav nao. Inconsistencia de acessibilidade.

**Correcao:** Adicionar ao Link do MobileNav:
```tsx
<Link
  key={item.href}
  href={item.href}
  onClick={() => setOpen(false)}
  aria-current={active ? 'page' : undefined}
  className={...}
>
```

---

## Resumo

| # | Severidade | Arquivo | Descricao |
|---|-----------|---------|-----------|
| FIX-1 | HIGH | settings/page.tsx | Interface desatualizada + yampiSecret sempre vazio |
| FIX-2 | MEDIUM | settings/page.tsx | accessToken sem type="password" |
| FIX-3 | LOW | pages/new/page.tsx | Cor `#2CB67D` hardcoded no step 4 |
| FIX-4 | MEDIUM | events/page.tsx | Loading renderiza junto com erro |
| FIX-5 | LOW | MobileNav.tsx | aria-current faltando |

**Total: 1 HIGH, 2 MEDIUM, 2 LOW**

Nenhum CRITICAL. Todos corrigiveis em ~15 minutos.

---

*— Quinn, guardiao da qualidade*
