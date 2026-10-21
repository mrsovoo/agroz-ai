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
  LogoutDto,
  RefreshTokenDto,
  RequestOtpDto,
  TelegramLinkTokenDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telefon raqamga bir martalik 6 xonali OTP so‘rash (Telegram/SMS)' })
  @ApiResponse({ status: 200, description: 'OTP holati yoki Telegram bog‘lash havolasi' })
  async requestOtp(@Body() dto: RequestOtpDto, @Ip() ip: string) {
    return this.authService.requestOtp(dto.phone, ip);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OTP kodni tekshirish va JWT token olish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli autentifikatsiya' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.verifyOtpAndLogin(dto.phone, dto.code, ip, userAgent);
  }

  @Post('telegram/link-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram hisobini bog‘lash uchun bir martalik havola olish' })
  @ApiResponse({ status: 200, description: 'Deep link va token' })
  async createTelegramLinkToken(@Body() dto: TelegramLinkTokenDto) {
    return this.authService.createTelegramLinkToken(dto.phone);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mavjud refresh token orqali yangi access token olish (Rotation)' })
  @ApiResponse({ status: 200, description: 'Yangi token juftligi' })
  async refreshTokens(
    @Body() dto: RefreshTokenDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.refreshTokens(dto.refreshToken, ip, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tizimdan chiqish va refresh tokenni bekor qilish' })
  @ApiResponse({ status: 200, description: 'Sessiya bekor qilindi' })
  async logout(@Body() dto: LogoutDto, @Ip() ip: string) {
    return this.authService.logout(dto.refreshToken, ip);
  }
}
