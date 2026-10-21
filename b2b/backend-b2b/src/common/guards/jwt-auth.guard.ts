import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Autentifikatsiya talab qilinadi. Bearer token topilmadi.');
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) {
      throw new UnauthorizedException('Yaroqsiz token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET', 'access_secret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          business_users: {
            take: 1,
            select: { business_id: true, role: true },
          },
        },
      });

      if (!user || !user.is_active || user.deleted_at) {
        throw new UnauthorizedException('Foydalanuvchi hisobi faol emas yoki o‘chirilgan.');
      }

      (request as any).user = {
        id: user.id,
        phone: user.phone,
        role: user.role,
        email: user.email,
        businessId: user.business_users[0]?.business_id ?? null,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Token yaroqsiz yoki muddati tugagan.');
    }
  }
}
