import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateAuditLogParams {
  action: string;
  entityName: string;
  entityId?: string;
  businessId?: string;
  userId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  countryId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          entity_name: params.entityName,
          entity_id: params.entityId,
          business_id: params.businessId,
          user_id: params.userId,
          details: params.details as Prisma.InputJsonValue | undefined,
          ip_address: params.ipAddress,
          country_id: params.countryId || 'UZ',
        },
      });
    } catch (error) {
      // Audit log failures should never crash critical paths, but must be logged
      this.logger.error(`Failed to record audit log: ${params.action}`, error);
    }
  }
}
