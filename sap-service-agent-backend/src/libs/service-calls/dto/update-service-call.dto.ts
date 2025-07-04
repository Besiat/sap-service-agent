import { IsString, IsOptional, IsObject, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RequestDetails } from '../types/service-call-details.interface';

export class UpdateServiceCallDto {
  @ApiProperty({
    description: 'Name of the service call',
    example: 'Updated Customer Data Call',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Scheduled execution time (ISO 8601 format)',
    example: '2025-06-28T15:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiProperty({
    description: 'Updated service call request details',
    example: {
      url: 'https://api.example.com/customers/updated',
      method: 'POST',
      headers: { Authorization: 'Bearer new-token' },
      body: { filter: 'active' },
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  requestDetails?: RequestDetails;
}
