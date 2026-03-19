# QA Fix Request — braza.commerce v1

> **Autor:** Quinn (QA) | **Data:** 19/03/2026
> **Para:** @dev (Dex)
> **Gate:** CONCERNS — corrigir antes de producao

---

## Issues ALTOS (4) — Bloqueia producao

### H1 — Buffer vazio crasha sharp na geracao de imagens

**Arquivo:** `packages/api/src/ai/ai.controller.ts` (~linha 85)
**Problema:** Quando uma imagem falha na geracao, `Buffer.alloc(0)` e adicionado ao array. O check `if (imageBuffers[i].length === 0) continue;` existe mas sharp pode falhar com buffers corrompidos (nao vazios mas invalidos).
**Correcao:** Adicionar try/catch individual por imagem:

```typescript
for (let i = 0; i < imageBuffers.length; i++) {
  if (imageBuffers[i].length === 0) continue;
  try {
    const webpBuffer = await sharp(imageBuffers[i])
      .resize(800, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    // ... save
  } catch (err) {
    this.logger.warn(`Image ${i + 1} conversion failed, skipping`);
    continue;
  }
}
```

**Esforco:** 5 min

---

### H2 — Template fallback silencioso mascara falha critica

**Arquivo:** `packages/api/src/render/render.service.ts` (linha 22-26)
**Problema:** Se `template.html` nao existir no dist, o servico usa um placeholder HTML basico sem erro. Paginas publicadas seriam servidas quebradas.
**Correcao:** Falhar na inicializacao:

```typescript
constructor() {
  const templatePath = join(__dirname, 'template.html');
  try {
    this.template = readFileSync(templatePath, 'utf-8');
    this.logger.log('Template v3.0 loaded successfully');
  } catch {
    throw new Error(`CRITICAL: Template not found at ${templatePath}. Run 'nest build' to copy assets.`);
  }
}
```

**Esforco:** 5 min

---

### H3 — Privacy page desatualizada (ainda referencia braza.chat)

**Arquivo:** `packages/web/src/app/privacy/page.tsx`
**Problema:** Conteudo fala sobre "BrazaChat", "links de rastreamento", "Meta Conversion API", "fbclid". Nada disso existe no braza.commerce.
**Correcao:** Reescrever completo:

- "BrazaChat" → "braza.commerce"
- Dados coletados: imagens de produto (upload), conteudo gerado por IA, dados de navegacao
- Finalidade: geracao de landing pages de produto com IA
- Remover: fbclid, WhatsApp, Meta Conversion API, campanhas
- Atualizar email de contato

**Esforco:** 15 min

---

### H4 — Dois controllers na mesma rota /pages

**Arquivos:** `ai/ai.controller.ts` (`@Controller('pages')`) + `pages/pages.controller.ts` (`@Controller('pages')`)
**Problema:** Dois controllers com mesmo prefixo. NestJS permite mas causa confusao e potencial conflito.
**Correcao (recomendada):** Mover os 3 endpoints de IA para o PagesController e deletar o AiController. O AiController so tem rotas, nao logica — a logica esta nos services (ai-copy.service, ai-image.service).

```typescript
// pages.controller.ts — adicionar:
@Post(':id/reference') uploadReference(...) { ... }
@Post(':id/generate-images') generateImages(...) { ... }
@Post(':id/generate-copy') generateCopy(...) { ... }
```

Atualizar `pages.module.ts` para importar AiCopyService e AiImageService.
Deletar `ai/ai.controller.ts`. Manter `ai/ai.module.ts` exportando os services.

**Esforco:** 15 min

---

## Issues MEDIOS (5) — Tech debt

### M1 — Multiplos `as any` para Json fields do Prisma

**Arquivos:** `pages.service.ts` (linhas 82, 103), `ai.controller.ts` (linha 115)
**Correcao:** Usar `Prisma.InputJsonValue`:

```typescript
import { Prisma } from '@prisma/client';
data: { userEditedContent: dto.userEditedContent as Prisma.InputJsonValue }
```

**Esforco:** 5 min

---

### M2 — Retry cego no ai-copy.service.ts

**Arquivo:** `packages/api/src/ai/ai-copy.service.ts`
**Problema:** Retry nao diferencia erro 401 (key invalida) de 429 (rate limit).
**Correcao:**

```typescript
} catch (error: any) {
  if (error.status === 401 || error.status === 403) {
    throw new BadRequestException('AI API authentication failed — check API key');
  }
  if (attempt === 1) throw new BadRequestException('Failed after 2 attempts');
}
```

