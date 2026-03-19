# Landing Page Template — Especificacao Final v2.0

> Template padrao aprovado para landing pages de produto (one-product page) do BrazaChat.
> Otimizado para conversao mobile-first. CTA redireciona para checkout externo (solucao terceira).
> **Aprovado em 19/03/2026 — Uma (UX) + Morgan (PM)**

## Arquivos de referencia

- **Preview final (com dados de exemplo):** `docs/prototypes/landing-page-preview.html`
- **Imagem de exemplo:** `docs/prototypes/product-main.webp`
- **Assets de pagamento:** SVGs inline (Visa, Mastercard, PIX) — sem arquivos externos

---

## Estrutura de secoes (ordem fixa — 15 secoes)

| # | Secao | Objetivo | Obrigatorio |
|---|-------|----------|-------------|
| 1 | Top bar de urgencia | Frete gratis + entrega expressa, fundo preto, dot verde pulsante | Sim |
| 2 | Carrossel de imagens | Ate 6 fotos do produto, setas + dots + swipe mobile | Sim |
| 3 | Header do produto | Brand, badge "X vendidos", nome, rating 4.9, "X pessoas vendo agora" | Sim |
| 4 | Bloco de preco | Preco atual (grande), preco antigo (vermelho riscado), badge -X%, parcelamento | Sim |
| 5 | Barra de estoque | Urgencia visual com barra que encolhe + glow vermelho a cada venda | Sim |
| 6 | CTA 1 + bandeiras | Primeiro ponto de conversao (above the fold) + Visa/Mastercard/PIX | Sim |
| 7 | Mini review | Prova social colada no CTA — 1 review com avatar e 5 estrelas | Sim |
| 8 | Trust pills | 4 pilares: Compra protegida, Satisfacao garantida, Frete gratis, Troca gratis | Sim |
| 9 | Descricao do produto | Texto persuasivo condensado (max 3 frases) | Sim |
| 10 | Features | Checklist visual com checks verdes (max 4 itens) | Sim |
| 11 | CTA 2 + bandeiras | Segundo ponto de conversao + Visa/Mastercard/PIX | Sim |
| 12 | Reviews | Carrossel horizontal — 3 reviews 5 estrelas + 1 review 4 estrelas (credibilidade) | Sim |
| 13 | FAQ | Colapsavel, 3 perguntas (todas minimizadas por padrao) | Sim |
| 14 | CTA final + Timer + bandeiras | Card branco sobre fundo cinza + countdown persistente + Visa/Mastercard/PIX | Sim |
| 15 | Footer | Selo de garantia (escudo verde + "7 dias de garantia") + link privacidade | Sim |
| — | Sticky bar | Preco + CTA flutuante (aparece no scroll, some no header e no final) — so mobile | Sim |
| — | Toast de prova social | "Maria de SP acabou de comprar — agora mesmo" — sincronizado com vendas | Sim |

---

## Design System

### Cores

| Elemento | Cor | Hex |
|----------|-----|-----|
| Fundo pagina | Branco | `#fff` |
| Fundo secao final | Cinza claro | `#f4f4f5` |
| Botao CTA | Verde conversivo | `#2CB67D` |
| Botao CTA hover | Verde escuro | `#239d6a` |
| Badge desconto | Verde fundo, texto branco | `#2CB67D` |
| Estoque/urgencia | Vermelho | `#ef4444` |
| Gradiente barra estoque | Vermelho → laranja | `#ef4444` → `#f97316` |
| Preco antigo riscado | Vermelho com opacidade | `#ef4444` opacity 0.7 |
| Titulo | Preto | `#111` |
| Corpo texto | Cinza medio | `#555` |
| Texto secundario | Cinza claro | `#999` |
| Brand tag | Marrom dourado | `#b08968` |
| Visualizando agora | Laranja | `#e67e22` |
| Top bar fundo | Preto | `#111` |
| Top bar dot | Verde | `#2CB67D` |
| Trust pills icones | Verde | `#2CB67D` |
| PIX logo | Teal oficial | `#4BB8A9` |

### Tipografia

