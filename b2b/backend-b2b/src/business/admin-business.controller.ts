import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { BusinessService } from './business.service';

export class UpdateBusinessStatusDto {
  is_active!: boolean;
}

@ApiTags('Admin Businesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin')
@Controller('admin/businesses')
export class AdminBusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  @ApiOperation({ summary: 'Super Admin: Barcha dorixonalar ro‘yxati (qidiruv, filtr va sahifalash)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sector', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Dorixonalar ro‘yxati' })
  async listBusinesses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sector') sector?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.businessService.adminListBusinesses({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      sector,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Super Admin: Aniq bir dorixonani ko‘rish' })
  async getBusiness(@Param('id') id: string) {
    return this.businessService.getBusinessProfile(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super Admin: Dorixonani faollashtirish yoki bloklash' })
  @ApiResponse({ status: 200, description: 'Status yangilandi' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessStatusDto,
    @CurrentUser('id') adminUserId: string,
    @Ip() ip: string,
  ) {
    return this.businessService.adminUpdateBusinessStatus(id, dto.is_active, adminUserId, ip);
  }
}

