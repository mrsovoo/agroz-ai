import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessService } from './business.service';

describe('BusinessService', () => {
  let service: BusinessService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      business: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      businessUser: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<BusinessService>(BusinessService);
  });

  describe('createBusiness', () => {
    it('should reject creation if sector is not enabled (Rule 2)', async () => {
      await expect(
        service.createBusiness('user-1', {
          name: 'Feed Shop',
          sector: 'feed', // Inactive sector
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create pharmacy business, bind owner and update role', async () => {
      prisma.business.create.mockResolvedValueOnce({
        id: 'biz-1',
        name: 'AgroVet Dorixona',
        sector: 'pharmacy',
        country_id: 'UZ',
      });

      const result = await service.createBusiness('user-1', {
        name: 'AgroVet Dorixona',
        sector: 'pharmacy',
        phone: '+998901234567',
      });

      expect(result.id).toBe('biz-1');
      expect(prisma.businessUser.create).toHaveBeenCalledWith({
        data: {
          business_id: 'biz-1',
          user_id: 'user-1',
          role: 'owner',
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { role: 'owner' },
      });
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BUSINESS_CREATED', businessId: 'biz-1' }),
      );
    });
  });

  describe('staff management', () => {
    it('should add seller staff member to business', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValueOnce({
        id: 'seller-user-1',
        phone: '+998909998877',
        first_name: 'Jasur',
        role: 'seller',
      });
      prisma.businessUser.findUnique.mockResolvedValueOnce(null); // Not yet member
      prisma.businessUser.create.mockResolvedValueOnce({
        id: 'bu-1',
        business_id: 'biz-1',
        user_id: 'seller-user-1',
        role: 'seller',
      });

      const res = await service.addStaff('biz-1', 'owner-1', {
        phone: '+998909998877',
        first_name: 'Jasur',
        role: 'seller',
      });

      expect(res.user_id).toBe('seller-user-1');
      expect(res.role).toBe('seller');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BUSINESS_STAFF_ADDED' }),
      );
    });

    it('should prevent owner from deleting themselves', async () => {
      await expect(
        service.removeStaff('biz-1', 'owner-id', 'owner-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent deleting another owner', async () => {
      prisma.businessUser.findUnique.mockResolvedValueOnce({
        id: 'bu-owner-2',
        business_id: 'biz-1',
        user_id: 'other-owner-id',
        role: 'owner', // Role is owner
      });

      await expect(
        service.removeStaff('biz-1', 'owner-id', 'other-owner-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully remove a seller staff member', async () => {
      prisma.businessUser.findUnique.mockResolvedValueOnce({
        id: 'bu-seller',
        business_id: 'biz-1',
        user_id: 'seller-id',
        role: 'seller',
      });

      const res = await service.removeStaff('biz-1', 'owner-id', 'seller-id');
      expect(res.success).toBe(true);
      expect(prisma.businessUser.delete).toHaveBeenCalledWith({
        where: { id: 'bu-seller' },
      });
    });
  });

  describe('Super Admin operations', () => {
    it('should allow super admin to block or activate business', async () => {
      prisma.business.findUnique.mockResolvedValueOnce({
        id: 'biz-1',
        name: 'Dorixona',
        is_active: true,
      });
      prisma.business.update.mockResolvedValueOnce({
        id: 'biz-1',
        is_active: false,
      });

      const res = await service.adminUpdateBusinessStatus('biz-1', false, 'admin-1');
      expect(res.is_active).toBe(false);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ADMIN_BUSINESS_BLOCKED' }),
      );
    });
  });
});