| Elemento | Tamanho | Weight |
|----------|---------|--------|
| Fonte | Inter (Google Fonts) | — |
| Titulo produto | 20px | 700 |
| Preco atual | 30px | 800 |
| Preco antigo | 15px | 400 (line-through) |
| CTA botao | 16px | 800 |
| Corpo texto | 13px | 400 |
| Top bar | 11px | 600 |
| Badge vendidos | 10px | 600 |
| Trust pill label | 9px | 600 |
| Review texto | 12px | 400 |
| FAQ pergunta | 13px | 600 |
| FAQ resposta | 12px | 400 |
| Timer numeros | 24px | 800 |
| Timer label | 8px | 600 |

### Icones

- **Tipo:** SVG inline (Lucide-style, stroke)
- **Cor padrao:** `#2CB67D` (trust/positivo) ou `#ef4444` (urgencia)
- **Sem emojis** — todos icones sao SVG profissionais
- **Icones usados:** cadeado, check, escudo, raio, fogo, olho, caminhao, chave, seta esquerda/direita, pessoa

### Bandeiras de pagamento

| Bandeira | Formato | Tamanho | Origem dos paths |
|----------|---------|---------|------------------|
| Visa | SVG inline 42x28 | Card branco com borda `#e0e0e0`, border-radius 4px | Paths oficiais Visa |
| Mastercard | SVG inline 42x28 | Dois circulos (vermelho + amarelo + overlap laranja) | Paths oficiais Mastercard |
| PIX | SVG inline 42x28 | Logo oficial Banco Central (4 diamantes com ondulacoes) | Font Awesome #17414 / Brand Book BCB |

### Botao CTA

- **Texto:** "Comprar agora" (consistente em todos os CTAs)
- **Subtexto:** cadeado SVG + texto de seguranca (varia por CTA)
- **Sem logo do WhatsApp** no botao
- **Sem mencao ao WhatsApp** nos textos visiveis
- **Padding:** 18px
- **Border-radius:** 12px
- **Animacao:** Pulse verde sutil (`ctaPulse`, 2.5s infinite) — para no hover

---

## Elementos dinamicos (JavaScript)

### 1. Contador de vendidos
- Inicia com valor base do produto (ex: 243)
- Incrementa +1 a cada venda simulada
- **Persiste no localStorage** (`lp_sold_count`) — reseta apos 1 hora
- Atualiza badge "X vendidos"

### 2. Barra de estoque
- Barra visual que encolhe conforme vendas aumentam
- **Glow vermelho/laranja** (`stockGlow`) a cada venda — brightness 1.8x + box-shadow expandindo
- **Texto pulsa** (`textFlash`) junto com a barra
- Texto muda para "Quase esgotado — restam apenas X unidades" quando < 30
- Icone troca de raio (SVG) para fogo (SVG) quando < 30

### 3. Timer regressivo
- 10 minutos regressivo
- **Persiste no localStorage** (`lp_timer_end`) — recarregar NAO reseta
- Caixas com fundo cinza, numeros em preto
- Texto: "Preco promocional expira em breve"

### 4. Sticky bar
- Aparece ao rolar para baixo (apos header sair da tela)
- Desaparece ao chegar na secao final (CTA + timer)
- Usa IntersectionObserver para deteccao
- Contem: preco + cadeado "Compra protegida" + botao "Comprar agora"
- **So aparece no mobile** (< 481px)

### 5. Toast de prova social
- **Sincronizado com vendas** — cada incremento do contador dispara um toast
- Nomes e cidades aleatorios de uma lista de 8 brasileiros
- Texto: "**Maria** de Sao Paulo, SP acabou de comprar"
- Subtexto: "agora mesmo"
- Aparece no canto inferior esquerdo, desliza da esquerda
- Desaparece apos 4 segundos
- Nao aparece se ja tiver um ativo (limpa timeout anterior)

### 6. Visualizando agora
- Inicia em 23
- Oscila entre 15-35 a cada 5 segundos (+/- 2 aleatorio)
- Dot laranja pulsante + icone de olho SVG

### 7. Ritmo de vendas adaptativo
- Estoque > 50 unidades: venda a cada 8-18 segundos (ritmo acelerado)
- Estoque 20-50 unidades: venda a cada 15-30 segundos (desacelerando)
- Estoque < 20 unidades: venda a cada 25-50 segundos (quase esgotando)
- Cria narrativa: comeco movimentado → escassez → urgencia maxima

### 8. Carrossel de imagens
- Ate 6 slides
- Navegacao por **setas** (circulos brancos com sombra, chevron SVG)
- Navegacao por **dots** (clicaveis)
- Navegacao por **swipe** (touch no mobile)
- Transicao: cubic-bezier(0.16, 1, 0.3, 1) — 0.4s
- Loop infinito (ultimo → primeiro, primeiro → ultimo)

