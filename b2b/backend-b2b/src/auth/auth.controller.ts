import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto, SuperAdminLoginDto, VerifyOtpDto } from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telefon raqamga bir martalik 6 xonali OTP so‘rash (Telegram/SMS)' })
  @ApiResponse({ status: 200, description: 'OTP kodi muvaffaqiyatli yuborildi' })
  async requestOtp(@Body() dto: RequestOtpDto, @Ip() ip: string) {
    return this.authService.requestOtp(dto.phone, ip);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OTP kodni tekshirish va JWT token olish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli autentifikatsiya' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Ip() ip: string) {
    return this.authService.verifyOtpAndLogin(dto.phone, dto.code, ip);
  }

  @Post('super-admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super Admin kirish (Parol + Majburiy 2FA TOTP)' })
  @ApiResponse({ status: 200, description: 'Super Admin tokeni yoki 2FA talabi' })
  async superAdminLogin(@Body() dto: SuperAdminLoginDto, @Ip() ip: string) {
    return this.authService.superAdminLogin(dto, ip);
  }
}
