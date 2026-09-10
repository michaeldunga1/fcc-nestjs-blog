import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { SeedService } from './seed.service';

    @Module({
      imports: [TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Post],
      synchronize: true,
    }), TypeOrmModule.forFeature([User, Post])],
      controllers: [AppController],
      providers: [AppService, SeedService],
    })
    export class AppModule {}
