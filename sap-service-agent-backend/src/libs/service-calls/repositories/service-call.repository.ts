import { Injectable } from '@nestjs/common';
import { LessThanOrEqual } from 'typeorm';
import { ServiceCallEntity } from '../entities/service-call.entity';
import { ServiceCallStatus } from '../enums/service-call-status';
import {
  TenantDatabaseFactory,
  ServiceCallPaginationOptions,
  PaginatedResult,
} from '@sap-service-agent/shared';

@Injectable()
export class ServiceCallRepository {
  constructor(private readonly tenantDatabaseFactory: TenantDatabaseFactory) {}

  private async getTenantRepository(tenantId: string) {
    const connection = await this.tenantDatabaseFactory.getConnection(tenantId);
    return connection.getRepository(ServiceCallEntity);
  }

  async create(
    tenantId: string,
    serviceCallData: Partial<ServiceCallEntity>,
  ): Promise<ServiceCallEntity> {
    const repository = await this.getTenantRepository(tenantId);
    const serviceCall = repository.create(serviceCallData);
    return repository.save(serviceCall);
  }

  async findAllPaginated(
    tenantId: string,
    options: ServiceCallPaginationOptions,
  ): Promise<PaginatedResult<ServiceCallEntity>> {
    const repository = await this.getTenantRepository(tenantId);
    const { page, limit, favoritesOnly, userId, sortBy, sortOrder } = options;

    const skip = (page - 1) * limit;
    const orderDirection: 'ASC' | 'DESC' = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const queryBuilder = repository
      .createQueryBuilder('serviceCall')
      .skip(skip)
      .take(limit);

    if (sortBy) {
      queryBuilder.orderBy(`serviceCall.${sortBy}`, orderDirection);
    } else {
      queryBuilder.orderBy('serviceCall.createdAt', orderDirection);
    }

    if (favoritesOnly) {
      queryBuilder.innerJoin(
        'favorites',
        'favorite',
        'favorite.serviceCallId = serviceCall.id AND favorite.userId = :userId',
        { userId },
      );
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<ServiceCallEntity | null> {
    const repository = await this.getTenantRepository(tenantId);
    return repository.findOne({
      where: { id },
    });
  }

  async update(
    id: string,
    tenantId: string,
    updateData: Partial<ServiceCallEntity>,
  ): Promise<ServiceCallEntity | null> {
    const repository = await this.getTenantRepository(tenantId);
    const result = await repository.update({ id }, updateData);

    if (result.affected === 0) {
      return null;
    }

    return this.findById(id, tenantId);
  }

  async findScheduledServiceCalls(
    tenantId: string,
  ): Promise<ServiceCallEntity[]> {
    const now = new Date();
    const repository = await this.getTenantRepository(tenantId);

    return repository.find({
      where: {
        status: ServiceCallStatus.SCHEDULED,
        scheduledAt: LessThanOrEqual(now),
      },
      order: { scheduledAt: 'ASC' },
    });
  }
}
