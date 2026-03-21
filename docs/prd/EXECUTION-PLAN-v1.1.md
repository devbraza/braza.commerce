# braza.commerce v1.1 — Plano de Execucao (REVISADO)

> PRD: `docs/prd/PRD-001-braza-commerce-v1.md` (secao 16)
> Arquitetura: `docs/architecture/ARCHITECTURE-tracking-v1.1.md`
> Pesquisa: `docs/research/yampi-integration-research.md`
> Data: 21/03/2026 | River (SM) | Revisado com base na analise da Aria (Architect)

---

## Contexto

A Aria identificou que **a maior parte do tracking ja esta implementada** no codebase (Campaign, Click, Event, TrackingService, CapiService, YampiController). O trabalho e de **integracao e polish**, nao construcao from scratch.

Decisao arquitetural: **Opcao B** — manter Campaign, tornar transparente. O frontend unifica o fluxo (Pagina = Campanha), mas o backend mantem a separacao interna.

---

## Stories

### Epic 6 — Publicacao

| Story | Nome | Status | Depende de |
|-------|------|--------|-----------|
| E6.1 | Slug customizada | Ready for Review | — |

### Epic 7 — Fluxo Unificado (pagina + tracking)

| Story | Nome | Status | Depende de |
|-------|------|--------|-----------|
| E7.1 | Campaign automatica no backend | Draft | E6.1 |
| E7.2 | Campos de tracking no frontend | Draft | E7.1 |

### Epic 8 — Webhook Yampi

| Story | Nome | Status | Depende de |
|-------|------|--------|-----------|
| E8.1 | Env var + hardening (idempotencia, logs) | Draft | E7.1 |

### Epic 9 — Dashboard

| Story | Nome | Status | Depende de |
|-------|------|--------|-----------|
| E9.1 | Dashboard de tracking por pagina | Draft | E7.1, E7.2, E8.1 |

---

## Grafo de dependencias

```
E6.1 (slug) ✅ Ready for Review
  └→ E7.1 (campaign auto backend)
       ├→ E7.2 (tracking frontend)
       │    └→ E9.1 (dashboard)
       └→ E8.1 (webhook hardening)
            └→ E9.1 (dashboard)
```

---

## Ondas de execucao

| Onda | Stories | Paralelo? |
|------|---------|-----------|
| **1** | E6.1 (slug) | Ja em review |
| **2** | E7.1 (campaign auto backend) | Nao |
| **3** | E7.2 (tracking frontend) + E8.1 (webhook hardening) | SIM |
| **4** | E9.1 (dashboard) | Nao |

**Total: 5 stories | 4 ondas | 5 MUST**

---

## Comparacao com plano anterior

| Antes (8 stories, 5 ondas) | Agora (5 stories, 4 ondas) | Motivo |
|----------------------------|---------------------------|--------|
| E7.1 Layout sidebar | REMOVIDA | Layout sera aplicado nas stories de frontend |
| E7.2 CRUD campanhas + schema | REMOVIDA | Schema ja existe, Campaign auto em E7.1 |
| E7.3 Click tracking | REMOVIDA | TrackingService ja implementado |
| E8.1 Meta CAPI | REMOVIDA | CapiService ja existe + Yampi faz nativamente |
| E10.1 Webhook Yampi | Virou E8.1 (hardening) | Webhook ja existe, so precisa config |
| E10.2 Settings page | REMOVIDA | Config via env var, settings minimo |

**Reducao: 8 → 5 stories, 5 → 4 ondas**

---

*Plano de execucao v1.1 (revisado) — River (SM) — 21/03/2026*
*Baseado na analise arquitetural da Aria (Architect) — 21/03/2026*
