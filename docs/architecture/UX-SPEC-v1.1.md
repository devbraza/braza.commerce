# UX Spec — braza.commerce v1.1

> **Autora:** Uma (UX) | **Data:** 20/03/2026
> **Referencia visual:** tracker.braza (mesmo layout, mesmos componentes, mesmas cores)
> **Principio:** Replicar identicamente o design system do tracker.braza

---

## Design System (copiado do tracker.braza)

### Cores

| Token | Dark mode | Uso |
|-------|-----------|-----|
| Background | `#09090b` | Fundo principal |
| Sidebar | `#0c0c0e` | Navegacao lateral |
| Card | `#111113` | Cards de conteudo |
| Border | `rgba(255,255,255,0.06)` | Bordas, divisores |
| Border hover | `rgba(255,255,255,0.12)` | Hover em cards |
| Texto primario | `#fafafa` | Titulos, valores |
| Texto secundario | `#71717a` / `zinc-500` | Labels, descricoes |
| Texto terciario | `zinc-600` | Subtitulos, versao |
| Emerald (sucesso) | `#22c55e` | Status ativo, vendas, ROI positivo |
| Amber (alerta) | `#f59e0b` | Avisos, estimativas |
| Red (erro) | `#ef4444` | Erros, ROI negativo |
| Sky (info) | `#0ea5e9` | Informacoes |
| Violet (especial) | `#a855f7` | Teste, badges especiais |

### Tipografia

| Elemento | Tamanho | Weight | Classe |
|----------|---------|--------|--------|
| Badge pequeno | `text-[9px]` | bold | Labels minusculos |
| Labels uppercase | `text-[10px]` | semibold | Cabecalhos de secao, status |
| Texto secundario | `text-[11px]` | medium/semibold | Subtextos, botoes |
| Texto corpo | `text-[12px]` | medium | Body text, inputs |
| Navegacao sidebar | `text-[13px]` | medium/semibold | Items do menu |
| Valores dados | `text-[15px]` | semibold | Titulos header, valores |
| Titulo pagina | `text-xl` | bold | H1 de cada pagina |
| KPI grande | `text-2xl` | bold | Numeros de metricas |

### Fontes
- Sans: **Inter** (Google Fonts)
- Mono: **JetBrains Mono** (IDs, codigos)

---

## Layout (identico ao tracker.braza)

```
┌─────────────────────────────────────────────────────┐
│ html (dark class)                                   │
│ body (bg-[#09090b])                                 │
│ ┌──────────┬───────────────────────────────────────┐│
│ │          │ Header (h-16, border-b)               ││
│ │ Sidebar  ├───────────────────────────────────────┤│
│ │ w-[220px]│                                       ││
│ │ bg-      │ main (flex-1, overflow-y-auto, p-6)   ││
│ │ [#0c0c0e]│                                       ││
│ │          │   max-w-5xl mx-auto                   ││
│ │ hidden   │   {children}                          ││
│ │ md:flex  │                                       ││
│ │          │                                       ││
│ └──────────┴───────────────────────────────────────┘│
│ MobileNav (md:hidden) — em cima no mobile          │
└─────────────────────────────────────────────────────┘
```

### Sidebar (w-[220px])

**Logo section** (h-16, border-b):
- Logo: `w-32 h-32 rounded-lg`
- Dot status: `w-2.5 h-2.5 bg-emerald-500 rounded-full`
- Titulo: `text-[13px] font-bold text-white tracking-tight`
- Subtitulo: `text-[10px] text-zinc-500 font-medium`

**Navegacao:**
- Label secao: `text-[10px] font-semibold text-zinc-600 uppercase tracking-wider`
- Item inativo: `text-[13px] font-medium text-zinc-500 hover:bg-white/[0.04] px-3 py-2.5 rounded-lg`
- Item ativo: `bg-white/[0.08] text-white` + dot `w-1.5 h-1.5 rounded-full bg-emerald-500`

**Menu do braza.commerce:**

| Secao | Item | Rota | Icone (Lucide) |
|-------|------|------|----------------|
| PRINCIPAL | Paginas | `/pages` | LayoutGrid |
| PRINCIPAL | Campanhas | `/campaigns` | Crosshair |
| ANALYTICS | Metricas | `/metrics` | BarChart3 |
| ANALYTICS | Eventos | `/events` | Activity |
| SISTEMA | Configuracoes | `/settings` | Settings |

### Header (h-16, border-b)

- Titulo: `text-[15px] font-semibold text-white`
- Descricao: `text-[11px] text-zinc-600`
- Lado direito: filtros de periodo, botoes de acao

### Mobile Nav (md:hidden)

- Barra top h-14
- Botao hamburguer toggle
- Menu dropdown full-screen

---

## Componentes (identicos ao tracker.braza)

### KPI Cards (primarios)

