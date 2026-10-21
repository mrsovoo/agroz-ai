import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  AdminSetup2FaDto,
  AdminVerify2FaDto,
  SuperAdminLoginDto,
} from './dto/auth.dto';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super Admin kirish (Parol tekshirish -> 2FA bosqichiga o‘tish)' })
  @ApiResponse({ status: 200, description: '2FA talabi (setup yoki kod kiritish)' })
  async login(@Body() dto: SuperAdminLoginDto, @Ip() ip: string) {
    return this.authService.adminLogin(dto, ip);
  }

  @Post('setup-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Birinchi marta 2FA (TOTP) faollashtirish' })
  @ApiResponse({ status: 200, description: '2FA muvaffaqiyatli yoqildi va tokenlar berildi' })
  async setup2Fa(
    @Body() dto: AdminSetup2FaDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.adminSetup2Fa(dto, ip, userAgent);
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Google Authenticator 6 xonali kodi yoki 8 xonali recovery kod orqali kirish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli kirish va tokenlar' })
  async verify2Fa(
    @Body() dto: AdminVerify2FaDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.adminVerify2Fa(dto, ip, userAgent);
  }
}