**Esforco:** 10 min

---

### M3 — Paginas orfas no fluxo de criacao

**Arquivo:** `packages/web/src/app/pages/new/page.tsx`
**Problema:** Page e criada no banco no momento do upload (step 1). Se usuario abandona, fica registro orfao.
**Correcao:** Mover criacao da Page para o step 2 (quando clica "Gerar com IA"). Armazenar o arquivo no state como base64 ate la.

**Esforco:** 20 min

---

### M4 — Conflito de Content-Type no upload

**Arquivo:** `packages/web/src/app/pages/new/page.tsx` + `packages/web/src/lib/api.ts`
**Problema:** `apiFetch` sempre seta `Content-Type: application/json`. Upload usa `fetch` direto (correto) mas inconsistente.
**Correcao:** Criar helper `apiUpload` no `lib/api.ts`:

```typescript
export async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body,
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
```

**Esforco:** 5 min

---

### M5 — Race condition na edicao com multiplas abas

**Arquivo:** `packages/web/src/app/pages/[id]/edit/page.tsx`
**Problema:** `save()` envia JSON inteiro de `userEditedContent`. Duas abas abertas = ultima ganha.
**Correcao MVP:** Documentar limitacao. Adicionar aviso na UI: "Edite em apenas uma aba por vez".
**Correcao v2:** Merge server-side por campo.

**Esforco:** 5 min (aviso) | 30 min (merge server-side)

---

## Issues BAIXOS (3) — Melhorias

### L1 — soldCount randomico muda a cada reload

**Arquivo:** `packages/api/src/render/render.service.ts` (linha 40)
**Problema:** Numero de vendidos diferente a cada request.
**Correcao:** Gerar uma vez baseado no hash do pageId (deterministico):

```typescript
const soldCount = 150 + (parseInt(page.id.slice(-4), 16) % 250);
```

**Esforco:** 5 min

---

### L2 — useEffect sem cleanup no dashboard

**Arquivo:** `packages/web/src/app/pages/page.tsx`
**Correcao:**

```typescript
useEffect(() => {
  let cancelled = false;
  apiFetch<PageItem[]>('/pages')
    .then((data) => { if (!cancelled) setPages(data); })
    .catch(() => {})
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, []);
```

**Esforco:** 5 min

---

### L3 — API keys vazias nao validadas no boot

**Arquivos:** `ai-copy.service.ts`, `ai-image.service.ts`
**Correcao:** Warning no constructor:

```typescript
constructor() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) this.logger.warn('ANTHROPIC_API_KEY not set — copy generation will fail');
  this.client = new Anthropic({ apiKey: apiKey || '' });
}
```

**Esforco:** 5 min

---

## Checklist de seguranca adicional

| Item | Acao | Prioridade |
|------|------|-----------|
| `.env` no `.gitignore` | Verificar | ALTO |
| `uploads/` no `.gitignore` | Verificar | ALTO |
| Rate limiting nos endpoints de IA | Adicionar `@nestjs/throttler` | MEDIO |
| Model ID Google AI | PRD diz `gemini-3-pro-image-preview`, codigo usa `gemini-2.0-flash-exp` — alinhar | MEDIO |

---

## Prioridade de correcao

| Ordem | Issue | Esforco | Impacto |
|-------|-------|---------|---------|
| 1 | H1 — try/catch por imagem | 5 min | Previne crash |
| 2 | H2 — falhar no boot se template ausente | 5 min | Previne pagina quebrada |
| 3 | H4 — unificar controllers | 15 min | Previne conflito de rotas |
| 4 | H3 — reescrever privacy page | 15 min | Compliance |
| 5 | M1 — remover `as any` | 5 min | Type safety |
| 6 | M2 — retry inteligente | 10 min | Economia de tokens |
| 7 | M4 — apiUpload helper | 5 min | Consistencia |
| 8 | L3 — validar API keys no boot | 5 min | DX melhor |
| 9 | L1 — soldCount deterministico | 5 min | UX |
| 10 | L2 — useEffect cleanup | 5 min | Limpar warnings |
| 11 | M3 — paginas orfas | 20 min | Limpeza de dados |
| 12 | M5 — race condition (aviso) | 5 min | Prevenir perda de dados |

**Tempo total estimado: ~2h de correcao**

---

*QA Fix Request v4 — Quinn (QA) — 19/03/2026*
*12 issues | 4 altos | 5 medios | 3 baixos*
