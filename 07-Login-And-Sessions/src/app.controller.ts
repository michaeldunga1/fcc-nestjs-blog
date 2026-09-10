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
import { AuthGuard } from '@nestjs/passport';

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
      detail: true,
      ...data,
    });
  }

  @Get('health') health() { return { ok: true }; }

  @Get()
  async home(@Req() req: Request, @Res() res: Response, @Query('page') pageRaw?: string, @Query('q') q?: string) {
    const rows = await this.posts.find({ order: { createdAt: 'DESC' }, relations: ['author'], take: 50 });
    const posts = rows.map((p) => ({
      id: p.id, title: p.title, authorName: p.author.displayName,
      excerpt: p.content.length > 140 ? p.content.slice(0, 140) + '…' : p.content,
    }));
    return this.render(res, req, 'home', { title: 'Latest stories', lead: 'Stories from the circuit desk.', posts });
  }

  @Get('about')
  about(@Req() req: Request, @Res() res: Response) {
    return this.render(res, req, 'about', { title: 'About' });
  }

  @Get('posts/:id')
  async detail(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const post = await this.posts.findOne({ where: { id: Number(id) }, relations: ['author'] });
    if (!post) throw new NotFoundException();
    const user = (req as any).user;
    const canEdit = false && user && user.id === post.authorId;
    return this.render(res, req, 'post_detail', {
      title: post.title,
      post: { id: post.id, title: post.title, content: post.content.replace(/\n/g, '<br>'), authorName: post.author.displayName },
      canEdit,
    });
  }

  @Get('register')
  registerForm(@Req() req: Request, @Res() res: Response) {
    return this.render(res, req, 'register', { title: 'Register', error: null });
  }

  @HttpPost('register')
  async register(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (password.length < 8) return this.render(res, req, 'register', { title: 'Register', error: 'Password must be at least 8 characters' });
    const exists = await this.users.findOne({ where: [{ username }, { email }] });
    if (exists) return this.render(res, req, 'register', { title: 'Register', error: 'Username or email already taken' });
    const user = this.users.create({
      username, email, displayName: username, bio: '', imagePath: null,
      passwordHash: await bcrypt.hash(password, 10),
    });
    await this.users.save(user);
    return res.redirect('/login');
  }

  @Get('login')
  loginForm(@Req() req: Request, @Res() res: Response) {
    return this.render(res, req, 'login', { title: 'Log in', error: null });
  }

  @HttpPost('login')
  @UseGuards(AuthGuard('local'))
  login(@Req() req: Request, @Res() res: Response) {
    return res.redirect('/');
  }

  @Get('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    req.logout(() => res.redirect('/'));
  }
}
