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
    const canCreate = true && !!user;
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
    const page = Math.max(1, Number(pageRaw || 1) || 1);
    const pageSize = 5;
    const where = q ? [{ title: ILike(`%${q}%`) }, { content: ILike(`%${q}%`) }] : {};
    const [rows, total] = await this.posts.findAndCount({
      where: q ? where as any : undefined,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      relations: ['author'],
    });
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const posts = rows.map((p) => ({
      id: p.id, title: p.title, authorName: p.author.displayName,
      excerpt: p.content.length > 140 ? p.content.slice(0, 140) + '…' : p.content,
    }));
    return this.render(res, req, 'home', {
      title: 'Latest stories', lead: 'Stories from the circuit desk.', posts, q: q || '',
      pagination: { page, pages, prev: page > 1 ? page - 1 : null, next: page < pages ? page + 1 : null },
    });
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
    const canEdit = true && user && user.id === post.authorId;
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

  @Get('profile')
  profileSelf(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
    if (!user) return res.redirect('/login');
    return res.redirect(`/users/${user.username}`);
  }

  @Get('users/:username')
  async profile(@Param('username') username: string, @Req() req: Request, @Res() res: Response) {
    const profile = await this.users.findOne({ where: { username } });
    if (!profile) throw new NotFoundException();
    const user = (req as any).user;
    const posts = await this.posts.find({ where: { authorId: profile.id }, order: { createdAt: 'DESC' } });
    return this.render(res, req, 'profile', {
      title: profile.displayName, profile, posts, isSelf: !!(user && user.id === profile.id),
    });
  }

  @Get('profile/edit')
  profileEditForm(@Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
    if (!user) return res.redirect('/login');
    return this.render(res, req, 'profile_edit', { title: 'Edit profile', profile: user });
  }

  @HttpPost('profile/edit')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = join(process.cwd(), 'uploads');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(new BadRequestException('Unsupported image type') as any, false);
      cb(null, true);
    },
  }))
  async profileEdit(@Req() req: Request, @Res() res: Response, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    const user = (req as any).user as User;
    if (!user) return res.redirect('/login');
    user.displayName = String(body.displayName || '').trim();
    user.bio = String(body.bio || '').trim();
    if (file) user.imagePath = `/uploads/${file.filename}`;
    await this.users.save(user);
    return res.redirect(`/users/${user.username}`);
  }

  @Get('posts/new')
  newForm(@Req() req: Request, @Res() res: Response) {
    if (!(req as any).user) return res.redirect('/login');
    return this.render(res, req, 'post_form', { title: 'New post', heading: 'New post', error: null, titleValue: '', contentValue: '' });
  }

  @HttpPost('posts/new')
  async create(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    const user = (req as any).user as User;
    if (!user) return res.redirect('/login');
    const title = String(body.title || '').trim();
    const content = String(body.content || '').trim();
    if (title.length < 3) return this.render(res, req, 'post_form', { title: 'New post', heading: 'New post', error: 'Title too short', titleValue: title, contentValue: content });
    const post = await this.posts.save(this.posts.create({ title, content, author: user, authorId: user.id }));
    return res.redirect(`/posts/${post.id}`);
  }

  @Get('posts/:id/edit')
  async editForm(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const user = (req as any).user as User;
    const post = await this.posts.findOne({ where: { id: Number(id) } });
    if (!post) throw new NotFoundException();
    if (!user || user.id !== post.authorId) throw new ForbiddenException();
    return this.render(res, req, 'post_form', { title: 'Edit post', heading: 'Edit post', error: null, titleValue: post.title, contentValue: post.content });
  }

  @HttpPost('posts/:id/edit')
  async edit(@Param('id') id: string, @Req() req: Request, @Res() res: Response, @Body() body: any) {
    const user = (req as any).user as User;
    const post = await this.posts.findOne({ where: { id: Number(id) } });
    if (!post) throw new NotFoundException();
    if (!user || user.id !== post.authorId) throw new ForbiddenException();
    post.title = String(body.title || '').trim();
    post.content = String(body.content || '').trim();
    await this.posts.save(post);
    return res.redirect(`/posts/${post.id}`);
  }

  @HttpPost('posts/:id/delete')
  async remove(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const user = (req as any).user as User;
    const post = await this.posts.findOne({ where: { id: Number(id) } });
    if (!post) throw new NotFoundException();
    if (!user || user.id !== post.authorId) throw new ForbiddenException();
    await this.posts.remove(post);
    return res.redirect('/');
  }
}