---

## Carrossel — Sugestao de fotos (6 slots)

| Slot | Tipo de foto | Objetivo |
|------|-------------|----------|
| 1 | Foto principal do produto | Primeira impressao — a mais bonita |
| 2 | Detalhe do acabamento | Mostrar qualidade/material |
| 3 | Produto em uso (mesa, ambiente) | Contexto de uso real |
| 4 | Embalagem de presente | Mostrar que vem pronto para presentear |
| 5 | Tamanho real (na mao) | Referencia de escala |
| 6 | Cliente real usando / foto estilo UGC | Prova social visual |

---

## Reviews

| # | Estrelas | Autor | Texto | Proposito |
|---|---------|-------|-------|-----------|
| 1 | 5 | Roberto M. | Comprou 5, pagou PIX, chegou em 2 dias | Volume + metodo pagamento + rapidez |
| 2 | 5 | Ana Paula S. | Linda, todo mundo elogia, uso pos-Pascoa | Reuso + validacao social |
| 3 | 5 | Marcos L. | Presente sogra, acabamento impecavel | Presente + perceived value |
| 4 | **4** | Juliana R. | Demorou 6 dias mas valeu a espera | **Credibilidade** — review honesto |

---

## FAQ (3 perguntas — todas minimizadas por padrao)

| # | Pergunta | Resposta | Objetivo |
|---|---------|---------|----------|
| 1 | O que esta incluso no pedido? | Produto + embalagem presente. Chocolates nao inclusos. | Esclarecer expectativa |
| 2 | Chega antes da Pascoa? | Despacho mesmo dia (pedidos ate sexta), 3-7 dias uteis | Resolver objecao de prazo |
| 3 | Posso trocar ou devolver? | Sim, sem burocracia + mencao a PIX e cartao 3x | Resolver objecao de risco + pagamento |

---

## Animacoes CSS

| Nome | Duracao | Uso |
|------|---------|-----|
| `blink` | 1.5s infinite | Dot verde (top bar), dot laranja (viewing now) |
| `ctaPulse` | 2.5s infinite | Botoes CTA — glow verde expandindo |
| `stockGlow` | 0.8s ease-out | Barra de estoque a cada venda — glow vermelho + brightness |
| `textFlash` | 0.8s ease-out | Texto de estoque a cada venda — vermelho vivo + leve zoom |

---

## Responsividade

| Breakpoint | Comportamento |
|-----------|--------------|
| < 480px (mobile) | Pagina full-width, sticky bar visivel, setas 28px |
| >= 481px (desktop) | Pagina centralizada 480px com bordas arredondadas, sombra, fundo cinza. Sticky bar oculta. Toast no canto inferior esquerdo |

---

## Performance

- **Preconnect** para Google Fonts (fonts.googleapis.com + fonts.gstatic.com)
- **Zero dependencias externas** (sem jQuery, sem bibliotecas)
- **SVGs inline** — sem requests HTTP para icones
- **localStorage** para persistencia (timer + vendidos) — sem backend necessario

---

## Dados dinamicos do produto (para implementacao)

Campos necessarios no model Product para gerar a landing page:

```
Product {
  name              -> titulo do produto
  brand             -> tag de marca/colecao (ex: "Especial de Pascoa")
  description       -> texto da descricao (max 3 frases)
  price             -> preco atual
  originalPrice     -> preco riscado (para calcular desconto)
  images[]          -> array de URLs das imagens (ate 6)
  features[]        -> lista de features/beneficios (ate 4)
  checkoutUrl       -> URL do checkout externo
  soldCount         -> numero base de vendidos
  reviews[]         -> array de reviews { stars, text, author, verified }
  faq[]             -> array de FAQ { question, answer }
}
```

---

## Fluxo de conversao

```
Anuncio (Meta Ads) → /c/:trackingCode → Landing page (BrazaChat) → Checkout (terceiro)
```

- O checkout NAO e construido pelo BrazaChat — e uma solucao terceira (Shopify, Yampi, Kiwify, etc.)
- O botao "Comprar agora" redireciona para `checkoutUrl` do produto
- O tracking (fbclid, utm, click_id) e capturado no pageload da landing page
- A URL de checkout pode receber parametros de tracking via query string

---

