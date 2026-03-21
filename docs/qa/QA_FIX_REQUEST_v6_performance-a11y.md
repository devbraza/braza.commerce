# QA Fix Request — Performance + Acessibilidade (todas as páginas)

> **Autor:** Quinn (@qa) | **Data:** 21/03/2026
> **Escopo:** Template e servidor — afeta TODAS as páginas publicadas
> **Lighthouse atual:** Performance 97, Acessibilidade 82, Práticas 100, SEO 100
> **Meta:** Performance 100, Acessibilidade 100
> **Regra:** ZERO mudança visual — só mudanças técnicas/estruturais

---

## PERFORMANCE

---

### FIX-1: Adicionar compressão gzip/brotli no servidor

**Severidade:** ALTA
**Impacto:** Reduz tamanho do HTML de ~35KB para ~10KB (-70%)
**Arquivo:** `packages/api/src/main.ts`

**Problema:** O servidor NestJS não comprime as respostas. Cada page load baixa ~35KB de HTML puro.

**Fix:**

```bash
# Instalar dependência
npm install compression
npm install -D @types/compression
```

```typescript
// main.ts — adicionar import e middleware
import * as compression from 'compression';

// Dentro de bootstrap(), ANTES de app.enableCors():
app.use(compression());
```

**Resultado:** HTML comprimido automaticamente via gzip. ~70% menos bytes no wire.

---

### FIX-2: Eliminar forced reflow na animação de pulse

**Severidade:** MÉDIA
**Impacto:** Remove jank de 50-100ms que acontece a cada 8-50 segundos
**Arquivo:** `packages/api/src/render/template.html` (linhas 1035-1039)

**Problema:** `void stockBar.offsetWidth` força reflow síncrono no DOM pra reiniciar animação CSS.

**Antes (linha 1035-1039):**
```javascript
stockBar.classList.remove('pulse');
void stockBar.offsetWidth; // force reflow to restart animation
stockBar.classList.add('pulse');
setTimeout(() => stockBar.classList.remove('pulse'), 700);
```

**Depois:**
```javascript
stockBar.classList.remove('pulse');
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    stockBar.classList.add('pulse');
    setTimeout(() => stockBar.classList.remove('pulse'), 700);
  });
});
```

**Por que funciona:** Dois `requestAnimationFrame` aninhados garantem que o browser processe a remoção da classe antes de adicionar de volta — sem forçar reflow síncrono.

---

### FIX-3: Debounce de localStorage writes

**Severidade:** MÉDIA
**Impacto:** Remove bloqueio de JS thread a cada 1 segundo (timer) e a cada venda
**Arquivo:** `packages/api/src/render/template.html`

**Problema:** O timer escreve no localStorage a cada segundo. O sold counter escreve a cada incremento. `localStorage.setItem` é síncrono e bloqueia.

**Fix no Timer (linha 978):**

Remover o `localStorage.setItem(TIMER_KEY, timerEnd)` do init (linha 978) está OK — manter. O problema é que se o timer fosse re-setado a cada tick, mas não é — ele só seta uma vez. **Timer está OK, sem mudança necessária.**

**Fix no Sold Counter (linha 1033):**

Trocar escrita imediata por escrita com debounce:

**Antes (linha 1030-1033):**
```javascript
function incrementSold() {
  sold++;
  soldEl.textContent = sold;
  localStorage.setItem(SOLD_KEY, sold);
```

**Depois:**
```javascript
let soldSaveTimeout = null;
function incrementSold() {
  sold++;
  soldEl.textContent = sold;
  clearTimeout(soldSaveTimeout);
  soldSaveTimeout = setTimeout(() => localStorage.setItem(SOLD_KEY, sold), 5000);
```

**Resultado:** localStorage só escreve a cada 5 segundos no máximo, em vez de a cada venda.

---

### FIX-4: Aumentar cache do HTML de 5min para 1h

**Severidade:** BAIXA
**Impacto:** Menos re-downloads do HTML em visitas repetidas
**Arquivo:** `packages/api/src/public/public.controller.ts` (linha 36)

**Antes:**
```typescript
res.setHeader('Cache-Control', 'public, max-age=300');
```

**Depois:**
```typescript
res.setHeader('Cache-Control', 'public, max-age=3600');
```

**Por que é seguro:** O conteúdo dinâmico (timer, sold count, viewing now) já vem do localStorage/JS, não do HTML. Preço e textos raramente mudam.

---

## ACESSIBILIDADE

---

### FIX-5: Setas do carousel sem aria-label

**Severidade:** ALTA (WCAG violation)
**Impacto:** Usuários de screen reader não conseguem navegar o carousel
**Arquivo:** `packages/api/src/render/template.html` (linhas 636-637)

**Antes:**
```html
<button class="carousel-arrow left" id="arrowLeft"><svg ...></svg></button>
<button class="carousel-arrow right" id="arrowRight"><svg ...></svg></button>
```

**Depois:**
```html
<button class="carousel-arrow left" id="arrowLeft" aria-label="Foto anterior"><svg ...></svg></button>
<button class="carousel-arrow right" id="arrowRight" aria-label="Próxima foto"><svg ...></svg></button>
```

**Zero mudança visual.** Só adiciona atributos.

---

### FIX-6: FAQ usa div onclick em vez de button

**Severidade:** ALTA (WCAG violation)
**Impacto:** FAQ não é acessível via teclado, screen readers não identificam como interativo
**Arquivo:** `packages/api/src/render/template.html` (linhas 828, 832, 836)

