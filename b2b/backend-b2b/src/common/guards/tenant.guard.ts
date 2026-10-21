import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Foydalanuvchi aniqlanmadi.');
    }

    // Super admin and admin can access cross-tenant data
    if (user.role === 'super_admin' || user.role === 'admin') {
      const explicitBusinessId =
        request.params?.businessId ||
        request.query?.business_id ||
        request.headers['x-business-id'] ||
        request.body?.business_id;

      if (explicitBusinessId) {
        request.businessId = explicitBusinessId;
      }
      return true;
    }

    // Regular users (owner, seller)
    const targetBusinessId =
      request.params?.businessId ||
      request.query?.business_id ||
      request.headers['x-business-id'] ||
      request.body?.business_id ||
      user.businessId;

    if (!targetBusinessId) {
      throw new NotFoundException(
        'Sizga biriktirilgan faol dorixona topilmadi. Iltimos, avval dorixona yarating yoki unga xodim bo‘lib qo‘shiling.',
      );
    }

    // Strict multi-tenant verification: user MUST belong to this business
    const membership = await this.prisma.businessUser.findUnique({
      where: {
        business_id_user_id: {
          business_id: targetBusinessId,
          user_id: user.id,
        },
      },
      include: {
        business: {
          select: { id: true, is_active: true, deleted_at: true },
        },
      },
    });

    if (!membership || !membership.business || !membership.business.is_active || membership.business.deleted_at) {
      throw new ForbiddenException(
        'Boshqa dorixona ma‘lumotlariga kirish qat‘iyan taqiqlangan (Multi-tenant isolation).',
      );
    }

    request.businessId = targetBusinessId;
    request.userRoleInBusiness = membership.role;

    return true;
  }
}
