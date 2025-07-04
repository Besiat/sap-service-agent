import { DataSourceOptions } from 'typeorm';

export const createBaseDataSourceConfig = (
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions => {
  const baseConfig: any = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  };

  return { ...baseConfig, ...overrides } as DataSourceOptions;
};
