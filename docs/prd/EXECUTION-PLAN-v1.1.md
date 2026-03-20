# braza.commerce v1.1 — Plano de Execucao

> PRD: `docs/prd/PRD-001-braza-commerce-v1.md` (secao 16)
> Arquitetura: `docs/architecture/ARCHITECTURE-braza-commerce-v1.1.md`
> UX Spec: `docs/architecture/UX-SPEC-v1.1.md`
> Data: 20/03/2026 | River (SM)

---

## Stories

### Epic 6 — Publicacao

| Story | Nome | Prioridade | Depende de |
|-------|------|-----------|-----------|
| E6.1 | Slug customizada | MUST | — |

### Epic 7 — Tracking

| Story | Nome | Prioridade | Depende de |
|-------|------|-----------|-----------|
| E7.1 | Layout sidebar (tracker.braza) | MUST | — |
| E7.2 | CRUD campanhas + schema | MUST | E7.1 |
| E7.3 | Click tracking na offer page | MUST | E7.2 |

### Epic 8 — Pixel Server-Side

| Story | Nome | Prioridade | Depende de |
|-------|------|-----------|-----------|
| E8.1 | Meta Conversion API | MUST | E7.3 |

### Epic 9 — Dashboard

| Story | Nome | Prioridade | Depende de |
|-------|------|-----------|-----------|
| E9.1 | Dashboard metricas (RedTrack) | MUST | E7.2, E7.3 |

### Epic 10 — Yampi

| Story | Nome | Prioridade | Depende de |
|-------|------|-----------|-----------|
| E10.1 | Webhook Yampi | MUST | E7.3 |
| E10.2 | Pagina configuracoes | MUST | E7.1, E10.1 |

---

## Grafo de dependencias

```
E6.1 (slug) ─────────────────────────────────────

E7.1 (sidebar layout)
  └→ E7.2 (campaigns CRUD + schema)
       ├→ E7.3 (click tracking)
       │    ├→ E8.1 (Meta CAPI)
       │    ├→ E10.1 (Yampi webhook)
       │    │    └→ E10.2 (settings page)
       │    └→ E9.1 (dashboard metricas)
       └→ E9.1 (dashboard metricas)
```

---

## Ondas de execucao

| Onda | Stories | Paralelo? |
|------|---------|-----------|
| **1** | E6.1 (slug) + E7.1 (sidebar) | SIM |
| **2** | E7.2 (campaigns + schema) | Nao |
| **3** | E7.3 (click tracking) | Nao |
| **4** | E8.1 (CAPI) + E10.1 (Yampi) + E9.1 (dashboard) | SIM |
| **5** | E10.2 (settings) | Nao |

**Total: 8 stories | 5 ondas | 8 MUST**

---

*Plano de execucao v1.1 — River (SM) — 20/03/2026*
