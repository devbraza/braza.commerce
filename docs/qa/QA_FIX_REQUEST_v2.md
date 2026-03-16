# QA Fix Request v2 — BrazaChat v0.1.0

**Reviewer:** Quinn (QA)
**Date:** 2026-03-15
**Gate Decision:** PASS com CONCERNS — itens abaixo são ACs do PRD não implementados
**Target:** @dev (Dex)

---

## Instruções para o Dev

Todos os itens abaixo são Acceptance Criteria do PRD que não foram implementados. Corrija na ordem das waves. Leia o PRD (`docs/prd.md`) e o Design System (`docs/braza-design-system.md`) antes de começar cada item.

Após corrigir, rode `npm run typecheck && npm run lint && npm run test && npm run build`.

---

## Wave 1 — DASHBOARD (Story 6.1 — 8 ACs faltando)

### FIX-V2-001: Filtros de período no Dashboard
**Severidade:** HIGH
**Arquivo backend:** `packages/api/src/dashboard/dashboard.service.ts`
**Arquivo frontend:** `packages/web/src/app/dashboard/page.tsx`
**ACs:** 6.1-AC1, 6.1-AC9
**O que fazer:**
- Backend: aceitar query param `?period=today|7d|30d` no `GET /dashboard/metrics` e filtrar por `createdAt >= dateFrom`
- Frontend: adicionar date preset buttons usando padrão Braza DS:
  - Container: `flex gap-0.5 bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]`
  - Active: `px-3 py-1.5 text-[11px] font-semibold rounded-md bg-white/[0.1] text-white`
  - Inactive: `px-3 py-1.5 text-[11px] font-semibold rounded-md text-zinc-500 hover:text-zinc-300`
- Persistir filtro na URL via query params (`?period=7d`)

---

### FIX-V2-002: Variação percentual nos KPIs
**Severidade:** MEDIUM
**Arquivo backend:** `packages/api/src/dashboard/dashboard.service.ts`
**Arquivo frontend:** `packages/web/src/app/dashboard/page.tsx`
**AC:** 6.1-AC3
**O que fazer:**
- Backend: calcular métricas do período anterior (ex: se period=7d, comparar com 7d anteriores) e retornar `changePercent` por métrica
- Frontend: exibir variação abaixo do valor principal — verde se positivo (`text-emerald-400 ▲ +12%`), vermelho se negativo (`text-red-400 ▼ -5%`)

---

### FIX-V2-003: Tabelas Top 5 no Dashboard
**Severidade:** HIGH
**Arquivo backend:** `packages/api/src/dashboard/dashboard.service.ts`
**Arquivo frontend:** `packages/web/src/app/dashboard/page.tsx`
**ACs:** 6.1-AC6, 6.1-AC7, 6.1-AC8
**O que fazer:**
- Backend: adicionar ao `GET /dashboard/metrics` (ou criar endpoint separado `GET /dashboard/top`):
  - Top 5 campanhas por conversões (leads)
  - Top 5 produtos por receita (orders sum)
  - Top 5 criativos por taxa de conversão (via utm_content dos clicks)
