import { ApiProperty } from '@nestjs/swagger';
import { ServiceCallEntity } from '../entities/service-call.entity';
import { ServiceCallStatus } from '../enums/service-call-status';
import { RequestDetails } from '../types/service-call-details.interface';
import { ResponseDetails } from '../types/response-details.interface';

export class ServiceCallResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the service call',
    example: 'uuid-123-456-789',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the service call',
    example: 'Get Customer Data',
  })
  name: string;

  @ApiProperty({
    description: 'Current status of the service call',
    enum: ServiceCallStatus,
    example: ServiceCallStatus.SCHEDULED,
  })
  status: ServiceCallStatus;

  @ApiProperty({
    description: 'Scheduled execution time',
    example: '2025-06-28T10:00:00Z',
  })
  scheduledAt: Date;

  @ApiProperty({
    description: 'Actual execution time',
    example: '2025-06-28T10:05:00Z',
    nullable: true,
  })
  executedAt: Date | null;

  @ApiProperty({
    description: 'Service call request details',
    example: {
      url: 'https://api.example.com/customers',
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
      body: null,
    },
  })
  requestDetails: RequestDetails;

  @ApiProperty({
    description: 'Response details from the service call execution',
    required: false,
    nullable: true,
    example: {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: { customers: [] },
    },
  })
  responseDetails?: ResponseDetails;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-06-28T09:00:00Z',
  })
  createdAt: Date;

  constructor(entity: ServiceCallEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.status = entity.status;
    this.scheduledAt = entity.scheduledAt;
    this.executedAt = entity.executedAt;
    this.requestDetails = entity.requestDetails;
    this.responseDetails = entity.responseDetails;
    this.createdAt = entity.createdAt;
  }

  static fromEntity(entity: ServiceCallEntity): ServiceCallResponseDto {
    return new ServiceCallResponseDto(entity);
  }

  static fromEntities(entities: ServiceCallEntity[]): ServiceCallResponseDto[] {
    return entities.map((entity) => new ServiceCallResponseDto(entity));
  }
}
