import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+998901234567', description: 'E.164 formatdagi telefon raqami' })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+998901234567', description: 'E.164 formatdagi telefon raqami' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456', description: '6 xonali tasdiqlash kodi' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class TelegramLinkTokenDto {
  @ApiProperty({ example: '+998901234567', description: 'E.164 formatdagi telefon raqami' })
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Mavjud refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Bekor qilinadigan refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class SuperAdminLoginDto {
  @ApiProperty({ example: '+998901234567 yoki admin@biznesgo.uz', description: 'Telefon yoki email' })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Super admin paroli' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class AdminSetup2FaDto {
  @ApiProperty({ description: 'Vaqtinchalik 2FA setup tokeni' })
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  @ApiProperty({ example: '123456', description: 'Google Authenticator 6 xonali kodi' })
  @IsString()
  @Length(6, 6)
  totpCode!: string;
}

export class AdminVerify2FaDto {
  @ApiProperty({ description: 'Vaqtinchalik login tokeni' })
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  @ApiProperty({ example: '123456 yoki A1B2C3D4', description: 'TOTP kodi yoki bir martalik recovery kod' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
