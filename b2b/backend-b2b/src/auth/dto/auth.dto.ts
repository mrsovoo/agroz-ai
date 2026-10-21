import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

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

export class SuperAdminLoginDto {
  @ApiProperty({ example: '+998901234567', description: 'Super admin telefon raqami' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'StrongPassword123!', description: 'Super admin paroli' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    example: '123456',
    required: false,
    description: 'Google Authenticator 6 xonali TOTP kodi',
  })
  @IsString()
  @IsOptional()
  @Length(6, 6)
  totp_code?: string;
}

export class ConfirmTotpSetupDto {
  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  totp_code!: string;
}
