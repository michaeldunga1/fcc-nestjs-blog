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
        return null;
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

}
