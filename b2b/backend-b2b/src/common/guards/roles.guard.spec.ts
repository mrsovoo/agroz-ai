import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard (RBAC)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): any {
    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    };
  }

  it('should allow request if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ role: 'seller' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow super_admin regardless of required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner']);
    const context = createMockContext({ role: 'super_admin' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow user if role matches required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner', 'admin']);
    const context = createMockContext({ role: 'owner' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject user if role does not match required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['owner', 'admin']);
    const context = createMockContext({ role: 'seller' }); // seller is not owner or admin
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
