import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  home() {
    return { message: 'Circuit Daily is live', port: 3001 };
  }
}
