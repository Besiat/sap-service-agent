import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant ID (optional, will be generated if not provided)',
    example: '0d38fe8d-65e3-4c17-b5fa-2c2ea9705380',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'Tenant name (must be unique)',
    example: 'Tenant Alpha',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
