import { BadRequestException, Controller, ForbiddenException, Get, NotFoundException, Param, Post as HttpPost, Query, Req, Res, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get() root() { return this.appService.hello(); }
  @Get('about') about() { return 'About Circuit Daily'; }
  @Get('health') health() { return { ok: true }; }
}
