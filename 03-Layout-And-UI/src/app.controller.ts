import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';
import { readFileSync } from 'fs';

@Controller()
export class AppController {
  private async render(res: Response, view: string, data: any = {}) {
    const hbs = require('hbs');
    const bodyPath = join(process.cwd(), 'views', view + '.hbs');
    const layoutPath = join(process.cwd(), 'views', 'layout.hbs');
    const body = hbs.handlebars.compile(readFileSync(bodyPath, 'utf8'))(data);
    const html = hbs.handlebars.compile(readFileSync(layoutPath, 'utf8'))({ ...data, body });
    res.type('html').send(html);
  }

  @Get()
  async home(@Res() res: Response) {
    return this.render(res, 'home', {
      title: 'Latest stories',
      heading: 'Latest stories',
      lead: 'Sample cards before persistence.',
      posts: [
        { title: 'Welcome to Circuit', authorName: 'Ada Lovelace', excerpt: 'A sample story card.' },
        { title: 'Wiring the UI', authorName: 'Grace Hopper', excerpt: 'UI before the database.' },
      ],
    });
  }

  @Get('about')
  about(@Res() res: Response) {
    return this.render(res, 'about', { title: 'About' });
  }
}
