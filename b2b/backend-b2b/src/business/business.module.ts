import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuditModule } from '../audit/audit.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminBusinessController } from './admin-business.controller';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

@Module({
  imports: [
    JwtModule.register({}),
    PrismaModule,
    AuditModule,
  ],
  controllers: [BusinessController, AdminBusinessController],
  providers: [BusinessService, JwtAuthGuard, RolesGuard, TenantGuard],
  exports: [BusinessService, JwtAuthGuard, RolesGuard, TenantGuard],
})
export class BusinessModule {}

