# BrazaChat — Design System & Visual Specification

> Baseado no padrão visual do **Braza Tracker** para manter consistência entre todas as ferramentas do grupo Braza.

---

## 1. Logo & Branding

### Logo
- **Logo principal:** Monograma "B" estilizado (mesmo do Braza Tracker)
- **Arquivos:** Copiar de `tracker.braza/dashboard/public/icons/logo.png` (fundo escuro) e `tracker.braza/landing/logo-transparent.png` (fundo transparente)
- **Uso na sidebar:** 32x32px com `rounded-lg` + dot verde de status (`bg-emerald-500`)
- **Texto ao lado:** "Braza Chat" em `text-[13px] font-bold tracking-tight` + subtítulo "by Braza Marketing" em `text-[10px] text-zinc-500`

### Identidade Visual
- **Família de produtos:** Braza Tracker, BrazaChat, Logo Braza (mesmo DNA visual)
- **Personalidade:** Premium, dark-first, minimalista, profissional
- **Referência principal:** Dark mode do Braza Tracker como padrão

---

## 2. Color Tokens

### Dark Mode (PADRÃO — dark-first como Braza Tracker)

```css
:root {
  /* Backgrounds */
  --background: #09090b;          /* Main background */
  --card: #111113;                /* Card/panel background */
  --sidebar: #0c0c0e;            /* Sidebar background */
  --popover: #111113;            /* Popover/dropdown */

  /* Foregrounds */
  --foreground: #fafafa;          /* Primary text */
  --muted-foreground: #71717a;    /* Secondary/muted text */
  --sidebar-foreground: #fafafa;

  /* Semantic Colors */
  --primary: #fafafa;             /* Primary action */
  --primary-foreground: #09090b;
  --secondary: #1a1a1f;           /* Secondary surfaces */
  --secondary-foreground: #fafafa;
  --muted: #1a1a1f;
  --accent: #1a1a1f;
  --destructive: #ef4444;         /* Error/danger */

  /* Borders */
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.08);
  --ring: #52525b;
  --sidebar-border: rgba(255, 255, 255, 0.06);

  /* Charts (paleta indigo — herança Braza Tracker) */
  --chart-1: #818cf8;
  --chart-2: #6366f1;
  --chart-3: #4f46e5;
  --chart-4: #4338ca;
  --chart-5: #3730a3;
}
```

### Light Mode

```css
:root {
  --background: oklch(0.98 0 0);    /* #f7f7f8 approx */
  --foreground: oklch(0.145 0 0);   /* Near black */
  --card: oklch(1 0 0);             /* Pure white */
  --primary: oklch(0.205 0 0);      /* Dark primary */
  --secondary: oklch(0.97 0 0);     /* Light gray */
  --muted-foreground: oklch(0.556 0 0); /* Gray text */
  --border: oklch(0.922 0 0);
  --radius: 0.625rem;
}
```

### Semantic Color Classes (Braza Pattern)

| Propósito | Classe | Cor |
|-----------|--------|-----|
| Sucesso / Conversão / Purchase | `emerald-500` | #10b981 |
| Alerta / AddToCart / Estimado | `amber-500` / `amber-400` | #f59e0b |
| Erro / Perigo / Failed | `red-500` / `red-400` | #ef4444 |
| Info / Cliques / Checkout | `sky-500` / `sky-400` | #0ea5e9 |
| Neutro / CPA / Secondary | `violet-500` / `violet-400` | #8b5cf6 |
| Live / Online status | `emerald-500` | #10b981 |
| Offline status | `zinc-500` | #71717a |

### Padrão de Icon Badge (Braza Pattern)

```tsx
// Ícone com fundo colorido sutil — padrão de todos os KPI cards
<div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
  <Icon className="h-3.5 w-3.5" />
</div>
```

---

## 3. Typography

### Font Stack

