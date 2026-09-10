import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Header('Content-Type', 'text/plain')
  home() { return 'Circuit Daily home'; }

  @Get('about')
  @Header('Content-Type', 'text/plain')
  about() { return 'About Circuit Daily'; }

  @Get('health')
  health() { return { ok: true }; }
}
