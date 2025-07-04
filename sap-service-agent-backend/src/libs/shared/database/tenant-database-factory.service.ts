import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createBaseDataSourceConfig } from '../../../config/database/base.config';

@Injectable()
export class TenantDatabaseFactory {
  private connections = new Map<string, DataSource>();

  constructor(
    private configService: ConfigService,
    private entities: any[] = [],
  ) {}

  private getDatabaseName(tenantId: string): string {
    return `sap_service_agent_${tenantId}`;
  }

  async getConnection(tenantId: string): Promise<DataSource> {
    if (!this.connections.has(tenantId)) {
      const dbName = this.getDatabaseName(tenantId);

      const connection = new DataSource(
        createBaseDataSourceConfig({
          database: dbName,
          entities: this.entities,
        }),
      );

      await connection.initialize();
      this.connections.set(tenantId, connection);
    }

    return this.connections.get(tenantId)!;
  }
}