```tsx
// Fonte principal: Inter (sans-serif)
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Fonte mono: JetBrains Mono (código, dados técnicos)
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

### Scale (padrão Braza Tracker)

| Uso | Size | Weight | Classe |
|-----|------|--------|--------|
| Título da página | 20px | Bold | `text-xl font-bold tracking-tight` |
| Título de seção | 15px | Semibold | `text-[15px] font-semibold` |
| Label de card | 12px | Medium | `text-[12px] font-medium text-zinc-500` |
| Valor principal (KPI) | 24px | Bold | `text-2xl font-bold tracking-tight` |
| Valor secundário | 15px | Bold | `text-[15px] font-bold` |
| Descrição/subtítulo | 11px | Regular | `text-[11px] text-zinc-600` |
| Label de seção | 10px | Semibold | `text-[10px] font-semibold uppercase tracking-wider` |
| Badges/tags | 10px | Semibold | `text-[10px] font-semibold` |
| Texto do body | 13px | Medium | `text-[13px] font-medium` |
| Versão/footnote | 10px | Regular | `text-[10px] text-zinc-700` |

---

## 4. Layout & Spacing

### App Shell (padrão Braza Tracker)

```
┌──────────────────────────────────────────────┐
│ Sidebar (220px)  │  Header (h-16)            │
│ ┌──────────────┐ ├──────────────────────────┤
│ │ Logo + dot   │ │  Page Title              │
│ │              │ │  Description             │
│ ├──────────────┤ ├──────────────────────────┤
│ │ Menu label   │ │                          │
│ │ Nav item     │ │  Content (p-6)           │
│ │ Nav item *   │ │  max-w-5xl mx-auto       │
│ │ Nav item     │ │                          │
│ │              │ │                          │
│ ├──────────────┤ │                          │
│ │ Theme toggle │ │                          │
│ │ Version      │ │                          │
│ └──────────────┘ └──────────────────────────┘
```

### Padrões de Layout

| Elemento | Valor | Classe |
|----------|-------|--------|
| Sidebar width | 220px | `w-[220px]` |
| Header height | 64px | `h-16` |
| Content padding | 24px | `p-6` |
| Content max-width | 64rem | `max-w-5xl mx-auto` |
| Gap entre cards KPI | 16px | `gap-4` |
| Gap entre cards secundários | 12px | `gap-3` |
| Border radius | 0.625rem / 12px | `rounded-xl` |
| Card padding | 20px | `p-5` |
| Card padding compacto | 16px/12px | `px-4 py-3` |

---

## 5. Component Patterns

### KPI Card — Primary (padrão Braza)

```tsx
<div className="card-glow bg-white dark:bg-[#111113] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5 relative overflow-hidden">
  {/* Gradient decorativo */}
  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-bl-full" />
  {/* Icon badge + label */}
  <div className="flex items-center gap-2 mb-3">
    <div className="p-1.5 rounded-lg bg-{color}-500/10 text-{color}-400">
      <Icon className="h-3.5 w-3.5" />
    </div>
    <span className="text-[12px] font-medium text-zinc-500">Label</span>
  </div>
  {/* Valor */}
  <p className="text-2xl font-bold text-gray-900 dark:text-white stat-number tracking-tight">
    Value
  </p>
</div>
```

### KPI Card — Secondary (padrão Braza)

```tsx
<div className="card-glow bg-white dark:bg-[#111113] rounded-xl border border-gray-200 dark:border-white/[0.06] px-4 py-3 flex items-center gap-3">
  <div className="p-1.5 rounded-lg bg-{color}-500/10 text-{color}-400">
    <Icon className="h-3.5 w-3.5" />
  </div>
  <div>
    <span className="text-[11px] font-medium text-zinc-500">Label</span>
    <p className="text-[15px] font-bold text-gray-900 dark:text-white">Value</p>
  </div>
</div>
```

### Sidebar Nav Item (padrão Braza)

```tsx
// Active
"flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white shadow-sm dark:shadow-none"
// + dot indicador: <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />

// Inactive
"flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-500 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-zinc-300"
```

### Date Preset Buttons (padrão Braza)

```tsx
// Container
"flex gap-0.5 bg-gray-100 dark:bg-white/[0.04] rounded-lg p-1 border border-transparent dark:border-white/[0.06]"

// Active button
"px-3 py-1.5 text-[11px] font-semibold rounded-md bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm"

// Inactive button
"px-3 py-1.5 text-[11px] font-semibold rounded-md text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-zinc-300"
```

### Skeleton Loading (padrão Braza)

```tsx
<div className="bg-white dark:bg-[#111113] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5 animate-pulse">
  <div className="h-4 bg-gray-200 dark:bg-white/[0.06] rounded w-24 mb-4" />
  <div className="h-8 bg-gray-200 dark:bg-white/[0.06] rounded w-32 mb-2" />
  <div className="h-3 bg-gray-200 dark:bg-white/[0.06] rounded w-16" />
</div>
```

### Live Status Badge (padrão Braza)

```tsx
// Online
<span className="live-pulse flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
  <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Live</span>