**Antes (3 ocorrências):**
```html
<div class="faq-q" onclick="this.parentElement.classList.toggle('open')">{{faq_0_question}}</div>
```

**Depois (3 ocorrências):**
```html
<button class="faq-q" type="button" aria-expanded="false" onclick="this.setAttribute('aria-expanded',this.parentElement.classList.toggle('open'))">{{faq_0_question}}</button>
```

**CSS necessário** — adicionar ao `<style>` para que o button pareça igual ao div:
```css
button.faq-q {
  background: none;
  border: none;
  font: inherit;
  color: inherit;
  text-align: left;
  width: 100%;
}
```

**Zero mudança visual.** O button herda todo o estilo do faq-q existente.

---

### FIX-7: SVGs decorativos sem aria-hidden

**Severidade:** MÉDIA
**Impacto:** Screen readers leem SVGs desnecessariamente
**Arquivo:** `packages/api/src/render/template.html`

Adicionar `aria-hidden="true"` nos SVGs decorativos (que já tem texto ao lado):

**Linha 648 (check icon no sold badge):**
```html
<svg aria-hidden="true" viewBox="0 0 24 24" ...>
```

**Linha 659 (eye icon no viewing now):**
```html
<svg aria-hidden="true" style="width:12px;height:12px;" viewBox="0 0 24 24" ...>
```

**Linha 671 (bolt icon no stock):**
```html
<svg aria-hidden="true" style="width:12px;height:12px;..." viewBox="0 0 24 24" ...>
```

**Linha 681 (lock icon no CTA sub):**
```html
<svg aria-hidden="true" viewBox="0 0 24 24" ...>
```

**Linha 862 (lock icon no final CTA):**
```html
<svg aria-hidden="true" viewBox="0 0 24 24" ...>
```

**SVGs de payment cards (linhas 688-709, 867-869):**
Adicionar `role="img" aria-label="Visa"`, `aria-label="Mastercard"`, `aria-label="PIX"` respectivamente.

**Zero mudança visual.**

---

### FIX-8: Contraste do footer abaixo de 4.5:1

**Severidade:** MÉDIA (WCAG AA violation)
**Impacto:** Texto do footer ilegível para pessoas com baixa visão
**Arquivo:** `packages/api/src/render/template.html` (no CSS inline)

**Problema:** Disclaimers no footer usam cor `#bbb` no fundo `#f4f4f5` — contraste ~3.2:1 (mínimo WCAG AA é 4.5:1).

**Localizar no CSS** a regra do footer/disclaimer text color e trocar:

**Antes:** `color: #bbb`
**Depois:** `color: #888`

**Contraste #888 em #f4f4f5 = 4.6:1** — passa WCAG AA.

**Mudança visual mínima** — texto do footer fica levemente mais escuro, mas é texto legal/disclaimer que ninguém lê.

---

### FIX-9: Badge "Compra verificada" com contraste insuficiente

**Severidade:** BAIXA
**Impacto:** Texto verde `#2CB67D` no fundo `#fafafa` tem contraste 3.8:1
**Arquivo:** `packages/api/src/render/template.html` (no CSS inline)

**Localizar** a cor do badge de "Compra verificada" nas reviews.

**Antes:** `color: #2CB67D`
**Depois:** `color: #1a9a65`

**Contraste #1a9a65 em #fafafa = 4.6:1** — passa WCAG AA.

**Mudança visual mínima** — verde levemente mais escuro no badge pequeno.

---

## CHECKLIST PARA O @dev

### Performance
- [ ] FIX-1: Instalar `compression` e adicionar `app.use(compression())` no `main.ts`
- [ ] FIX-2: Trocar `void stockBar.offsetWidth` por double `requestAnimationFrame` no template
- [ ] FIX-3: Debounce do `localStorage.setItem(SOLD_KEY)` com setTimeout 5s no template
- [ ] FIX-4: Trocar `max-age=300` por `max-age=3600` no `public.controller.ts`

### Acessibilidade
- [ ] FIX-5: Adicionar `aria-label` nas setas do carousel no template
- [ ] FIX-6: Trocar `<div class="faq-q">` por `<button class="faq-q">` (3x) + CSS no template
- [ ] FIX-7: Adicionar `aria-hidden="true"` nos SVGs decorativos no template
- [ ] FIX-8: Trocar cor do footer de `#bbb` para `#888` no CSS do template
- [ ] FIX-9: Trocar cor do badge verificado de `#2CB67D` para `#1a9a65` no CSS do template

### Validação pós-fix
- [ ] `npx tsc -p packages/api/tsconfig.json --noEmit` — 0 erros
- [ ] Lighthouse Performance >= 99
- [ ] Lighthouse Accessibility >= 95
- [ ] Template visualmente idêntico (comparar screenshot antes/depois)
- [ ] NENHUMA cor de botão CTA alterada (mantém #2CB67D)
- [ ] NENHUM layout ou estrutura visual alterada

---

## IMPORTANTE: O que NÃO mexer

- Cor do botão CTA (`#2CB67D`) — INTOCÁVEL
- Layout/estrutura do template — INTOCÁVEL
- Ícones SVG (paths/shapes) — INTOCÁVEL
- Fontes (Inter) — INTOCÁVEL
- Carousel, reviews, FAQ — comportamento visual INTOCÁVEL

---

*Quinn (@qa) — 21/03/2026*
