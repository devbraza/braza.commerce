# braza.commerce v1.0 — Plano de Execucao

> PRD: `docs/prd/PRD-001-braza-commerce-v1.md`
> Arquitetura: `docs/architecture/ARCHITECTURE-braza-commerce-v1.md`
> Template base: `docs/prototypes/LANDING-PAGE-SPEC.md` (v3.0)
> Data: 19/03/2026 | Atualizado por: River (SM)

---

## Epics e Stories

### Epic 1 — Setup (fundacao)

| Story | Nome | Prioridade | Depende de | Agente |
|-------|------|-----------|------------|--------|
| E1.1 | Limpar codebase (braza.chat → braza.commerce) | MUST | — | @dev |
| E1.2 | Novo schema do banco (Page + PageImage) | MUST | E1.1 | @dev |

### Epic 2 — Upload & AI (nucleo)

| Story | Nome | Prioridade | Depende de | Agente |
|-------|------|-----------|------------|--------|
| E2.1 | Upload referencia + Nano Banana Pro (6 imagens) | MUST | E1.2 | @dev |
| E2.2 | Geracao de copy com Claude Vision (textos) | MUST | E2.1 | @dev |
| E2.3 | Regenerar campo especifico (texto ou imagem) | SHOULD | E2.1, E2.2 | @dev |

### Epic 3 — Page Builder (interface)

| Story | Nome | Prioridade | Depende de | Agente |
|-------|------|-----------|------------|--------|
| E3.1 | CRUD de paginas | MUST | E1.2 | @dev |
| E3.2 | Interface de criacao e edicao | MUST | E2.1, E2.2, E3.1 | @dev |

### Epic 4 — Publish & Serve (entrega)

| Story | Nome | Prioridade | Depende de | Agente |
|-------|------|-----------|------------|--------|
| E4.1 | Render engine (template v3.0 + dados) | MUST | E3.1 | @dev |
| E4.2 | Publicacao e servir pagina publica | MUST | E4.1 | @dev |

### Epic 5 — Dashboard (gestao)

| Story | Nome | Prioridade | Depende de | Agente |
|-------|------|-----------|------------|--------|
| E5.1 | Dashboard de paginas | MUST | E3.1, E4.2 | @dev |

---

## Grafo de dependencias

```
E1.1 (cleanup)
  └→ E1.2 (schema)
       ├→ E3.1 (pages CRUD)
       │    ├→ E3.2 (editor UI) ← depende tambem de E2.1 + E2.2
       │    ├→ E4.1 (render engine)
       │    │    └→ E4.2 (publish)
       │    │         └→ E5.1 (dashboard)
       │    └→ E5.1 (dashboard)
       └→ E2.1 (upload + imagens)
            └→ E2.2 (copy)
                 ├→ E2.3 (regenerate)
                 └→ E3.2 (editor UI)
```

---

## Ondas de execucao

| Onda | Stories | Paralelo? |
|------|---------|-----------|
| **1** | E1.1 (cleanup) | Nao |
| **2** | E1.2 (schema) | Nao |
| **3** | E3.1 (CRUD) + E2.1 (upload+imagens) | SIM |
| **4** | E2.2 (copy) + E4.1 (render engine) | SIM |
| **5** | E3.2 (editor UI) + E4.2 (publish) + E2.3 (regenerate) | SIM |
| **6** | E5.1 (dashboard) | Nao |

**Total: 10 stories | 6 ondas | 9 MUST + 1 SHOULD**

---

## Regras inegociaveis

1. **Template v3.0** e a fundacao — estrutura, layout, cores, animacoes NAO sao editaveis
2. **2 IAs separadas:** Nano Banana Pro (imagens) + Claude (copy)
3. **1 foto de referencia** → 6 imagens geradas + textos completos
4. **Sem auth no MVP** — acesso direto
5. **Todos os CTAs** redirecionam para checkout externo (checkoutUrl)

---

*Plano de execucao v2 — River (SM) — 19/03/2026*
