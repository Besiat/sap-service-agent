import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TenantEntity } from '../entities/tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repository: Repository<TenantEntity>,
  ) {}

  async create(tenantData: Partial<TenantEntity>): Promise<TenantEntity> {
    const tenant = this.repository.create(tenantData);
    return this.repository.save(tenant);
  }

  async findById(id: string): Promise<TenantEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<TenantEntity | null> {
    return this.repository.findOne({ where: { name } });
  }

  async findAll(): Promise<TenantEntity[]> {
    return this.repository.find({
      order: { name: 'ASC' },
    });
  }
}
