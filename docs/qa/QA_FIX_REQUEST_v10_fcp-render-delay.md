# QA Fix Request — FCP Render Delay (1.3s → <0.5s)

**Date:** 2026-03-21
**Reviewer:** Quinn (QA) + Gage (DevOps)
**Gate Decision:** CONCERNS
**Target:** @dev (Dex)
**Context:** FCP caiu de 2.6s → 1.3s com as otimizações anteriores. Lighthouse mostra TTFB 0ms mas "Atraso na renderização do elemento: 1.270ms". Causa: 128KB de fonts base64 inline no `<style>` bloqueiam o parser antes do first paint.

**Regra inegociável:** Zero mudança visual. Fonte Inter continua sendo usada. Layout idêntico.

---

## PERF-01: Extrair fonts base64 do CSS inline → servir como arquivos .woff2

**Severidade:** HIGH
**Arquivo:** `packages/api/src/render/template.html`

**Problema:** Os @font-face com base64 inline adicionam ~128KB ao bloco `<style>`. O browser precisa parsear TODO o CSS antes de renderizar qualquer coisa. Lighthouse reporta:
- "Reduza o CSS não usado — Economia estimada de 53 KiB"
- "Atraso na renderização do elemento: 1.270 ms"

O CSS das fontes é contado como "não usado" porque o browser não precisa dele pra pintar o first frame (com `font-display: swap`, system fonts aparecem primeiro).

**Fix:**
1. Remover os 2 blocos `@font-face` com `src: url('data:font/woff2;base64,...')` do `<style>` do template
2. Substituir por `@font-face` que referencia arquivos locais:
```css
@font-face {
  font-family: 'Inter';
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url('fonts/inter-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-weight: 700;
  font-style: normal;
  font-display: swap;
  src: url('fonts/inter-700.woff2') format('woff2');
}
```
3. Os arquivos `inter-400.woff2` e `inter-700.woff2` já existem em `packages/api/src/render/fonts/` (baixados na task anterior)
4. No `CloudflarePagesService.deployAll()`, os fonts precisam ser copiados para cada slug dir no deploy (ou melhor, pra um diretório `fonts/` na raiz do deploy que é compartilhado)
5. No `StaticPageGeneratorService.generateLocal()`, copiar os fonts pro diretório estático local também

**Estrutura dos arquivos no CF Pages após deploy:**
```
/fonts/inter-400.woff2          ← compartilhado por todas as páginas
/fonts/inter-700.woff2
/{slug}/index.html               ← referencia ../fonts/inter-400.woff2
/{slug}/img/1.webp
```

**URL nos @font-face do HTML:**
- Para CF Pages: `src: url('../fonts/inter-400.woff2')` (relativo ao slug dir)
- Para local/Nginx: `src: url('/fonts/inter-400.woff2')` (absoluto)

**Alternativa mais simples:** Copiar os fonts DENTRO de cada slug dir (`/{slug}/fonts/`) pra evitar lidar com paths relativos diferentes entre CF e local. Duplica ~96KB por página mas simplifica muito o código.

**Resultado esperado:**
- CSS inline cai de ~173KB pra ~45KB (só estilos reais)
- Browser parsea CSS em ~50ms em vez de ~1270ms
- `font-display: swap` garante render imediato com system fonts
- Inter carrega em paralelo do mesmo edge CF (fast, sem CORS)

**Critério de aceite:**
- [ ] Zero `data:font/woff2;base64` no HTML
- [ ] @font-face referencia arquivos .woff2 (não base64)
- [ ] `font-display: swap` mantido
- [ ] Arquivos .woff2 acessíveis no CF Pages (HTTP 200)
- [ ] Lighthouse: "Reduza CSS não usado" desaparece ou cai significativamente
- [ ] Visual idêntico (fonte Inter renderiza normalmente)

---

## PERF-02: Manter imagem LCP inline (NÃO reverter)

**Severidade:** INFO
**Arquivo:** `packages/api/src/static-pages/static-page-generator.service.ts`

**Nota:** A imagem LCP inline (base64) NÃO é o problema. O Lighthouse mostra TTFB 0ms pra ela, e o atraso de 1.270ms é do parse do CSS (fonts), não da imagem. Manter a imagem inline — ela elimina o round trip de LCP.

**Ação:** Nenhuma. Não reverter o inline da imagem.

---

## Resumo

| ID | Sev | Descrição | Impacto estimado |
|----|-----|-----------|-----------------|
| PERF-01 | HIGH | Fonts base64 → arquivos .woff2 | -1000ms render delay |
| PERF-02 | INFO | Manter LCP inline (não mexer) | — |

**Estimativa:** FCP deve cair de 1.3s para ~0.3-0.5s. O render delay de 1.270ms será praticamente eliminado.

---

*QA Fix Request gerado por Quinn + Gage — 2026-03-21*
