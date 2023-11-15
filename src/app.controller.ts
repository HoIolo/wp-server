/* eslint-disable prettier/prettier */
import { MailerService } from '@nestjs-modules/mailer';
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { AppService } from './app.service';
import { Role } from './common/decorator/role.decorator';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import Redis from 'ioredis';

class EmailDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}

@ApiTags('')
@Role(0)
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailerService: MailerService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/email/send')
  async sendEmail(@Body() emailDTO: EmailDTO) {
    const { email } = emailDTO;

    const code = await this.appService.sendEmail(email);

    if (code) {
      // 设置过期时间 5min
      this.redis.set(email, code, 'EX', 60 * 5);
      return {
        message: '发送成功',
      };
    }
    return {
      message: '发送失败，请稍后再试',
    };
  }
}
