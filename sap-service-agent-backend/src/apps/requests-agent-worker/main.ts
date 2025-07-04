import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('RequestsAgentWorker');

  const port = process.env.WORKER_PORT || 3001;
  await app.listen(port);

  logger.log(`Requests Agent Worker started on port ${port}`);
}

bootstrap();
