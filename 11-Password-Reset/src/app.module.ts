import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { SeedService } from './seed.service';
import { AuthModule } from './auth/auth.module';

    @Module({
      imports: [TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Post],
      synchronize: true,
    }), TypeOrmModule.forFeature([User, Post]), AuthModule],
      controllers: [AppController],
      providers: [AppService, SeedService],
    })
    export class AppModule {}
