import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FavoriteRepository } from '../repositories/favorite.repository';
import { ServiceCallRepository } from '../repositories/service-call.repository';

@Injectable()
export class FavoriteService {
  constructor(
    private readonly favoriteRepository: FavoriteRepository,
    private readonly serviceCallRepository: ServiceCallRepository,
  ) {}

  async addToFavorites(
    tenantId: string,
    userId: string,
    serviceCallId: string,
  ): Promise<void> {
    const serviceCall = await this.serviceCallRepository.findById(
      serviceCallId,
      tenantId,
    );
    if (!serviceCall) {
      throw new NotFoundException('Service call not found');
    }

    const isFavorited = await this.favoriteRepository.isFavorite(
      tenantId,
      userId,
      serviceCallId,
    );
    if (isFavorited) {
      throw new ConflictException('Service call is already in favorites');
    }

    await this.favoriteRepository.addToFavorites(
      tenantId,
      userId,
      serviceCallId,
    );
  }

  async removeFromFavorites(
    tenantId: string,
    userId: string,
    serviceCallId: string,
  ): Promise<void> {
    const isFavorited = await this.favoriteRepository.isFavorite(
      tenantId,
      userId,
      serviceCallId,
    );
    if (!isFavorited) {
      throw new NotFoundException('Service call is not in favorites');
    }

    await this.favoriteRepository.removeFromFavorites(
      tenantId,
      userId,
      serviceCallId,
    );
  }

  async getUserFavoriteServiceCalls(
    tenantId: string,
    userId: string,
  ): Promise<string[]> {
    return this.favoriteRepository.getFavoriteServiceCallIds(tenantId, userId);
  }
}
