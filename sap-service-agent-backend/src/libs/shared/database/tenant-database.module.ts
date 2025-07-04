import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantDatabaseFactory } from './tenant-database-factory.service';

export interface TenantDatabaseModuleOptions {
  entities: any[];
}

@Module({})
export class TenantDatabaseModule {
  static forFeature(options: TenantDatabaseModuleOptions): DynamicModule {
    return {
      module: TenantDatabaseModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: TenantDatabaseFactory,
          useFactory: (configService: ConfigService) => {
            return new TenantDatabaseFactory(configService, options.entities);
          },
          inject: [ConfigService],
        },
      ],
      exports: [TenantDatabaseFactory],
    };
  }
}
