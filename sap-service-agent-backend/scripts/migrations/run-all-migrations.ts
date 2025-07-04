import { DataSource } from 'typeorm';
import { createBaseDataSourceConfig } from '../../src/config/database/base.config';

function createDataSource(
  database: string,
  entities: any[],
  migrations: string[],
) {
  return new DataSource(
    createBaseDataSourceConfig({
      database,
      entities,
      migrations,
    }),
  );
}

async function runMigrations(dataSource: DataSource, description: string) {
  try {
    await dataSource.initialize();
    const migrations = await dataSource.runMigrations();

    if (migrations.length === 0) {
      console.log(`${description}: No migrations to run`);
    } else {
      console.log(`${description}: Ran ${migrations.length} migration(s)`);
    }
  } catch (error) {
    console.error(`Error running ${description}:`, error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function runAllMigrations() {
  console.log('Starting migration process...');

  const authDataSource = createDataSource(
    process.env.DB_NAME || 'sap_service_agent_auth',
    ['./src/libs/auth/entities/*.entity.{ts,js}'],
    ['./src/migrations/auth/*.ts'],
  );

  await runMigrations(authDataSource, 'Auth migrations');

  const tenantIdsEnv = process.env.TENANT_IDS;
  if (!tenantIdsEnv) {
    console.log('TENANT_IDS not set, skipping tenant migrations');
    return;
  }

  const tenantIds = tenantIdsEnv.split(',').map((id) => id.trim());

  for (const tenantId of tenantIds) {
    const dbName = `sap_service_agent_${tenantId}`;
    console.log(
      `Running migrations for tenant database: ${dbName} (tenant: ${tenantId})`,
    );

    const tenantDataSource = createDataSource(
      dbName,
      ['./src/libs/service-calls/entities/*.entity.{ts,js}'],
      ['./src/migrations/tenant/*.ts'],
    );

    await runMigrations(tenantDataSource, `Tenant migrations for ${dbName}`);
  }

  console.log('All migrations completed successfully!');
}

runAllMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
