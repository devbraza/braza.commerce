# Pesquisa — Integração Yampi para Tracking (braza.commerce)

> **Autor:** Atlas (Analyst) | **Data:** 21/03/2026 | **Solicitante:** Morgan (PM)
> **Objetivo:** Mapear capacidades da Yampi (webhooks, API, metadata, Meta CAPI) para viabilizar tracking de funil no braza.commerce.

---

## Resumo Executivo

**A Yampi suporta tudo que precisamos.** O funil completo click → landing → checkout → compra é 100% viável. A Yampi aceita metadata customizada na URL do checkout, retorna esses dados nos webhooks, e já possui integração nativa com Meta Conversion API para eventos de checkout/compra.

---

## 1. Metadata na URL do Checkout

A Yampi aceita parâmetros customizados na URL do checkout. Formato:

```
https://seguro.loja.com.br/r/PRODUTO?metadata[click_id]=ck_abc123&metadata[fbclid]=fb_xyz
```

- Campo livre: qualquer nome com `metadata[nome]=valor`
- Múltiplos parâmetros separados por `&`
- Dados gravados automaticamente no pedido
- Consultáveis via API: `GET /orders/{id}?include=metadata`
- **Incluídos automaticamente em todos os webhooks `order.*`**

**Conclusão:** Quando o lead clica no CTA da landing page, o braza.commerce injeta `click_id` e `fbclid` na URL do checkout Yampi. Esses dados voltam no webhook `order.paid`, fechando o funil.

---

## 2. Webhooks Disponíveis

A Yampi dispara 14 eventos via webhook:

| Evento | Quando dispara | Relevante pro tracking? |
|--------|---------------|------------------------|
| `order.created` | Pedido criado | **Sim** — InitiateCheckout |
| `order.paid` | Pagamento confirmado | **Sim** — Purchase |
| `order.status.updated` | Status muda | Parcial |
| `order.invoice.created` | NF emitida | Não |
| `order.invoice.updated` | NF atualizada | Não |
| `transaction.payment.refused` | Pagamento recusado | **Sim** — funil |
| `cart.reminder` | Carrinho abandonado | Sim — retargeting |
| `customer.created` | Novo cliente | Parcial |
| `customer.address.created` | Endereço adicionado | Não |
| `product.created` | Produto criado | Não |
| `product.updated` | Produto atualizado | Não |
| `product.deleted` | Produto deletado | Não |
| `product.inventory.updated` | Estoque atualizado | Não |
| `cashback.expiring` | Cashback expirando | Não |

### Eventos-chave pro funil

- `order.created` → lead iniciou checkout
- `order.paid` → lead comprou (PURCHASE)
- `transaction.payment.refused` → tentou mas não passou
- `cart.reminder` → abandonou carrinho

### Segurança dos Webhooks

- Validação via **HMAC-SHA256** (header `X-Yampi-Hmac-SHA256`)
- Resposta esperada: HTTP 200 ou 201 em até **5 segundos**
- Retry policy: não documentada oficialmente

---

## 3. API REST

### Endpoints relevantes

| Endpoint | Método | O que faz |
|----------|--------|-----------|
| `/orders` | GET | Listar pedidos |
| `/orders/{id}?include=metadata` | GET | Ver pedido com metadata |
| `/orders/{id}/transactions` | GET | Transações do pedido |
| `/webhooks` | POST | Criar webhook |
| `/webhooks` | GET | Listar webhooks |
| `/webhooks/{id}` | GET | Visualizar webhook |
| `/webhooks/{id}` | PUT | Atualizar webhook |
| `/webhooks/{id}` | DELETE | Excluir webhook |

### Autenticação

- API v2 REST: `https://api.dooki.com.br/v2/{alias}`
- Header obrigatório: `Content-Type: application/json`
- Autenticação via token (User Token + Secret Key)

### Rate Limits

| Endpoint | Limite |
|----------|--------|
| GET /orders | 120 req/min |
| PUT /orders | 30 req/min |
| GET /products | 30 req/min |
| Excedido → HTTP 429 | Too Many Requests |

---

## 4. Integração Meta CAPI (Nativa da Yampi)

A Yampi já possui integração nativa com Meta Conversion API. Eventos disparados automaticamente:

