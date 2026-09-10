import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config } from 'dotenv';
import { AppModule } from './app.module';
import { seed } from "./seed";

async function bootstrap() {
  config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

      const expressApp = app.getHttpAdapter().getInstance();
      expressApp.use('/public', require('express').static(join(process.cwd(), 'public')));
      app.setBaseViewsDir(join(process.cwd(), 'views'));
      app.setViewEngine('hbs');
      const hbs = require('hbs');
      hbs.registerPartials(join(process.cwd(), 'views'));
      // layout helper via express-hbs style: use res.render with layout manually in controller

      const session = require('express-session');
      expressApp.use(session({
        secret: process.env.SESSION_SECRET || 'dev-only-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.SESSION_HTTPS_ONLY === 'true' },
      }));

  await seed(app);
  await app.listen(Number(process.env.PORT) || 3001);
  console.log('Circuit Daily on', process.env.PORT || 3001);
}
bootstrap();
