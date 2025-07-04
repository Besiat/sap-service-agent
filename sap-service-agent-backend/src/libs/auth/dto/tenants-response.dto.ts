import { ApiProperty } from '@nestjs/swagger';
import { TenantDto } from './tenant.dto';

export class TenantsResponseDto {
  @ApiProperty({
    description: 'List of tenants',
    type: [TenantDto],
  })
  tenants: TenantDto[];
}
