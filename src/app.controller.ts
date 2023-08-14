/* eslint-disable prettier/prettier */
import { MailerService } from '@nestjs-modules/mailer';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Session,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { AppService } from './app.service';
import { Role } from './common/decorator/role.decorator';
import { ApiProperty, ApiTags } from '@nestjs/swagger';

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
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/email/send')
  async sendEmail(
    @Body() emailDTO: EmailDTO,
    @Session() session: Record<string, any>,
  ) {
    const { email } = emailDTO;

    const code = await this.appService.sendEmail(email);

    if (code) {
      session.emailCode = code;
      return {
        message: '发送成功',
      };
    }
    return {
      message: '发送失败，请稍后再试',
    };
  }
}
