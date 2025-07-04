import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RequestDetails } from '../types/service-call-details.interface';

export class CreateServiceCallDto {
  @ApiProperty({
    description: 'Name of the service call',
    example: 'Get Customer Data',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Scheduled execution time (ISO 8601 format)',
    example: '2025-06-28T10:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiProperty({
    description: 'Service call request details',
    example: {
      url: 'https://api.example.com/customers',
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
      body: null,
    },
  })
  @IsObject()
  @IsNotEmpty()
  requestDetails: RequestDetails;
}
