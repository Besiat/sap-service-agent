import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FavoriteEntity } from '../entities/favorite.entity';
import { TenantDatabaseFactory } from '@sap-service-agent/shared';

@Injectable()
export class FavoriteRepository {
  constructor(private readonly tenantDatabaseFactory: TenantDatabaseFactory) {}

  private async getTenantRepository(
    tenantId: string,
  ): Promise<Repository<FavoriteEntity>> {
    const connection = await this.tenantDatabaseFactory.getConnection(tenantId);
    return connection.getRepository(FavoriteEntity);
  }

  async addToFavorites(
    tenantId: string,
    userId: string,
    serviceCallId: string,
  ): Promise<FavoriteEntity> {
    const repository = await this.getTenantRepository(tenantId);
    const favorite = repository.create({
      userId,
      serviceCallId,
    });
    return repository.save(favorite);
  }

  async removeFromFavorites(
    tenantId: string,
    userId: string,
    serviceCallId: string,
  ): Promise<void> {
    const repository = await this.getTenantRepository(tenantId);
    await repository.delete({
      userId,
      serviceCallId,
    });
  }

  async isFavorite(
    tenantId: string,
    userId: string,
    serviceCallId: string,
  ): Promise<boolean> {
    const repository = await this.getTenantRepository(tenantId);
    const favorite = await repository.findOne({
      where: { userId, serviceCallId },
    });
    return !!favorite;
  }

  async getFavoriteServiceCallIds(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    const repository = await this.getTenantRepository(tenantId);
    const favorites = await repository.find({
      where: { userId },
      select: ['serviceCallId'],
    });
    return favorites.map((f) => f.serviceCallId);
  }
}