```
card-glow bg-[#111113] rounded-xl border border-white/[0.06] p-5 relative overflow-hidden
```

- Icon badge: `p-1.5 rounded-lg bg-{color}-500/10 text-{color}-400`
- Label: `text-[12px] font-medium text-zinc-500`
- Valor: `text-2xl font-bold text-white stat-number tracking-tight`
- Subtexto: `text-[11px] text-emerald-500 font-medium`
- Gradient overlay: `absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.02] to-transparent`
- Grid: `grid grid-cols-1 md:grid-cols-4 gap-4`

### KPI Cards (secundarios)

```
card-glow bg-[#111113] rounded-xl border border-white/[0.06] px-4 py-3 flex items-center gap-3
```
- Grid: `grid grid-cols-1 md:grid-cols-3 gap-3`

### Status Badges

**Live (ativo):**
```
live-pulse flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full
```
- Dot: `w-1.5 h-1.5 bg-emerald-500 rounded-full`
- Texto: `text-[10px] font-semibold text-emerald-500 uppercase tracking-wider`

**Offline:** `bg-zinc-500/10 border-zinc-500/20 text-zinc-500`

**Semaforo ROAS:**
- Verde (>= 1.5x): `border-2 border-emerald-500/30` + `bg-emerald-500/10`
- Amarelo (1.0-1.5x): `border-2 border-amber-500/30` + `bg-amber-500/10`
- Vermelho (< 1.0x): `border-2 border-red-500/30` + `bg-red-500/10`

### Botoes

**Primario:**
```
px-3 py-1.5 text-[12px] font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08] rounded-lg
```

**Filtro periodo:**
- Container: `flex gap-0.5 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]`
- Inativo: `px-3 py-1.5 text-[11px] font-semibold rounded-md text-zinc-500 hover:text-zinc-300`
- Ativo: `bg-white/[0.1] text-white shadow-sm`

### Tabelas

**Container:** `card-glow bg-[#111113] rounded-xl border border-white/[0.06] overflow-hidden`

**Header:** `text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-4 py-3`

**Row:** `border-b border-white/[0.03] hover:bg-white/[0.02] px-4 py-3.5`

**Texto celula:**
- Primario: `text-zinc-300`
- Secundario: `text-zinc-500`
- Mono: `font-mono text-[11px] text-zinc-400`

### Inputs

```
px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-300
```

### Select/Dropdown

```
px-3 py-1.5 text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] rounded-lg text-zinc-300 cursor-pointer
```

---

## Animacoes (identicas ao tracker.braza)

```css
/* Card hover glow */
.card-glow { transition: box-shadow 0.3s ease, border-color 0.3s ease; }
.card-glow:hover {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Shimmer border */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Live pulse (indicador tempo real) */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.2); }
}

/* Stat number (fade in) */
@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Telas do braza.commerce v1.1

### Paginas (/pages) — ajustar para layout com sidebar

- Mesmo conteudo atual, dentro do novo layout com sidebar
- Cards de pagina com `card-glow`

### Campanhas (/campaigns)

- Lista de campanhas com cards full-width
- Badge ATIVA (emerald) / PAUSADA (zinc)
- Mini metricas: cliques, compras, ROI
- Botao `+ Nova campanha`

### Criar campanha (/campaigns/new)

- Form com inputs estilo tracker.braza
- Dropdown de pagina vinculada
- Campo checkout URL
- Secao Meta Pixel (opcional) com divisor

### Metricas (/metrics)

- 4 KPI cards primarios (grid 4 colunas)
- 3 KPI cards secundarios (grid 3 colunas)
- Funil de conversao (barras horizontais com semaforo)
- Tabela de ultimas conversoes (estilo eventos do tracker.braza)
- Filtro de periodo (pills: Hoje | 7d | 30d | Custom)

### Configuracoes (/settings)

- Secao Yampi: webhook URL + secret key + status conexao
- Secao Meta Pixel: pixel ID + access token
- Status com `live-pulse` dot

### Publicar com slug

- Modal/step no fluxo de criacao
- Input com prefixo fixo + campo editavel
- Validacao tempo real (emerald = disponivel, red = ja existe)

---

## Mapa de rotas

```
/
├── /pages                    ← Listagem de paginas
│   ├── /pages/new            ← Criar nova pagina
│   └── /pages/:id/edit       ← Editar pagina
├── /campaigns                ← Listagem de campanhas
│   ├── /campaigns/new        ← Criar campanha
│   └── /campaigns/:id        ← Metricas da campanha
├── /metrics                  ← Dashboard geral
├── /events                   ← Log de eventos
├── /settings                 ← Configuracoes
└── /privacy                  ← Politica de privacidade
```

---

*UX Spec v1.1 — Uma (UX) — 20/03/2026*
*Layout identico ao tracker.braza — mesmos componentes, cores, tipografia, animacoes*
