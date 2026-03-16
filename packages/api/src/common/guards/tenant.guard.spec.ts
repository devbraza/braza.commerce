import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';

function createMockContext(user: unknown): ExecutionContext {
  const request = { user } as Record<string, unknown>;
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  it('should allow request with valid user and set tenantId', () => {
    const ctx = createMockContext({ id: 'user-123' });
    const result = guard.canActivate(ctx);
    expect(result).toBe(true);

    const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;
    expect(req.tenantId).toBe('user-123');
  });

  it('should throw UnauthorizedException if user is missing', () => {
    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user has no id', () => {
    const ctx = createMockContext({ name: 'no-id' });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
