import { BadRequestException, Controller, ForbiddenException, Get, NotFoundException, Param, Post as HttpPost, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, @InjectRepository(User) private users: Repository<User>, @InjectRepository(Post) private posts: Repository<Post>) {}

  private render(res: Response, req: Request, view: string, data: Record<string, any> = {}) {
    const user = (req as any).user || null;
    const flash = (req.session as any)?.flash;
    if (req.session) (req.session as any).flash = undefined;
    const canCreate = false && !!user;
    return res.render(view, {
      layout: 'main',
      user,
      flash,
      canCreate,
      resetLink: false,
      detail: false,
      ...data,
    });
  }

  @Get('health') health() { return { ok: true }; }

  @Get()
  async home(@Req() req: Request, @Res() res: Response, @Query('page') pageRaw?: string, @Query('q') q?: string) {
    const rows = await this.posts.find({ order: { createdAt: 'DESC' }, relations: ['author'], take: 50 });
    const posts = rows.map((p) => ({
      id: undefined, title: p.title, authorName: p.author.displayName,
      excerpt: p.content.length > 140 ? p.content.slice(0, 140) + '…' : p.content,
    }));
    return this.render(res, req, 'home', { title: 'Latest stories', lead: 'Stories from the circuit desk.', posts });
  }

  @Get('about')
  about(@Req() req: Request, @Res() res: Response) {
    return this.render(res, req, 'about', { title: 'About' });
  }
}
