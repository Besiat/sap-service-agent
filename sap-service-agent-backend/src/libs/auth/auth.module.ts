import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { UserTenantEntity } from './entities/user-tenant.entity';
import { TenantEntity } from './entities/tenant.entity';
import { AuthService } from './services/auth.service';
import { UserRepository } from './repositories/user.repository';
import { UserTenantRepository } from './repositories/user-tenant.repository';
import { TenantRepository } from './repositories/tenant.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, UserTenantEntity, TenantEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    UserRepository,
    UserTenantRepository,
    TenantRepository,
    JwtStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
