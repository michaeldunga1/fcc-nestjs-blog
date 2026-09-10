import { BadRequestException, Controller, ForbiddenException, Get, NotFoundException, Param, Post as HttpPost, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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
  home(@Req() req: Request, @Res() res: Response) {
    const SAMPLE = [
      { title: 'Hello from the newsroom', authorName: 'Ada Lovelace', excerpt: 'First post from the teaching seed data.' },
      { title: 'Notes on ownership', authorName: 'Ada Lovelace', excerpt: 'Only the author should edit or delete this post.' },
    ];
    return this.render(res, req, 'home', { title: 'Latest stories', lead: 'Stories from the circuit desk.', posts: SAMPLE });
  }

  @Get('about')
  about(@Req() req: Request, @Res() res: Response) {
    return this.render(res, req, 'about', { title: 'About' });
  }
}
