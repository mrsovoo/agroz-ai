import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'AgroVet Markaz', description: 'Dorixona yoki biznes nomi' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @ApiProperty({
    example: 'pharmacy',
    description: 'Sektor (Hozirda faqat pharmacy yoqilgan)',
    default: 'pharmacy',
  })
  @IsString()
  @IsNotEmpty()
  sector!: string;

  @ApiProperty({ example: 'UZ', required: false, default: 'UZ' })
  @IsString()
  @IsOptional()
  country_id?: string;

  @ApiProperty({ example: 'UZS', required: false, default: 'UZS' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'uz', required: false, default: 'uz' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ example: 'Toshkent sh., Chilonzor tumani', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 41.2995, required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 69.2401, required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class UpdateBusinessDto {
  @ApiProperty({ example: 'AgroVet Markaz Yangilangan', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiProperty({ example: 'Toshkent sh., Yunusobod tumani', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'uz', required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ example: 'UZS', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 41.3111, required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 69.2797, required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class AddStaffDto {
  @ApiProperty({ example: '+998901234567', description: 'Xodimning telefon raqami (E.164)' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'Botir', description: 'Xodim ismi' })
  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @ApiProperty({ example: 'Karimov', required: false, description: 'Xodim familiyasi' })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: 'seller', default: 'seller', description: 'Xodim roli' })
  @IsString()
  @IsOptional()
  role?: string;
}

export class UpdateStaffRoleDto {
  @ApiProperty({ example: 'seller', enum: ['seller', 'owner'], description: 'Yangi rol' })
  @IsString()
  @IsNotEmpty()
  role!: string;
}

