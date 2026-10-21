import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { BusinessService } from './business.service';
import {
  AddStaffDto,
  CreateBusinessDto,
  UpdateBusinessDto,
  UpdateStaffRoleDto,
} from './dto/business.dto';

@ApiTags('Business')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Yangi dorixona/biznes yaratish (avtomatik owner bo‘ladi)' })
  @ApiResponse({ status: 201, description: 'Biznes muvaffaqiyatli yaratildi' })
  async createBusiness(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBusinessDto,
    @Ip() ip: string,
  ) {
    return this.businessService.createBusiness(userId, dto, ip);
  }

  @Get()
  @ApiOperation({ summary: 'Joriy foydalanuvchining dorixonasi profili' })
  @ApiResponse({ status: 200, description: 'Dorixona ma‘lumotlari va xodimlar' })
  async getMyBusiness(@CurrentUser() user: any) {
    if (!user.businessId) {
      throw new NotFoundException(
        'Sizga biriktirilgan dorixona topilmadi. Iltimos, yangi dorixona yarating.',
      );
    }
    return this.businessService.getBusinessProfile(user.businessId);
  }

  @Patch()
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('owner', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Dorixona ma‘lumotlarini tahrirlash (faqat egasi)' })
  @ApiResponse({ status: 200, description: 'Dorixona yangilandi' })
  async updateBusiness(
    @Req() req: any,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBusinessDto,
    @Ip() ip: string,
  ) {
    return this.businessService.updateBusiness(req.businessId, userId, dto, ip);
  }

  @Get('staff')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('owner', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Dorixona xodimlari ro‘yxati' })
  @ApiResponse({ status: 200, description: 'Xodimlar ro‘yxati' })
  async listStaff(@Req() req: any) {
    return this.businessService.listStaff(req.businessId);
  }

  @Post('staff')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('owner', 'admin', 'super_admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dorixonaga yangi xodim qo‘shish (telefon raqam orqali)' })
  @ApiResponse({ status: 201, description: 'Xodim biriktirildi' })
  async addStaff(
    @Req() req: any,
    @CurrentUser('id') currentUserId: string,
    @Body() dto: AddStaffDto,
    @Ip() ip: string,
  ) {
    return this.businessService.addStaff(req.businessId, currentUserId, dto, ip);
  }

  @Patch('staff/:staffUserId/role')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('owner', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Xodim rolini o‘zgartirish' })
  async updateStaffRole(
    @Req() req: any,
    @CurrentUser('id') currentUserId: string,
    @Param('staffUserId') staffUserId: string,
    @Body() dto: UpdateStaffRoleDto,
    @Ip() ip: string,
  ) {
    return this.businessService.updateStaffRole(
      req.businessId,
      currentUserId,
      staffUserId,
      dto,
      ip,
    );
  }

  @Delete('staff/:staffUserId')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles('owner', 'admin', 'super_admin')
  @ApiOperation({ summary: 'Xodimni dorixonadan chiqarish' })
  async removeStaff(
    @Req() req: any,
    @CurrentUser('id') currentUserId: string,
    @Param('staffUserId') staffUserId: string,
    @Ip() ip: string,
  ) {
    return this.businessService.removeStaff(req.businessId, currentUserId, staffUserId, ip);
  }
}