| Evento Meta | Disparado pela Yampi | Etapa |
|-------------|---------------------|-------|
| ViewContent | Sim | Visualização de produto |
| Search | Sim | Busca |
| AddToCart | Sim | Adicionar ao carrinho |
| InitiateCheckout | Sim | Início do checkout |
| AddPaymentInfo | Sim | Informação de pagamento |
| **Purchase** | **Sim** | **Compra confirmada** |

### Configuração

1. Pixel ID + Access Token do Facebook Business Manager
2. Configurado no painel Yampi: Marketing → Pixel → Novo Pixel → Facebook → API de Conversões
3. Eventos enviados **tanto pelo browser quanto pela API** (dual: client + server-side)

---

## 5. Implicações para o braza.commerce

### O que NÃO precisamos construir

| Funcionalidade | Motivo |
|---------------|--------|
| Meta CAPI para Purchase | Yampi já faz nativamente |
| Meta CAPI para InitiateCheckout | Yampi já faz nativamente |
| Meta CAPI para AddToCart | Yampi já faz nativamente |
| Pixel no checkout | Yampi já gerencia |

### O que PRECISAMOS construir

| Funcionalidade | Descrição |
|---------------|-----------|
| Script na landing page | Disparar `PAGE_VIEW` e `CTA_CLICK` |
| Link de tracking | Redirect via braza.commerce, gerar `click_id` único |
| Injetar metadata na URL | `metadata[click_id]` + `metadata[fbclid]` no redirect pro checkout |
| Endpoint de webhook | Receber `order.paid` e `order.created` da Yampi |
| Amarrar click → pedido | Metadata volta no webhook, fecha o funil |
| Meta CAPI para ViewContent | Disparar server-side quando lead chega na landing (Yampi não cobre essa etapa) |

### Funil final com responsabilidades

```
BRAZA.COMMERCE (nossa responsabilidade):
  1. Click no anúncio → braza.commerce/t/{id}
     → Registra CLICK (server-side)
     → Redireciona pra landing page com ?ck={clickId}

  2. Landing page carrega
     → Script dispara PAGE_VIEW
     → Server dispara ViewContent via Meta CAPI

  3. Lead clica "Comprar agora"
     → Script dispara CTA_CLICK
     → Redirect pro Yampi com metadata[click_id]=xxx&metadata[fbclid]=xxx

YAMPI (responsabilidade deles):
  4. Checkout (InitiateCheckout, AddPaymentInfo via CAPI — nativo)
  5. Compra (Purchase via CAPI — nativo)
  6. Webhook order.paid → braza.commerce recebe com metadata[click_id]

BRAZA.COMMERCE (fecha o funil):
  7. Recebe webhook → amarra click_id ao pedido → funil completo
     Dashboard: clicks → views → CTAs → compras (com valores)
```

---

## 6. Limitações Identificadas

| Limitação | Impacto | Mitigação |
|-----------|---------|-----------|
| Webhook timeout 5s | Processamento deve ser rápido | Aceitar webhook imediatamente, processar async |
| Rate limit 120 req/min (orders) | Baixo para MVP | Suficiente para volume inicial |
| Sem retry policy documentada | Possível perda de eventos | Implementar reconciliação periódica via API |
| Deduplicação CAPI não documentada | Possível evento duplicado no Meta | Monitorar e ajustar se necessário |
| LGPD em metadata | Não enviar dados pessoais | Usar apenas IDs técnicos (click_id, fbclid) |
| UTMs não visíveis no painel | utm_medium, utm_term, utm_content só via API/export | Consultar via API se necessário |

---

## 7. Fontes

- [Como usar Metadata e UTMs na Yampi](https://help.yampi.com.br/pt-BR/articles/12166025-como-usar-metadata-e-utms-na-yampi)
- [Webhooks — Yampi Developer Portal](https://docs.yampi.com.br/api-reference/webhooks)
- [API Yampi — Introdução](https://docs.yampi.com.br)
- [Como configurar a API de Conversão do Pixel do Facebook na Yampi](https://help.yampi.com.br/pt-BR/articles/6067097-como-configurar-a-api-de-conversao-do-pixel-do-facebook-na-yampi)
- [Novos eventos de Webhooks — Yampi Releases](https://releases.yampi.com.br/novos-eventos-de-webhooks-1gndrq)

---

*Relatório de pesquisa — Atlas (Analyst) — 21/03/2026*
*Handoff → @pm (Morgan) para desenho da funcionalidade de tracking*
