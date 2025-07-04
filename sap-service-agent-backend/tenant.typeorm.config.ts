import { DataSource } from 'typeorm';
import { createBaseDataSourceConfig } from './src/config/database/base.config';
import { ServiceCallEntity } from './src/libs/service-calls/entities/service-call.entity';
import { FavoriteEntity } from './src/libs/service-calls/entities/favorite.entity';

export default new DataSource(
  createBaseDataSourceConfig({
    database: process.env.TENANT_DB_NAME || 'tenant_alpha_db',
    entities: [ServiceCallEntity, FavoriteEntity],
    migrations: ['src/migrations/tenant/*.ts'],
    migrationsTableName: 'migrations',
  }),
);
