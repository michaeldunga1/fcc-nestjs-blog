import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config } from 'dotenv';
import { AppModule } from './app.module';

async function bootstrap() {
  config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use('/public', require('express').static(join(process.cwd(), 'public')));
  await app.listen(Number(process.env.PORT) || 3001);
  console.log('Circuit Daily on', process.env.PORT || 3001);
}
bootstrap();
