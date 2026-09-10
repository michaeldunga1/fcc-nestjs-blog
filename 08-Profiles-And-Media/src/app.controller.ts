    import { Controller, Get, Post as HttpPost, Req, Res, Param, Query, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
    import { FileInterceptor } from '@nestjs/platform-express';
    import { InjectRepository } from '@nestjs/typeorm';
    import { Repository, ILike } from 'typeorm';
    import { Request, Response } from 'express';
    import * as bcrypt from 'bcryptjs';
    import * as crypto from 'crypto';
    import { diskStorage } from 'multer';
    import { extname, join } from 'path';
    import { User, Post } from './entities';

    type Sess = Request & { session: any };

    @Controller()
    export class AppController {
      constructor(
        @InjectRepository(User) private users: Repository<User>,
        @InjectRepository(Post) private posts: Repository<Post>,
      ) {}

      private async render(res: Response, req: Sess, view: string, data: any = {}) {
        const user = await this.currentUser(req);
        const flash = req.session?.flash;
        if (req.session) delete req.session.flash;
        const body = await new Promise<string>((resolve, reject) => {
          res.render(view, { ...data, user, canCreate: false, layout: false }, (err, html) => err ? reject(err) : resolve(html || ''));
        });
        return res.render('layout', { ...data, user, canCreate: false, flash, body, layout: false });
      }

      private async currentUser(req: Sess) {
        const id = req.session?.userId; if (!id) return null; return this.users.findOneBy({{ id }});
      }

      @Get()
      async home(@Req() req: Sess, @Res() res: Response, @Query('page') page = '1', @Query('q') q = '') {
        const qb = this.posts.createQueryBuilder('p').leftJoinAndSelect('p.author', 'a').orderBy('p.createdAt', 'DESC');

        if (false) {
          if (q) qb.where('p.title ILIKE :q OR p.content ILIKE :q', { q: `%${q}%` });
          const total = await qb.getCount();
          const pageSize = 5;
          const pages = Math.max(1, Math.ceil(total / pageSize));
          const pageNum = Math.min(Math.max(1, Number(page) || 1), pages);
          const rows = await qb.skip((pageNum - 1) * pageSize).take(pageSize).getMany();
          const posts = rows.map(p => ({ id: p.id, title: p.title, authorName: p.author.displayName, excerpt: p.content.length > 140 ? p.content.slice(0,140)+'…' : p.content }));
          return this.render(res, req, 'home', { title: 'Latest stories', heading: 'Latest stories', lead: 'Stories from Circuit Daily.', posts, q, qDefined: true, pagination: { page: pageNum, pages, prev: pageNum > 1 ? pageNum - 1 : null, next: pageNum < pages ? pageNum + 1 : null } });
        }
        const rows = await qb.take(50).getMany();

        const posts = rows.map(p => ({ id: p.id, title: p.title, authorName: p.author.displayName, excerpt: p.content.length > 140 ? p.content.slice(0,140)+'…' : p.content })); return this.render(res, req, 'home', { title: 'Latest stories', heading: 'Latest stories', lead: 'Stories from Circuit Daily.', posts });
      }

      @Get('about')
      about(@Req() req: Sess, @Res() res: Response) {
        return this.render(res, req, 'about', { title: 'About' });
      }

      @Get('posts/:id')
      async detail(@Param('id') id: string, @Req() req: Sess, @Res() res: Response) {
        const post = await this.posts.findOne({ where: { id: Number(id) }, relations: ['author'] });
        if (!post) return res.status(404).send('Not found');
        const user = await this.currentUser(req);
        const canEdit = false && user && user.id === post.author.id;
        return this.render(res, req, 'post_detail', { title: post.title, post: { id: post.id, title: post.title, content: post.content, authorName: post.author.displayName }, canEdit });
      }


      @Get('register')
      registerForm(@Req() req: Sess, @Res() res: Response) {
        return this.render(res, req, 'register', { title: 'Register' });
      }

      @HttpPost('register')
      async register(@Req() req: Sess, @Res() res: Response) {
        const username = String(req.body.username || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        if (password.length < 8) return this.render(res, req, 'register', { title: 'Register', error: 'Password must be at least 8 characters' });
        const exists = await this.users.findOne({ where: [{ username }, { email }] });
        if (exists) return this.render(res, req, 'register', { title: 'Register', error: 'Username or email already taken' });
        const user = this.users.create({ username, email, displayName: username, passwordHash: await bcrypt.hash(password, 10) });
        await this.users.save(user);
        req.session.userId = user.id; req.session.flash = 'Welcome aboard';
        return res.redirect('/');
      }


      @Get('login')
      loginForm(@Req() req: Sess, @Res() res: Response) {
        return this.render(res, req, 'login', { title: 'Log in' });
      }

      @HttpPost('login')
      async login(@Req() req: Sess, @Res() res: Response) {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const user = await this.users.findOne({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          return this.render(res, req, 'login', { title: 'Log in', error: 'Invalid email or password' });
        }
        req.session.userId = user.id;
        return res.redirect('/');
      }

      @Get('logout')
      logout(@Req() req: Sess, @Res() res: Response) {
        req.session.destroy(() => res.redirect('/'));
      }


      @Get('profile')
      async profileSelf(@Req() req: Sess, @Res() res: Response) {
        const user = await this.currentUser(req);
        if (!user) return res.redirect('/login');
        return res.redirect('/users/' + user.username);
      }

      @Get('users/:username')
      async profile(@Param('username') username: string, @Req() req: Sess, @Res() res: Response) {
        const profile = await this.users.findOne({ where: { username } });
        if (!profile) return res.status(404).send('Not found');
        const posts = await this.posts.find({ where: { author: { id: profile.id } }, order: { createdAt: 'DESC' } });
        const user = await this.currentUser(req);
        return this.render(res, req, 'profile', { title: profile.displayName, profile, posts, isSelf: !!(user && user.id === profile.id) });
      }

      @Get('profile/edit')
      async profileEditForm(@Req() req: Sess, @Res() res: Response) {
        const user = await this.currentUser(req);
        if (!user) return res.redirect('/login');
        return this.render(res, req, 'profile_edit', { title: 'Edit profile', profile: user });
      }

      @HttpPost('profile/edit')
      @UseInterceptors(FileInterceptor('image', {
        limits: { fileSize: 2 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
          if (!['image/jpeg','image/png','image/webp'].includes(file.mimetype)) return cb(new Error('Unsupported image type'), false);
          cb(null, true);
        },
        storage: diskStorage({
          destination: join(process.cwd(), 'uploads'),
          filename: (_req, file, cb) => cb(null, Date.now() + '-' + crypto.randomBytes(8).toString('hex') + extname(file.originalname)),
        }),
      }))
      async profileEdit(@Req() req: Sess, @Res() res: Response, @UploadedFile() file?: Express.Multer.File) {
        const user = await this.currentUser(req);
        if (!user) return res.redirect('/login');
        user.displayName = String(req.body.displayName || '').trim();
        user.bio = String(req.body.bio || '').trim();
        if (file) user.imagePath = '/uploads/' + file.filename;
        await this.users.save(user);
        return res.redirect('/users/' + user.username);
      }

}