## Gatilhos de conversao implementados

| Categoria | Elementos | Quantidade |
|-----------|-----------|------------|
| **Urgencia** | Top bar, timer regressivo, barra de estoque com glow | 3 |
| **Prova social** | Reviews (4), toast de compra, contador de vendidos, "visualizando agora", mini review | 5 |
| **Confianca** | Trust pills (4), bandeiras de pagamento (3x em 3 CTAs), selo de garantia no footer, cadeado em cada CTA | 4 |
| **Escassez** | Barra diminuindo, vendas desacelerando, texto "quase esgotado" | 3 |
| **Acao** | 3 CTAs distribuidos + sticky bar, todos com pulse verde | 4 |
| **Total** | — | **19 elementos de conversao** |

---

## O que NAO incluir (decisao de design)

| Elemento | Motivo da exclusao |
|----------|-------------------|
| Pop-up de saida | Irrita no mobile, Google penaliza |
| Mais de 3 CTAs | Ja temos 3 + sticky — mais que isso e poluicao |
| Animacoes pesadas | Landing page precisa carregar em <2s no 4G |
| Chat/WhatsApp widget | A spec diz "sem mencao a WhatsApp" — foco e checkout |
| Auto-play no carrossel | Compete pela atencao no momento critico (3-5s de decisao) |
| Emojis | Spec define icones SVG profissionais exclusivamente |
| Cookie banner LGPD | Cobre o sticky bar e adiciona friccao na conversao |

---

## Compliance — Disclaimers (Meta Ads + Google Ads)

### Links legais no footer

| Link | Rota | Obrigatorio para |
|------|------|-------------------|
| Politica de Privacidade | `/privacy` | Meta + Google + LGPD |
| Termos de Uso | `/terms` | Meta + Google |
| Trocas e Devolucoes | `/refund` | Google Ads |
| Contato | `/contact` | Meta + Google |

### Disclaimers obrigatorios (texto no footer)

1. **Depoimentos:** "Os depoimentos representam experiencias individuais. Resultados podem variar."
2. **Imagens:** "Imagens meramente ilustrativas. Produto pode apresentar pequenas variacoes."
3. **Estoque/preco:** "Estoque sujeito a disponibilidade. Precos validos enquanto durarem os estoques."
4. **Plataformas:** "Este site nao e afiliado, endossado ou patrocinado pelo Facebook, Instagram, Google ou qualquer outra plataforma."

### Identificacao

- Copyright: © 2026 Braza Publishing Marketing LTDA
- Razao social fixa no template

---

## Auditoria de Performance (Dex — 19/03/2026)

### Otimizacoes aplicadas

| # | Otimizacao | Tecnica | Impacto |
|---|-----------|---------|---------|
| 1 | Google Fonts async | `media="print" onload="this.media='all'"` + `<noscript>` fallback | Elimina render-blocking |
| 2 | Font weight reduzido | 5 → 4 weights (removido 500 nao usado) | -20% download da fonte |
| 3 | `font-display: swap` | Via `&display=swap` no URL | Texto visivel instantaneamente (sem FOIT) |
| 4 | Hero image priority | `fetchpriority="high"` na primeira imagem | Browser prioriza LCP |
| 5 | GPU acceleration | `will-change: transform, opacity` em carousel, sticky, toast | Animacoes a 60fps |
| 6 | CSS morto removido | Cookie banner CSS (~35 linhas) | -800 bytes |
| 7 | Meta OG tags | og:title, og:description, og:type | Sharing otimizado (Facebook/WhatsApp) |
| 8 | Meta description | SEO basico | Melhor indexacao |

### Metricas finais

| Metrica | Valor |
|---------|-------|
| Tamanho total HTML | ~46KB (HTML + CSS + JS inline) |
| Requests HTTP | 2 (HTML + Google Fonts) + imagens do produto |
| Blocking resources | 0 |
| JavaScript inline | ~3KB |
| Dependencias externas | 0 (apenas Google Fonts async) |
| First paint | Instantaneo (fallback system-ui) |
| Animacoes | GPU-accelerated via will-change |

---

*Spec final v3.0 — Atualizada em 19/03/2026*
*Aprovada por: Uma (UX) + Morgan (PM) | Auditoria: Dex (Dev)*
*19 elementos de conversao | 15 secoes | 8 comportamentos dinamicos | 4 disclaimers | 8 otimizacoes de performance*
