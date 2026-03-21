# QA Fix Request — FCP Optimization (2.6s → <1s)

**Date:** 2026-03-21
**Reviewer:** Gage (DevOps) + Quinn (QA)
**Gate Decision:** CONCERNS
**Target:** @dev (Dex)
**Context:** Cloudflare Pages deploy funciona. TTFB é 129ms (ótimo). Mas FCP continua 2.6s por causa de render-blocking resources no template.

**Regra inegociável:** Zero mudança visual. O template renderiza exatamente igual. Só carrega mais rápido.

---

## PERF-01: Self-host da fonte Inter (eliminar Google Fonts round trip)

**Severidade:** HIGH
**Arquivo:** `packages/api/src/render/template.html`

**Problema:** O template carrega Inter do Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
```
Isso causa 3 requests externos (DNS + conexão + download) antes do browser ter a fonte. Mesmo com `media="print"` trick, o preconnect bloqueia.

**Fix:**
1. Baixar os arquivos `.woff2` da Inter (400 e 700 apenas — ver PERF-02)
2. Salvar em `packages/api/src/render/fonts/` (ou inline como base64 no CSS)
3. No template, substituir o `<link>` do Google Fonts por `@font-face` inline com os `.woff2` locais
4. Remover os 2 `<link rel="preconnect">` do Google Fonts
5. No `StaticPageGeneratorService`, copiar os fonts pro diretório estático (ou se inline base64, nada a fazer)

**Exemplo do @font-face inline:**
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

**Abordagem recomendada:** Inline base64 dos woff2 direto no CSS do template. Elimina 100% dos requests externos. O woff2 da Inter 400 tem ~90KB e 700 ~90KB. Inline base64 adiciona ~240KB ao HTML mas elimina todos os round trips de fonte.

**Alternativa mais leve:** Usar `font-display: swap` com system fonts como fallback e carregar Inter async. Mas self-host é mais previsível.

**Critério de aceite:**
- [ ] Zero requests para fonts.googleapis.com ou fonts.gstatic.com
- [ ] Fonte Inter renderiza igual (400 + 700)
- [ ] `font-display: swap` presente nos @font-face

---

## PERF-02: Reduzir pesos da fonte (4 → 2)

**Severidade:** MEDIUM
**Arquivo:** `packages/api/src/render/template.html`

**Problema:** O template carrega 4 pesos: 400, 600, 700, 800. Verificar uso real no CSS:
- `font-weight: 400` — texto normal
- `font-weight: 600` — usado em poucos lugares (pode ser substituído por 700)
- `font-weight: 700` — bold
- `font-weight: 800` — usado em 1-2 lugares (pode ser substituído por 700)

**Fix:**
1. No CSS do template, trocar `font-weight: 600` por `font-weight: 700`
2. Trocar `font-weight: 800` por `font-weight: 700`
3. Carregar apenas 2 pesos: 400 e 700
4. Resultado: metade dos bytes de fonte

**Critério de aceite:**
- [ ] Apenas pesos 400 e 700 carregados
- [ ] Nenhum `font-weight: 600` ou `font-weight: 800` no CSS
- [ ] Visual identico (diferença entre 600/700/800 é imperceptível em telas)

---

## PERF-03: Inline da imagem LCP como base64

**Severidade:** MEDIUM
**Arquivo:** `packages/api/src/static-pages/static-page-generator.service.ts`

**Problema:** A primeira imagem do carousel (LCP element) é carregada como request separado. Mesmo com `<link rel="preload">`, é um round trip extra antes do Largest Contentful Paint.

**Fix:**
1. No `generateLocal()`, após copiar as imagens, ler a primeira imagem (`1.webp`) em base64
2. No HTML, substituir o `src="img/1.webp"` da primeira slide por `src="data:image/webp;base64,{base64}"`
3. Remover o `<link rel="preload">` da primeira imagem (já está inline, preload não faz sentido)
4. Manter as demais imagens (2-6) como arquivos separados com lazy loading

**Atenção:** A imagem inline aumenta o HTML em ~10-30KB (dependendo do tamanho da webp). Mas elimina completamente o round trip LCP. O tradeoff é positivo porque o HTML já vem na primeira resposta.

**Critério de aceite:**
- [ ] Primeira imagem do carousel inline como base64 no HTML
- [ ] Preload tag da LCP removido
- [ ] Imagens 2-6 continuam como arquivos separados com lazy loading
- [ ] LCP < 1.5s no Lighthouse

---

## Resumo

| ID | Sev | Descrição | Impacto estimado |
|----|-----|-----------|-----------------|
| PERF-01 | HIGH | Self-host Inter (eliminar Google Fonts) | -800ms FCP |
| PERF-02 | MEDIUM | Reduzir pesos 4→2 | -200ms FCP |
| PERF-03 | MEDIUM | Inline LCP image base64 | -500ms LCP |

**Estimativa:** FCP deve cair de 2.6s para ~1.0-1.2s com os 3 fixes combinados.

**Ordem de fix:** PERF-01 + PERF-02 juntos (são no mesmo arquivo), depois PERF-03.

---

*QA Fix Request gerado por Quinn + Gage — 2026-03-21*
