import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createBaseDataSourceConfig } from '../../../config/database/base.config';
import {
  UserEntity,
  TenantEntity,
  UserTenantEntity,
} from '@sap-service-agent/auth';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return createBaseDataSourceConfig({
          database: configService.get<string>('DB_NAME'),
          entities: [UserEntity, TenantEntity, UserTenantEntity],
          migrations: ['dist/migrations/auth/*.js'],
        });
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
