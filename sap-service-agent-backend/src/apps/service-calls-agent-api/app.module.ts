import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '@sap-service-agent/shared';
import { ServiceCallModule } from '@sap-service-agent/service-calls';
import { AuthModule, JwtAuthGuard } from '@sap-service-agent/auth';
import { ServiceCallController } from './controllers/service-call.controller';
import { AuthController } from './controllers/auth.controller';
import { FavoriteController } from './controllers/favorite.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ServiceCallModule,
    AuthModule,
  ],
  controllers: [ServiceCallController, AuthController, FavoriteController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
