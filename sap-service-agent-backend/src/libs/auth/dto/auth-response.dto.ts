import { ApiProperty } from '@nestjs/swagger';
import { TenantDto } from './tenant.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expires_in: number;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    username: string;
  };

  @ApiProperty({
    description: 'Selected tenant information',
    type: TenantDto,
    required: false,
  })
  selectedTenant?: TenantDto;
}
