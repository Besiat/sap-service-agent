import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServiceCallService } from './services/service-call.service';
import { FavoriteService } from './services/favorite.service';
import { ServiceCallRepository } from './repositories/service-call.repository';
import { FavoriteRepository } from './repositories/favorite.repository';
import { TenantDatabaseModule } from '../shared/database/tenant-database.module';
import { ServiceCallEntity } from './entities/service-call.entity';
import { FavoriteEntity } from './entities/favorite.entity';

@Module({
  imports: [
    ConfigModule,
    TenantDatabaseModule.forFeature({
      entities: [ServiceCallEntity, FavoriteEntity],
    }),
  ],
  providers: [
    ServiceCallService,
    FavoriteService,
    ServiceCallRepository,
    FavoriteRepository,
  ],
  exports: [
    ServiceCallService,
    FavoriteService,
    ServiceCallRepository,
    FavoriteRepository,
  ],
})
export class ServiceCallModule {}
