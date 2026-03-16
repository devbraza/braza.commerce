# QA Fix Request — Migração Z-API

**Date:** 2026-03-16
**Reviewer:** Quinn (QA)
**Stories:** 3.1, 3.2, 6.3
**Gate Decision:** CONCERNS — Fix required before merge

---

## S1 — CRITICAL: Path Traversal no Upload Serve

**Arquivo:** `packages/api/src/upload/upload.controller.ts` linhas 53-62
**Severidade:** CRITICAL — Vulnerabilidade de segurança

**Problema:**
O endpoint `GET /upload/media/:userId/:date/:filename` passa os params diretamente para `res.sendFile()` sem sanitização. Um atacante pode usar `../../etc/passwd` no param `filename` para ler qualquer arquivo do servidor.

**Reprodução:**
```
GET /upload/media/qualquer/2026-01-01/..%2F..%2F..%2Fetc%2Fpasswd
```

**Fix requerido:**
1. Validar que `filename` contém apenas caracteres seguros (UUID + extensão)
2. Validar que `date` segue formato `YYYY-MM-DD`
3. Rejeitar qualquer param contendo `..`, `/`, ou `\`
4. Usar `path.resolve()` e verificar que o path resultante está dentro de `uploadsDir`

**Exemplo de fix:**
```typescript
@Get('media/:userId/:date/:filename')
async serveMedia(
  @Param('userId') userId: string,
  @Param('date') date: string,
  @Param('filename') filename: string,
  @Res() res: Response,
) {
  // Sanitize: reject path traversal
  if (/[\/\\]|\.\./.test(userId + date + filename)) {
    return res.status(400).send('Invalid path');
  }
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).send('Invalid date format');
  }
  // Validate filename is UUID + extension
  if (!/^[a-f0-9-]{36}\.\w{1,5}$/.test(filename)) {
    return res.status(400).send('Invalid filename');
  }

  const filePath = this.uploadService.getFilePath(userId, date, filename);

  // Verify resolved path is within uploads directory
  const resolved = require('path').resolve(filePath);
  if (!resolved.startsWith(require('path').resolve(process.cwd(), 'uploads', 'media'))) {
    return res.status(403).send('Forbidden');
  }

  res.sendFile(resolved);
}
```

---

## H1 — HIGH: Memory Leak no Rate Limit Guard

**Arquivo:** `packages/api/src/common/guards/rate-limit.guard.ts` linhas 16 e 41
**Severidade:** HIGH — Problema de produção sob carga

**Problema:**
Os Maps `store` em `WebhookRateLimitGuard` e `MessageRateLimitGuard` crescem infinitamente. Cada IP/conversationId novo adiciona uma entry que nunca é removida. Em produção com muitos IPs distintos, a memória do processo cresce até crashar.

**Fix requerido:**
Adicionar cleanup periódico das entries expiradas.

**Exemplo de fix:**
```typescript
@Injectable()
export class WebhookRateLimitGuard implements CanActivate, OnModuleInit {
  private readonly store = new Map<string, RateLimitEntry>();

  onModuleInit() {
    // Cleanup expired entries every 60s
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now > entry.resetAt) this.store.delete(key);
      }
    }, 60000);
  }

  // ... rest unchanged
}
```

Aplicar o mesmo pattern ao `MessageRateLimitGuard`.

---

## H2 — HIGH: Unhandled Rejection no Webhook

**Arquivo:** `packages/api/src/whatsapp/whatsapp.controller.ts` linhas 30-36
**Severidade:** HIGH — Crash silencioso em produção

**Problema:**
```typescript
res.status(200).send('OK');  // Response já enviado
await this.whatsappService.handleZApiWebhook(body, userId);  // Se falhar, unhandled rejection
```
O `await` após `res.send()` significa que se `handleZApiWebhook` lançar um erro, o NestJS não consegue enviar uma response de erro (já foi enviada). Isso gera um unhandled promise rejection que pode crashar o processo.

**Fix requerido:**
Usar fire-and-forget com `.catch()` para capturar erros sem bloquear.

**Exemplo de fix:**
```typescript
@Post('webhook/z-api')
@UseGuards(WebhookRateLimitGuard)
async handleZApiWebhook(@Body() body: unknown, @Res() res: Response) {
  res.status(200).send('OK');

  const userId = process.env.DEFAULT_USER_ID;
  if (userId) {
    this.whatsappService.handleZApiWebhook(body, userId).catch(err => {
      this.logger.error('Webhook processing failed', err);
    });
  }
}
```

Aplicar o mesmo pattern ao endpoint `webhook/z-api/delivery`.

**Nota:** Requer adicionar `private readonly logger = new Logger(WhatsappController.name)` ao controller.

---

## Resumo

| # | Severidade | Issue | Estimativa |
|---|------------|-------|------------|
| S1 | CRITICAL | Path traversal no upload serve | 10 min |
| H1 | HIGH | Memory leak nos rate limit guards | 10 min |
| H2 | HIGH | Unhandled rejection nos webhooks | 5 min |

**Total estimado:** ~25 min

**Após fixes:** Chamar @qa para revalidação → gate PASS → @devops para push.
