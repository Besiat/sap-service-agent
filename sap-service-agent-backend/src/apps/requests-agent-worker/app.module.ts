import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@sap-service-agent/shared';
import { ServiceCallModule } from '@sap-service-agent/service-calls';
import { AuthModule } from '@sap-service-agent/auth';
import { WorkerService } from './services/worker.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    ServiceCallModule,
    AuthModule,
  ],
  providers: [WorkerService],
})
export class AppModule {}