- Frontend: 3 tabelas com padrão Braza (bg-[#111113], border-white/[0.06])
  - "Top Campanhas" — nome, cliques, leads, conversão %
  - "Top Produtos" — nome, pedidos, receita total
  - "Top Criativos" — utm_content, cliques, leads, conversão %

---

### FIX-V2-004: Loading skeletons no Dashboard
**Severidade:** LOW
**Arquivo:** `packages/web/src/app/dashboard/page.tsx`
**AC:** 6.1-AC10
**O que fazer:** Substituir `<p>Carregando...</p>` por skeleton do DS:
```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
  {Array.from({ length: 8 }).map((_, i) => (
    <div key={i} className="bg-[#111113] rounded-xl border border-white/[0.06] p-5 animate-pulse">
      <div className="h-3 bg-white/[0.06] rounded w-20 mb-4" />
      <div className="h-7 bg-white/[0.06] rounded w-28" />
    </div>
  ))}
</div>
```

---

### FIX-V2-005: Estado vazio no Dashboard
**Severidade:** LOW
**Arquivo:** `packages/web/src/app/dashboard/page.tsx`
**AC:** 6.1-AC11
**O que fazer:** Se todas as métricas forem 0, mostrar call-to-action:
```
"Nenhum dado ainda. Crie seu primeiro produto e campanha para começar a rastrear conversões."
[Botão: Criar Produto] [Botão: Criar Campanha]
```

---

## Wave 2 — LEADS (Story 6.2 — 9 ACs faltando)

### FIX-V2-006: Campos enriquecidos na tabela de Leads
**Severidade:** HIGH
**Arquivo backend:** `packages/api/src/leads/leads.service.ts`
**Arquivo frontend:** `packages/web/src/app/leads/page.tsx`
**ACs:** 6.2-AC1, 6.2-AC2
**O que fazer:**
- Backend: incluir no `findAll` os campos: último evento (type do mais recente), última mensagem (createdAt), utmSource, utmCampaign, utmContent (via click → campaign)
- Frontend: adicionar colunas: Fonte (utm_source), Criativo (utm_content), Último Evento (badge com cores do funil), Última Mensagem (timestamp relativo)
- Cores do funil: ViewContent=zinc, AddToCart=amber, InitiateCheckout=orange, Purchase=emerald

---

### FIX-V2-007: Filtros avançados em Leads
**Severidade:** HIGH
**Arquivo backend:** `packages/api/src/leads/leads.controller.ts` e `leads.service.ts`
**Arquivo frontend:** `packages/web/src/app/leads/page.tsx`
**ACs:** 6.2-AC3, 6.2-AC9
**O que fazer:**
- Backend: aceitar query params `?productId=&campaignId=&status=&utmSource=`
- Frontend: barra de filtros no topo com:
  - Select: Produto, Campanha, Status, Fonte (utm_source)
  - Input de busca: nome, telefone ou click_id
  - Usar padrão de inputs dark do DS

---

### FIX-V2-008: Badge de último evento com cores do funil
**Severidade:** MEDIUM
**Arquivo:** `packages/web/src/app/leads/page.tsx`
**AC:** 6.2-AC4
**O que fazer:** Mostrar badge do último evento do lead usando cores do DS:
- ViewContent: `bg-zinc-500/10 text-zinc-400 border-zinc-500/20`
- AddToCart: `bg-amber-500/10 text-amber-400 border-amber-500/20`
- InitiateCheckout: `bg-orange-500/10 text-orange-400 border-orange-500/20`
- Purchase: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20`

---

### FIX-V2-009: Contadores de funil no topo da página Leads
**Severidade:** MEDIUM
**Arquivo:** `packages/web/src/app/leads/page.tsx`
**AC:** 6.2-AC6
**O que fazer:** Contadores acima da tabela mostrando total por status de funil:
- Total | New | Contacted | Converted | Lost
- Usar KPI card secondary do DS: `bg-[#111113] rounded-xl border border-white/[0.06] px-4 py-3 flex items-center gap-3`

---

### FIX-V2-010: Exportar leads como CSV
**Severidade:** MEDIUM
**Arquivo frontend:** `packages/web/src/app/leads/page.tsx`
**AC:** 6.2-AC7
**O que fazer:** Botão "Exportar CSV" que:
- Gera CSV client-side a partir dos dados já carregados
- Inclui colunas: nome, telefone, status, campanha, produto, utm_source, utm_medium, utm_campaign, utm_content, utm_term, data
- Trigger download via `Blob` + `URL.createObjectURL`

---

### FIX-V2-011: Ordenação nas colunas de Leads
**Severidade:** LOW
**Arquivo:** `packages/web/src/app/leads/page.tsx`
**AC:** 6.2-AC8
**O que fazer:** Headers de tabela clicáveis que ordenam por: data de criação, última mensagem, último evento. Indicador visual de direção (▲/▼).

---

## Wave 3 — CAMPAIGNS, SETTINGS, INBOX

### FIX-V2-012: Preview da mensagem WhatsApp no link panel
**Severidade:** MEDIUM
**Arquivo:** `packages/web/src/app/campaigns/page.tsx`
**AC:** 2.2-AC8 (item faltante)
**O que fazer:** No TrackingLinkPanel, após a tabela de UTMs, adicionar seção "Preview WhatsApp":
- Buscar messageTemplate do produto selecionado
- Substituir `{product}` pelo nome do produto
- Exibir em um card estilo bolha WhatsApp (bg-[#DCF8C6] ou bg-emerald-600 text-white rounded-xl p-3)

---

### FIX-V2-013: Detalhe da campanha ao clicar na lista
**Severidade:** MEDIUM
**Arquivo:** `packages/web/src/app/campaigns/page.tsx`
**ACs:** 2.2-AC11, 2.2-AC12
**O que fazer:**
- Ao clicar numa linha da tabela, abrir drawer/panel com:
  - Link completo + link curto + UTMs
  - Métricas: cliques, leads, conversão %
  - UTM fields inline-editable (inputs que ao editar chamam PATCH /campaigns/:id)

---

### FIX-V2-014: Settings — persistência via API
**Severidade:** HIGH
**Arquivo backend:** criar `packages/api/src/users/` module ou adicionar em auth
**Arquivo frontend:** `packages/web/src/app/settings/page.tsx`
**ACs:** 6.3-AC6, 6.3-AC7, 6.3-AC8
**O que fazer:**
- Backend: criar endpoint `PATCH /users/settings` que aceita: name, timezone, shippingData (JSON), trackingDomain, autoUtm
- Atualizar modelo User no Prisma se necessário (campo `settings Json?`)
- Frontend: adicionar botão "Salvar" em cada aba que chama o endpoint
- Feedback visual: toast "Salvo com sucesso" ou erro

---

### FIX-V2-015: Settings — Desconectar Facebook
**Severidade:** MEDIUM
**Arquivo:** `packages/web/src/app/settings/page.tsx`
**AC:** 6.3-AC9
**O que fazer:**
- Botão "Desconectar Facebook" na aba Integrations
- Ao clicar: `confirm("Tem certeza? Dados históricos serão mantidos.")`
- Se confirmado: chamar endpoint que limpa accessToken/refreshToken do user
- Atualizar UI para mostrar "Desconectado" em vez de "Conectado"

---

### FIX-V2-016: Settings — campos faltantes na aba Tracking
**Severidade:** LOW
**Arquivo:** `packages/web/src/app/settings/page.tsx`
**AC:** 6.3-AC4
**O que fazer:** Adicionar na aba Tracking:
- Selects para utm_source padrão (facebook/instagram) e utm_medium padrão (paid_social)
- Input para URL da política de privacidade
- Indicador de SSL: ícone verde se domínio começa com `https://`, vermelho caso contrário

---

## Wave 4 — POLIMENTO GLOBAL

### FIX-V2-017: Loading skeletons em TODAS as páginas
**Severidade:** LOW
**Arquivos:** Todos os `page.tsx` que usam `<p>Carregando...</p>` ou `<p className="text-zinc-500">Carregando...</p>`
**ACs:** NFR14 (Design System Braza — padrão skeleton)
**O que fazer:** Substituir por skeleton padrão Braza em cada página:
- Tabelas: 5 linhas skeleton com `animate-pulse`
- Cards: retângulos com `bg-white/[0.06] rounded`
- Usar o padrão documentado no DS seção 5: "Skeleton Loading"

---

### FIX-V2-018: Paginação nos endpoints de listagem
**Severidade:** LOW
**Arquivos backend:** leads, orders, events, campaigns, products (services + controllers)
**ACs:** Story 4.3-AC7 (50/página), implícito em todas as listagens
**O que fazer:**
- Aceitar `?page=1&limit=50` em todos os endpoints de listagem
- Aplicar `skip: (page-1) * limit` e `take: limit` no Prisma
- Retornar `{ data: [...], total: count, page, limit }`

---

### FIX-V2-019: max-w-5xl mx-auto no conteúdo das páginas
**Severidade:** LOW
**Arquivos:** Todos os `page.tsx`
**AC:** Design System seção 4 — Layout: "Content max-width: 64rem, max-w-5xl mx-auto"
**O que fazer:** Adicionar wrapper `<div className="max-w-5xl mx-auto">` dentro de cada page wrapper.

---

## Resumo

| Wave | Itens | Severidade | Foco |
|------|-------|------------|------|
| Wave 1 | FIX-V2-001 a 005 | HIGH/MEDIUM/LOW | Dashboard — filtros, tabelas top 5, variação %, skeletons |
| Wave 2 | FIX-V2-006 a 011 | HIGH/MEDIUM/LOW | Leads — campos enriquecidos, filtros, funil, CSV, ordenação |
| Wave 3 | FIX-V2-012 a 016 | HIGH/MEDIUM/LOW | Campaigns preview, detalhe; Settings persistência e Facebook |
| Wave 4 | FIX-V2-017 a 019 | LOW | Skeletons global, paginação, max-width |

**Total: 19 itens em 4 waves.**
**Todos os itens são ACs do PRD que estão documentados e devem ser implementados.**

---

*Gerado por Quinn (QA) — 2026-03-15*
*Gate: PASS condicional — itens acima são debt do PRD que devem ser resolvidos*
