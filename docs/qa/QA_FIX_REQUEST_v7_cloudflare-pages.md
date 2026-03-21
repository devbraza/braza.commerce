# QA Fix Request — Cloudflare Pages Deploy

**Date:** 2026-03-21
**Reviewer:** Quinn (QA)
**Gate Decision:** FAIL
**Target:** @dev (Dex)

---

## CRITICAL-01: Deploy atômico sobrescreve todas as páginas

**Severidade:** CRITICAL
**Arquivos:** `cloudflare-pages.service.ts`, `static-page-generator.service.ts`

**Problema:** Cloudflare Pages funciona com deploy atômico — cada deploy substitui TODO o conteúdo do projeto. O código atual deploya apenas os arquivos de UMA página por vez. Resultado:
- Publica página A → OK
- Publica página B → página A SOME
- Despublica qualquer página → TODAS as outras somem (deploy de 404 substitui tudo)

**Impacto:** Qualquer operação de publish/unpublish destrói todas as outras landing pages publicadas.

**Fix recomendado:** O deploy deve SEMPRE incluir TODAS as páginas publicadas. No `StaticPageGeneratorService.generate()`, após gerar os arquivos da página atual:
1. Buscar todas as páginas publicadas do banco (status = PUBLISHED)
2. Para cada uma, ler o HTML local de `{staticDir}/{slug}/index.html` e as imagens de `{staticDir}/{slug}/img/`
3. Montar um deploy único com TODOS os slugs
4. Deployar tudo junto via Wrangler

O `removePage()` deve fazer o mesmo: deployar todas as páginas EXCETO a removida.

O `regenerateAll()` deve gerar todas localmente primeiro, depois fazer UM deploy com tudo.

**Critério de aceite:**
- [ ] Publicar página A → acessível no CF Pages
- [ ] Publicar página B → A e B acessíveis
- [ ] Despublicar B → só A acessível, B retorna 404
- [ ] Regenerar tudo → todas as publicadas acessíveis num único deploy

---

## HIGH-01: Command injection via exec com interpolação de string

**Severidade:** HIGH
**Arquivo:** `cloudflare-pages.service.ts:77`

**Problema:**
```ts
const cmd = `npx wrangler pages deploy "${tempDir}" --project-name=${this.projectName} ...`;
```
Usa `exec()` (passa pelo shell) com interpolação direta de `this.projectName`. Se a env var contiver caracteres especiais (`;`, `&&`, `|`), pode executar comandos arbitrários.

**Fix recomendado:** Trocar `exec` por `execFile` (não passa pelo shell). O `execFile` recebe o binário e os argumentos como array, eliminando injection:
```ts
const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
await execFileAsync(npxPath, [
  'wrangler', 'pages', 'deploy', tempDir,
  `--project-name=${this.projectName}`,
  '--branch=main',
  '--commit-dirty=true',
], { env: { ... }, timeout: 120_000 });
```

**Critério de aceite:**
- [ ] `exec` substituído por `execFile`
- [ ] Deploy funciona no Windows (usar `npx.cmd`)
- [ ] Deploy funciona em Linux/Hetzner (usar `npx`)

---

## HIGH-02: Preload tag — dead code nas linhas 66-69

**Severidade:** HIGH
**Arquivos:** `static-page-generator.service.ts:62-69`, `render.service.ts:97-100`

**Problema:** O `RenderService` injeta o preload tag com `images[0].url` (URL original tipo `http://localhost:3001/...`). Depois o `StaticPageGeneratorService`:
1. Linha 62: reescreve `img.url` → `/p/slug/img/filename` no HTML inteiro (incluindo carousel e preload)
2. Linha 68: tenta encontrar `href="${images[0].url}"` pra reescrever o preload

Mas na linha 62, o `html.split(img.url).join(...)` já substituiu TODAS as ocorrências de `images[0].url`, incluindo a que está dentro do preload tag. Então na linha 68, o `oldPreload` já não existe mais e o replace é no-op.

**Resultado:** O preload tag é reescrito pela linha 62 (genérica) e não pela linha 68 (específica). Funciona, mas as linhas 66-69 são dead code que confunde.

**Fix recomendado:** Remover as linhas 66-69.

**Critério de aceite:**
- [ ] Linhas 66-69 removidas
- [ ] Preload tag no HTML local aponta pra `/p/slug/img/1.webp`
- [ ] Preload tag no HTML do CF aponta pra `img/1.webp`

---

## MEDIUM-01: Linha redundante no rewrite de CF

**Severidade:** MEDIUM
**Arquivo:** `static-page-generator.service.ts:85-86`

**Problema:**
```ts
cfHtml = cfHtml.split(`/p/${page.slug}/img/`).join(`img/`);
cfHtml = cfHtml.split(`href="/p/${page.slug}/img/`).join(`href="img/`);
```
A segunda linha é redundante — a primeira já troca `/p/slug/img/` por `img/` em todos os contextos, incluindo dentro de `href="..."`.

**Fix recomendado:** Remover a linha 86.

**Critério de aceite:**
- [ ] Linha redundante removida
- [ ] Todas as imagens no HTML do CF usam paths relativos `img/X.webp`

---

## MEDIUM-02: Falha silenciosa se Wrangler retorna vazio

**Severidade:** MEDIUM
**Arquivo:** `cloudflare-pages.service.ts:87-88`

**Problema:** A URL de produção é hardcoded como `https://${this.projectName}.pages.dev` sem verificar se o deploy realmente funcionou. Se o Wrangler falhar com exit code 0 mas sem deploy real, o sistema salva uma URL que pode não funcionar.

**Fix recomendado:** Verificar que o `stdout` contém confirmação de sucesso antes de retornar:
```ts
if (!stdout.includes('Success')) {
  throw new Error(`Wrangler deploy may have failed: ${stdout}`);
}
```

**Critério de aceite:**
- [ ] Deploy verifica stdout antes de confirmar sucesso
- [ ] Se stdout não contém "Success", lança erro

---

## LOW-01: Import não usado

**Severidade:** LOW
**Arquivo:** `cloudflare-pages.service.ts:3`

**Problema:** `join` de `path` é importado mas não usado.

**Fix recomendado:** Remover `import { join } from 'path';`

---

## Resumo

| ID | Sev | Descrição | Bloqueia? |
|----|-----|-----------|-----------|
| CRITICAL-01 | CRITICAL | Deploy atômico sobrescreve todas as páginas | SIM |
| HIGH-01 | HIGH | Command injection via exec | SIM |
| HIGH-02 | HIGH | Dead code preload tag | NAO |
| MEDIUM-01 | MEDIUM | Linha redundante rewrite CF | NAO |
| MEDIUM-02 | MEDIUM | Falha silenciosa Wrangler | NAO |
| LOW-01 | LOW | Import não usado | NAO |

**Ordem de fix:** CRITICAL-01 primeiro (bloqueia uso em produção), depois HIGH-01 (segurança), depois o resto em batch.

---

*QA Fix Request gerado por Quinn — 2026-03-21*
