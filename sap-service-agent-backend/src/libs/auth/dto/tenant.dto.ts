import { ApiProperty } from '@nestjs/swagger';

export class TenantDto {
  @ApiProperty({
    description: 'Tenant ID',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant name',
    example: 'Company A',
  })
  name: string;
}
