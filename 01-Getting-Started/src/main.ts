import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { AppModule } from './app.module';

loadEnv();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`Circuit Daily listening on http://127.0.0.1:${port}`);
}
bootstrap();
