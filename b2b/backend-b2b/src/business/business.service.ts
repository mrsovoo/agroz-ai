import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { isSectorEnabled } from '../common/sectors/sector.registry';
import { normalizeE164 } from '../common/utils/phone';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddStaffDto,
  CreateBusinessDto,
  UpdateBusinessDto,
  UpdateStaffRoleDto,
} from './dto/business.dto';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Create a new business for an authenticated merchant
   */
  async createBusiness(userId: string, dto: CreateBusinessDto, ipAddress?: string) {
    // 1. Sector validation (Rule 2: Only 'pharmacy' is enabled currently)
    if (!isSectorEnabled(dto.sector)) {
      throw new BadRequestException(
        `Ushbu "${dto.sector}" sektori hozirda faol emas. Hozirgi bosqichda faqat "pharmacy" (dorixona) sektori yoqilgan.`,
      );
    }

    // 2. Create business in PostgreSQL
    const business = await this.prisma.business.create({
      data: {
        name: dto.name.trim(),
        sector: dto.sector as any,
        country_id: dto.country_id || 'UZ',
        currency: dto.currency || 'UZS',
        language: dto.language || 'uz',
        address: dto.address?.trim(),
        phone: dto.phone ? normalizeE164(dto.phone) : undefined,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    // 3. Bind the user as 'owner' of this business
    await this.prisma.businessUser.create({
      data: {
        business_id: business.id,
        user_id: userId,
        role: 'owner',
      },
    });

    // 4. Elevate user role to 'owner' if currently 'seller'
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'owner' },
    });

    // 5. Audit log
    await this.audit.log({
      action: 'BUSINESS_CREATED',
      entityName: 'business',
      entityId: business.id,
      businessId: business.id,
      userId,
      details: {
        name: business.name,
        sector: business.sector,
        country_id: business.country_id,
        ip: ipAddress,
      },
      ipAddress,
    });

    return business;
  }

  /**
   * Retrieve business profile with staff overview
   */
  async getBusinessProfile(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        business_users: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                first_name: true,
                last_name: true,
                role: true,
                is_active: true,
              },
            },
          },
        },
      },
    });

    if (!business || business.deleted_at) {
      throw new NotFoundException('Dorixona topilmadi.');
    }

    return {
      id: business.id,
      name: business.name,
      sector: business.sector,
      country_id: business.country_id,
      currency: business.currency,
      language: business.language,
      address: business.address,
      phone: business.phone,
      latitude: business.latitude,
      longitude: business.longitude,
      is_active: business.is_active,
      created_at: business.created_at,
      staff_count: business.business_users.length,
      staff: business.business_users.map((bu) => ({
        user_id: bu.user.id,
        first_name: bu.user.first_name,
        last_name: bu.user.last_name,
        phone: bu.user.phone,
        role: bu.role,
        is_active: bu.user.is_active,
      })),
    };
  }

  /**
   * Update business details
   */
  async updateBusiness(
    businessId: string,
    userId: string,
    dto: UpdateBusinessDto,
    ipAddress?: string,
  ) {
    const existing = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!existing || existing.deleted_at) {
      throw new NotFoundException('Dorixona topilmadi.');
    }

    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        name: dto.name?.trim(),
        address: dto.address?.trim(),
        phone: dto.phone ? normalizeE164(dto.phone) : undefined,
        language: dto.language,
        currency: dto.currency,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });

    await this.audit.log({
      action: 'BUSINESS_UPDATED',
      entityName: 'business',
      entityId: businessId,
      businessId,
      userId,
      details: { updatedFields: Object.keys(dto), ip: ipAddress },
      ipAddress,
    });

    return updated;
  }

  /**
   * List staff members for a specific business
   */
  async listStaff(businessId: string) {
    const staffMembers = await this.prisma.businessUser.findMany({
      where: { business_id: businessId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            first_name: true,
            last_name: true,
            is_active: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return staffMembers.map((sm) => ({
      membership_id: sm.id,
      user_id: sm.user.id,
      first_name: sm.user.first_name,
      last_name: sm.user.last_name,
      phone: sm.user.phone,
      role: sm.role,
      is_active: sm.user.is_active,
      joined_at: sm.created_at,
    }));
  }

  /**
   * Add a new staff member to the business
   */
  async addStaff(businessId: string, currentUserId: string, dto: AddStaffDto, ipAddress?: string) {
    const phone = normalizeE164(dto.phone);
    const role = dto.role === 'owner' ? 'owner' : 'seller';

    // 1. Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          first_name: dto.first_name.trim(),
          last_name: dto.last_name?.trim(),
          role: 'seller',
          country_id: 'UZ',
        },
      });
    }

    // 2. Check if already staff in this business
    const existingMembership = await this.prisma.businessUser.findUnique({
      where: {
        business_id_user_id: {
          business_id: businessId,
          user_id: user.id,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('Ushbu xodim allaqachon dorixonaga biriktirilgan.');
    }

    // 3. Add to business_users
    const membership = await this.prisma.businessUser.create({
      data: {
        business_id: businessId,
        user_id: user.id,
        role,
      },
    });

    await this.audit.log({
      action: 'BUSINESS_STAFF_ADDED',
      entityName: 'business_user',
      entityId: membership.id,
      businessId,
      userId: currentUserId,
      details: { staffUserId: user.id, phone, role, ip: ipAddress },
      ipAddress,
    });

    return {
      membership_id: membership.id,
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role: membership.role,
    };
  }

  /**
   * Update staff role
   */
  async updateStaffRole(
    businessId: string,
    currentUserId: string,
    staffUserId: string,
    dto: UpdateStaffRoleDto,
    ipAddress?: string,
  ) {
    const membership = await this.prisma.businessUser.findUnique({
      where: {
        business_id_user_id: {
          business_id: businessId,
          user_id: staffUserId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Xodim dorixonada topilmadi.');
    }

    const updated = await this.prisma.businessUser.update({
      where: { id: membership.id },
      data: { role: dto.role },
    });

    await this.audit.log({
      action: 'BUSINESS_STAFF_ROLE_UPDATED',
      entityName: 'business_user',
      entityId: membership.id,
      businessId,
      userId: currentUserId,
      details: { staffUserId, oldRole: membership.role, newRole: dto.role, ip: ipAddress },
      ipAddress,
    });

    return updated;
  }

  /**
   * Remove staff member from business
   */
  async removeStaff(
    businessId: string,
    currentUserId: string,
    staffUserId: string,
    ipAddress?: string,
  ) {
    if (staffUserId === currentUserId) {
      throw new BadRequestException('Dorixona egasi o‘z hisobini o‘chira olmaydi.');
    }

    const membership = await this.prisma.businessUser.findUnique({
      where: {
        business_id_user_id: {
          business_id: businessId,
          user_id: staffUserId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Xodim ushbu dorixonada topilmadi.');
    }

    if (membership.role === 'owner') {
      throw new ForbiddenException('Boshqa dorixona egasini o‘chirish taqiqlangan.');
    }

    await this.prisma.businessUser.delete({
      where: { id: membership.id },
    });

    await this.audit.log({
      action: 'BUSINESS_STAFF_REMOVED',
      entityName: 'business_user',
      entityId: membership.id,
      businessId,
      userId: currentUserId,
      details: { removedUserId: staffUserId, ip: ipAddress },
      ipAddress,
    });

    return { success: true, message: 'Xodim muvaffaqiyatli o‘chirildi.' };
  }

  /**
   * Super Admin: List all businesses with pagination, search and filters
   */
  async adminListBusinesses(params: {
    page?: number;
    limit?: number;
    search?: string;
    sector?: string;
    isActive?: boolean;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
      ...(params.sector ? { sector: params.sector as any } : {}),
      ...(params.isActive !== undefined ? { is_active: params.isActive } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { phone: { contains: params.search } },
              { address: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              business_users: true,
              products: true,
              sales: true,
            },
          },
        },
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      items: items.map((b) => ({
        id: b.id,
        name: b.name,
        sector: b.sector,
        phone: b.phone,
        address: b.address,
        is_active: b.is_active,
        created_at: b.created_at,
        users_count: b._count.business_users,
        products_count: b._count.products,
        sales_count: b._count.sales,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Super Admin: Activate or Block business
   */
  async adminUpdateBusinessStatus(
    businessId: string,
    isActive: boolean,
    adminUserId: string,
    ipAddress?: string,
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Dorixona topilmadi.');
    }

    const updated = await this.prisma.business.update({
      where: { id: businessId },
      data: { is_active: isActive },
    });

    await this.audit.log({
      action: isActive ? 'ADMIN_BUSINESS_ACTIVATED' : 'ADMIN_BUSINESS_BLOCKED',
      entityName: 'business',
      entityId: businessId,
      businessId,
      userId: adminUserId,
      details: { previousStatus: business.is_active, newStatus: isActive, ip: ipAddress },
      ipAddress,
    });

    return updated;
  }
}

