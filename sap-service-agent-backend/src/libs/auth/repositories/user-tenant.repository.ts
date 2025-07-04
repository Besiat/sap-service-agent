import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTenantEntity } from '../entities/user-tenant.entity';

@Injectable()
export class UserTenantRepository {
  constructor(
    @InjectRepository(UserTenantEntity)
    private readonly repository: Repository<UserTenantEntity>,
  ) {}

  async create(data: {
    userId: string;
    tenantId: string;
  }): Promise<UserTenantEntity> {
    const userTenant = this.repository.create(data);
    return this.repository.save(userTenant);
  }

  async findByUserIdAndTenantId(
    userId: string,
    tenantId: string,
  ): Promise<UserTenantEntity | null> {
    return this.repository.findOne({
      where: { userId, tenantId },
    });
  }

  async findTenantsWithDetailsByUserId(
    userId: string,
  ): Promise<{ id: string; name: string }[]> {
    const result = await this.repository.find({
      where: { userId },
      relations: ['tenant'],
      order: { createdAt: 'ASC' },
    });
    return result.map((ut) => ({
      id: ut.tenant.id,
      name: ut.tenant.name,
    }));
  }
}