</span>

// Offline
<span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-500/10 border border-zinc-500/20 rounded-full">
  <WifiOff className="h-3 w-3 text-zinc-500" />
  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Offline</span>
</span>
```

### Semaphore Pattern (para ROAS, Conversion Rate, etc.)

```tsx
// Verde (bom): border-emerald-500/30, bg from-emerald-500/[0.03], text-emerald-400
// Amarelo (atenção): border-amber-500/30, bg from-amber-500/[0.03], text-amber-400
// Vermelho (ruim): border-red-500/30, bg from-red-500/[0.03], text-red-400
```

---

## 6. Animations & Micro-interactions

### CSS Animations (copiar do Braza Tracker)

```css
/* Premium scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

/* Card hover glow */
.card-glow { transition: box-shadow 0.3s ease, border-color 0.3s ease; }
.card-glow:hover {
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Shimmer border effect */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Pulse glow for live indicators */
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.2); }
}
.live-pulse { animation: pulse-glow 2s ease-in-out infinite; }

/* Number count-up animation */
@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.stat-number { animation: countUp 0.4s ease-out; }
```

---

## 7. Icon Library

- **Biblioteca:** Lucide React (mesma do Braza Tracker)
- **Tamanho padrão nav:** `h-[18px] w-[18px]`
- **Tamanho padrão KPI icon:** `h-3.5 w-3.5`
- **Tamanho padrão badge:** `h-3 w-3`

### Mapeamento de Ícones BrazaChat

| Módulo | Ícone Lucide |
|--------|-------------|
| Dashboard | `LayoutDashboard` |
| Campaigns | `Megaphone` |
| Inbox | `MessageSquare` |
| Leads | `Users` |
| Orders | `Package` |
| Products | `ShoppingBag` |
| Ad Accounts | `CreditCard` |
| Pixels | `Activity` |
| Events | `Zap` |
| AI Insights | `Brain` |
| Settings | `Settings` |

---

## 8. Padrão de Conversão Events (específico BrazaChat)

| Evento | Cor | Ícone |
|--------|-----|-------|
| ViewContent | `zinc-400` / `zinc-500/10` | `Eye` |
| AddToCart | `amber-400` / `amber-500/10` | `ShoppingCart` |
| InitiateCheckout | `orange-400` / `orange-500/10` | `CreditCard` |
| Purchase | `emerald-400` / `emerald-500/10` | `CheckCircle` |

### Botões de Evento na Inbox

```tsx
// AddToCart
"px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-[12px] font-semibold"

// InitiateCheckout
"px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 text-[12px] font-semibold"

// Purchase
"px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[12px] font-semibold"
```

### Order Status Badge

| Status | Cor | Classe |
|--------|-----|--------|
| Awaiting Address | `red` | `bg-red-500/10 text-red-400 border-red-500/20` |
| Address Complete | `amber` | `bg-amber-500/10 text-amber-400 border-amber-500/20` |
| Label Generated | `sky` | `bg-sky-500/10 text-sky-400 border-sky-500/20` |
| Shipped | `orange` | `bg-orange-500/10 text-orange-400 border-orange-500/20` |
| Delivered | `emerald` | `bg-emerald-500/10 text-emerald-400 border-emerald-500/20` |

---

## 9. Tecnologias Frontend (consistente com Braza Tracker)

| Tech | Versão | Uso |
|------|--------|-----|
| Next.js | 15.x | App Router, SSR |
| React | 19.x | UI Library |
| TailwindCSS | 4.x | Utility-first CSS |
| shadcn/ui | latest | Componentes base |
| Lucide React | latest | Iconografia |
| Inter | Google Fonts | Tipografia principal |
| JetBrains Mono | Google Fonts | Tipografia mono |
| tw-animate-css | latest | Animações |
| @tanstack/react-query | latest | Data fetching |

---

## 10. Viewport & Theme

```tsx
export const viewport: Viewport = {
  themeColor: "#09090b",  // Dark theme color (Braza standard)
};
```

- **Default theme:** Dark (mesmo do Braza Tracker)
- **Theme toggle:** Na sidebar, footer (padrão Braza)
- **Dark mode variant:** `@custom-variant dark (&:is(.dark *))`
- **Body classes:** `antialiased bg-gray-50 dark:bg-[#09090b] font-sans`

---

*Extracted from Braza Tracker by Uma (UX Design Expert)*
*BrazaChat Design System v1.0.0 — 2026-03-15*
