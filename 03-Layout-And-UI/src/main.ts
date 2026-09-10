import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import { engine } from 'express-handlebars';
import { AppModule } from './app.module';

loadEnv();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const views = join(process.cwd(), 'views');
  app.engine('hbs', engine({ extname: '.hbs', defaultLayout: 'main', layoutsDir: join(views, 'layouts'), partialsDir: join(views, 'partials') }));
  app.setBaseViewsDir(views);
  app.setViewEngine('hbs');
  app.useStaticAssets(join(process.cwd(), 'public'));
  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`Circuit Daily listening on http://127.0.0.1:${port}`);
}
bootstrap();
