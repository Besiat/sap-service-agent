import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ServiceCallRepository } from '../repositories/service-call.repository';
import { ServiceCallResponseDto } from '../dto/service-call-response.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { CreateServiceCallDto } from '../dto/create-service-call.dto';
import { UpdateServiceCallDto } from '../dto/update-service-call.dto';
import { ServiceCallEntity } from '../entities/service-call.entity';
import { ServiceCallStatus } from '../enums/service-call-status';
import { ResponseDetails } from '../types/response-details.interface';
import { ServiceCallPaginationOptions } from '@sap-service-agent/shared/index';

@Injectable()
export class ServiceCallService {
  constructor(private readonly serviceCallRepository: ServiceCallRepository) {}

  async createServiceCall(
    tenantId: string,
    createServiceCallDto: CreateServiceCallDto,
  ): Promise<ServiceCallResponseDto> {
    const { scheduledAt, ...ServiceCallData } = createServiceCallDto;

    const scheduleDate = scheduledAt ? new Date(scheduledAt) : new Date();

    const serviceCall = await this.serviceCallRepository.create(tenantId, {
      ...ServiceCallData,
      scheduledAt: scheduleDate,
      status: ServiceCallStatus.SCHEDULED,
      executedAt: null,
    });

    return ServiceCallResponseDto.fromEntity(serviceCall);
  }

  async getAllServiceCallsPaginated(
    tenantId: string,
    options: ServiceCallPaginationOptions,
  ): Promise<PaginatedResponseDto<ServiceCallResponseDto>> {
    const result = await this.serviceCallRepository.findAllPaginated(
      tenantId,
      options,
    );
    const serviceCalls = ServiceCallResponseDto.fromEntities(result.data);

    return new PaginatedResponseDto(
      serviceCalls,
      result.total,
      result.page,
      result.limit,
    );
  }

  async getServiceCallById(
    id: string,
    tenantId: string,
  ): Promise<ServiceCallResponseDto> {
    const ServiceCall = await this.serviceCallRepository.findById(id, tenantId);
    if (!ServiceCall) {
      throw new NotFoundException(`ServiceCall with ID ${id} not found`);
    }
    return ServiceCallResponseDto.fromEntity(ServiceCall);
  }

  async updateServiceCall(
    id: string,
    tenantId: string,
    updateServiceCallDto: UpdateServiceCallDto,
  ): Promise<ServiceCallResponseDto> {
    const existingServiceCall = await this.serviceCallRepository.findById(
      id,
      tenantId,
    );
    if (!existingServiceCall) {
      throw new NotFoundException(`ServiceCall with ID ${id} not found`);
    }

    if (
      existingServiceCall.status === ServiceCallStatus.COMPLETED ||
      existingServiceCall.status === ServiceCallStatus.RUNNING
    ) {
      throw new BadRequestException(
        'Cannot update a ServiceCall that has already been sent or is running',
      );
    }

    const updateData: Partial<ServiceCallEntity> = {};

    if (updateServiceCallDto.name) {
      updateData.name = updateServiceCallDto.name;
    }

    if (updateServiceCallDto.scheduledAt) {
      updateData.scheduledAt = new Date(updateServiceCallDto.scheduledAt);
    }

    if (updateServiceCallDto.requestDetails) {
      updateData.requestDetails = updateServiceCallDto.requestDetails;
    }

    const updatedServiceCall = await this.serviceCallRepository.update(
      id,
      tenantId,
      updateData,
    );
    if (!updatedServiceCall) {
      throw new NotFoundException(`ServiceCall with ID ${id} not found`);
    }

    return ServiceCallResponseDto.fromEntity(updatedServiceCall);
  }

  async getScheduledServiceCalls(
    tenantId: string,
  ): Promise<ServiceCallEntity[]> {
    return this.serviceCallRepository.findScheduledServiceCalls(tenantId);
  }

  async markServiceCallAsRunning(id: string, tenantId: string): Promise<void> {
    await this.serviceCallRepository.update(id, tenantId, {
      status: ServiceCallStatus.RUNNING,
      executedAt: new Date(),
    });
  }

  async markServiceCallAsCompleted(
    id: string,
    tenantId: string,
    responseDetails: ResponseDetails,
  ): Promise<void> {
    await this.serviceCallRepository.update(id, tenantId, {
      status: ServiceCallStatus.COMPLETED,
      responseDetails,
    });
  }

  async markServiceCallAsFailed(id: string, tenantId: string): Promise<void> {
    await this.serviceCallRepository.update(id, tenantId, {
      status: ServiceCallStatus.FAILED,
    });
  }
}
