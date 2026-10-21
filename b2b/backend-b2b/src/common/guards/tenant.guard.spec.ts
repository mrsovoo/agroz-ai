import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard (Multi-Tenant Data Isolation)', () => {
  let guard: TenantGuard;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      businessUser: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantGuard, { provide: PrismaService, useValue: prisma }],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
  });

  function createMockContext(request: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  it('CRITICAL: should STRICTLY REJECT when User from Business A tries to access Business B', async () => {
    const request = {
      user: {
        id: 'user-of-biz-a',
        role: 'owner',
        businessId: 'biz-a',
      },
      params: {
        businessId: 'biz-b', // Cross-tenant target!
      },
      headers: {},
    };

    // Database check: user does NOT belong to biz-b
    prisma.businessUser.findUnique.mockResolvedValueOnce(null);

    const context = createMockContext(request);
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(prisma.businessUser.findUnique).toHaveBeenCalledWith({
      where: {
        business_id_user_id: {
          business_id: 'biz-b',
          user_id: 'user-of-biz-a',
        },
      },
      include: expect.any(Object),
    });
  });

  it('should ALLOW access when User from Business A accesses Business A', async () => {
    const request = {
      user: {
        id: 'user-of-biz-a',
        role: 'seller',
        businessId: 'biz-a',
      },
      params: {
        businessId: 'biz-a',
      },
      headers: {},
    };

    prisma.businessUser.findUnique.mockResolvedValueOnce({
      id: 'bu-1',
      business_id: 'biz-a',
      user_id: 'user-of-biz-a',
      role: 'seller',
      business: { id: 'biz-a', is_active: true, deleted_at: null },
    });

    const context = createMockContext(request);
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect((request as any).businessId).toBe('biz-a');
    expect((request as any).userRoleInBusiness).toBe('seller');
  });

  it('should ALLOW Super Admin to access any business for management', async () => {
    const request = {
      user: {
        id: 'super-admin-id',
        role: 'super_admin',
      },
      params: {
        businessId: 'any-biz-xyz',
      },
      headers: {},
    };

    const context = createMockContext(request);
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect((request as any).businessId).toBe('any-biz-xyz');
    expect(prisma.businessUser.findUnique).not.toHaveBeenCalled();
  });

  it('should REJECT access if business is deleted or inactive', async () => {
    const request = {
      user: {
        id: 'user-1',
        role: 'owner',
        businessId: 'biz-inactive',
      },
      params: {
        businessId: 'biz-inactive',
      },
      headers: {},
    };

    prisma.businessUser.findUnique.mockResolvedValueOnce({
      id: 'bu-inactive',
      business_id: 'biz-inactive',
      user_id: 'user-1',
      role: 'owner',
      business: { id: 'biz-inactive', is_active: false, deleted_at: null }, // INACTIVE
    });

    const context = createMockContext(request);
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
